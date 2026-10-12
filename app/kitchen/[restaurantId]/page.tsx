'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type OrderItem = { id: string; name: string; quantity: number; unit_price: number }
type Order = {
  id: string; serial_number: string; customer_name: string | null
  status: string; payment_method: string; payment_status: string
  created_at: string; order_items: OrderItem[]
}
type BatchGroup = { name: string; total: number; serials: string[]; orderIds: string[] }
type KitchenDevice = {
  id?: string
  token: string
  device_name?: string
  last_seen?: string
}

const buildBatches = (orders: Order[]): BatchGroup[] => {
  const map: Record<string, BatchGroup> = {}
  orders.forEach(o => {
    o.order_items.forEach(item => {
      if (!map[item.name]) map[item.name] = { name: item.name, total: 0, serials: [], orderIds: [] }
      map[item.name].total += item.quantity
      if (!map[item.name].serials.includes(o.serial_number)) {
        map[item.name].serials.push(o.serial_number)
        map[item.name].orderIds.push(o.id)
      }
    })
  })
  return Object.values(map).filter(b => b.serials.length > 1)
}

const generateToken = () => Math.random().toString(36).substring(2, 10).toUpperCase()

export default function KitchenPage({ params }: { params: { restaurantId: string } }) {
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('Restaurant')
  const [orders, setOrders] = useState<Order[]>([])
  const [voiceOn, setVoiceOn] = useState(true)
  const [showQr, setShowQr] = useState(false)
  const [devices, setDevices] = useState<KitchenDevice[]>([])
  const [newToken, setNewToken] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [loading, setLoading] = useState(true)
  const seenOrderIds = useRef<Set<string>>(new Set())
  const initialLoadDone = useRef(false)

  useEffect(() => { setMounted(true) }, [])

  // Load restaurant
useEffect(() => {
  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      window.location.href = '/auth/login'
      return
    }
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('owner_id', user.id)
      .maybeSingle()

    console.log('Kitchen: restaurant fetch', { data, error })

    if (data) {
      setRestaurantId(data.id)
      setBusinessName(data.name)
      // Fetch orders immediately
      await fetchOrders(data.id)
    } else {
      setLoading(false)
    }
  }
  load()
}, [])

  // Load orders
  const fetchOrders = useCallback(async (rid: string) => {
    const { data } = await supabase
      .from('orders')
      .select(`
        id, serial_number, customer_name, status, payment_method,
        payment_status, created_at,
        order_items ( id, name, quantity, unit_price )
      `)
      .eq('restaurant_id', rid)
      .eq('payment_status', 'paid')
      .in('status', ['confirmed', 'preparing'])
      .order('created_at', { ascending: true })

    setOrders((data as any) || [])
    setLoading(false)
  }, [])

  const speak = useCallback((text: string) => {
  if (!voiceOn || typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'hi-IN'; u.rate = 0.88; u.volume = 1
  window.speechSynthesis.speak(u)
}, [voiceOn])

  // Announce new orders via voice
useEffect(() => {
  if (!voiceOn) return
  if (orders.length === 0) return

  // First load — mark all existing as seen, no announcement
  if (!initialLoadDone.current) {
    orders.forEach(o => seenOrderIds.current.add(o.id))
    initialLoadDone.current = true
    return
  }

  // Find new orders not yet seen
  const newOrders = orders.filter(o => !seenOrderIds.current.has(o.id))

  newOrders.forEach(order => {
    // Build announcement text
    const itemsText = order.order_items
      .map(i => `${i.name}, ${i.quantity}`)
      .join('. ')
    const customerText = order.customer_name ? `, ${order.customer_name}` : ''
    const text = `New order. ${itemsText}${customerText}.`

    // Speak one at a time
    speak(text)

    // Mark as seen
    seenOrderIds.current.add(order.id)
  })
}, [orders, voiceOn, speak])

  // Realtime
  useEffect(() => {
    if (!restaurantId) return
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        () => fetchOrders(restaurantId)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [restaurantId, fetchOrders])

  // Load devices
  useEffect(() => {
    if (!restaurantId) return
    const load = async () => {
      const { data } = await supabase
        .from('kitchen_devices')
        .select('*')
        .eq('restaurant_id', restaurantId)
      if (data) setDevices(data as any)
    }
    load()
  }, [restaurantId])

  const timeAgo = (d: string) => {
    if (!mounted) return '—'
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (m < 1) return 'just now'
    if (m === 1) return '1 min'
    return `${m} min`
  }

  const batches = buildBatches(orders)

  const generateQr = async () => {
    if (devices.length >= 3) { alert('Maximum 3 cook devices allowed.'); return }
    if (!restaurantId) return
    const token = generateToken()
    setNewToken(token)
    const name = deviceName.trim() || `Device ${devices.length + 1}`

    const { data, error } = await supabase
      .from('kitchen_devices')
      .insert({ restaurant_id: restaurantId, token, device_name: name })
      .select()
      .single()

    if (error) { alert('Error: ' + error.message); return }
    setDevices([...devices, data as any])
    setDeviceName('')
  }

  const revokeDevice = async (token: string) => {
    await supabase.from('kitchen_devices').delete().eq('token', token)
    setDevices(devices.filter(d => d.token !== token))
  }

  const C = {
    bg: '#EBEBE8', surface: '#FFFFFF', surface2: '#F4F4F2', border: '#D9D9D5',
    gold: '#B8923A', goldBright: '#C9A84C', text: '#111111',
    muted: '#6B6B6B', muted2: '#999999',
    green: '#16A34A', greenBg: '#F0FDF4', greenBdr: '#BBF7D0',
    amber: '#B45309', amberBg: '#FEF9EC', amberBdr: '#FDE68A',
    red: '#DC2626', redBg: '#FEF2F2', redBdr: '#FECACA',
    topbar: '#111111',
  }

  const kitchenUrl = `http://localhost:3000/kitchen/${restaurantId}?token=${newToken}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(kitchenUrl)}`

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBEBE8] flex items-center justify-center" style={{ fontFamily: 'system-ui' }}>
        <div className="text-sm text-gray-500">Loading kitchen...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter', system-ui, sans-serif", color: C.text }}>

      {/* Top bar */}
      <div style={{ background: C.topbar, borderBottom: `1px solid #222`, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '10px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'nowrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 1 }}>
            <img src="/ordexaa-logo.jpeg" alt="Ordexaa" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.15em', color: '#FFF', lineHeight: 1.1 }}>ORDEXAA</div>
              <div style={{ fontSize: 8, color: C.goldBright, letterSpacing: '0.18em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>KITCHEN · {businessName}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <div className="hidden sm:block" style={{ background: '#1A1A1A', border: `1px solid #2A2A2A`, borderRadius: 20, padding: '4px 10px', fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>
              <span style={{ color: C.goldBright, fontWeight: 700 }}>{orders.length}</span> orders
            </div>

            <button
              onClick={() => setVoiceOn(v => !v)}
              style={{ background: voiceOn ? '#1A1500' : '#1A1A1A', border: `1px solid ${voiceOn ? '#3A3000' : '#2A2A2A'}`, borderRadius: 8, padding: '6px 8px', fontSize: 11, color: voiceOn ? '#FBBF24' : '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              {voiceOn ? '🔊' : '🔇'}
              <span className="hidden sm:inline">{voiceOn ? 'Voice On' : 'Voice Off'}</span>
            </button>

            <button
              onClick={() => setShowQr(true)}
              style={{ background: '#1A1500', border: `1px solid #3A3000`, borderRadius: 8, padding: '6px 8px', fontSize: 11, color: '#FBBF24', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              🔳 <span className="hidden sm:inline">Kitchen QR</span>
              <span style={{ background: devices.length >= 3 ? '#7F1D1D' : '#3A3000', color: devices.length >= 3 ? '#FCA5A5' : '#FBBF24', fontSize: 9, padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                {devices.length}/3
              </span>
            </button>

            <a
              href="/dashboard"
              style={{ background: '#1A1A1A', border: `1px solid #2A2A2A`, borderRadius: 8, padding: '6px 8px', fontSize: 11, color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}
            >
              ← <span className="hidden sm:inline">Dashboard</span>
            </a>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 14px', maxWidth: 1100, margin: '0 auto' }}>

        {batches.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: C.amber, textTransform: 'uppercase', marginBottom: 8 }}>
              AI Batch — Make Together
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {batches.map((b, i) => (
                <div key={i} style={{ background: C.surface, border: `2px solid ${C.amberBdr}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: C.amber, fontFamily: 'monospace', flexShrink: 0 }}>{b.total}×</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Orders: {b.serials.map(s => `#${s}`).join(', ')}
                    </div>
                  </div>
                  <div style={{ fontSize: 9, background: C.amberBg, border: `1px solid ${C.amberBdr}`, borderRadius: 20, padding: '3px 10px', color: C.amber, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0 }}>
                    BATCH
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 36, marginBottom: 14, color: '#CCC' }}>—</div>
            <div style={{ fontSize: 15, color: C.muted }}>No active orders</div>
            <div style={{ fontSize: 12, color: C.muted2, marginTop: 6 }}>New orders will appear here automatically</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {orders.map((order, idx) => {
              const isFirst = idx === 0
              const waitMins = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)
              const isLate = waitMins >= 10

              return (
                <div
                  key={order.id}
                  style={{
                    background: isFirst ? '#FFFDF5' : C.surface,
                    border: isFirst ? `2px solid ${C.goldBright}` : `1px solid ${C.border}`,
                    borderRadius: 14,
                    padding: 16,
                    position: 'relative',
                    boxShadow: isFirst ? '0 4px 16px rgba(201,168,76,0.15)' : '0 2px 6px rgba(0,0,0,0.04)',
                  }}
                >
                  {isLate && (
                    <div style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 4, background: C.red, borderRadius: '14px 14px 0 0' }} />
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 24, fontWeight: 900, color: C.gold, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                          #{order.serial_number}
                        </span>
                        {isFirst && (
                          <span style={{ fontSize: 9, background: C.greenBg, border: `1px solid ${C.greenBdr}`, color: C.green, borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>
                            NOW
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: order.customer_name ? C.text : C.muted2, fontStyle: order.customer_name ? 'normal' : 'italic' }}>
                        {order.customer_name || 'No name'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 10, color: isLate ? C.red : C.muted, fontWeight: isLate ? 700 : 500 }}>
                        {timeAgo(order.created_at)}{isLate ? ' ⚠' : ''}
                      </div>
                      <div style={{ fontSize: 9, color: C.muted2, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                        {order.payment_method}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {order.order_items.map(item => {
                      const isBatched = batches.some(b => b.name === item.name)
                      return (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isBatched ? C.amberBg : C.surface2, border: `1px solid ${isBatched ? C.amberBdr : C.border}`, borderRadius: 8, padding: '8px 10px', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span style={{ fontSize: 15, fontWeight: 900, color: isBatched ? C.amber : C.gold, fontFamily: 'monospace', minWidth: 26, flexShrink: 0 }}>
                              {item.quantity}×
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: isBatched ? C.amber : C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                          </div>
                          {isBatched && (
                            <span style={{ fontSize: 8, color: C.amber, fontWeight: 800, letterSpacing: '0.08em', flexShrink: 0 }}>BATCH</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {showQr && (
        <>
          <div onClick={() => setShowQr(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 101, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pointerEvents: 'none' }} className="sm:items-center sm:p-4">
            <div style={{ background: '#FFFFFF', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', pointerEvents: 'auto' }} className="sm:rounded-2xl">

              <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>Kitchen Access</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Generate a QR for each cook device</div>
                </div>
                <button onClick={() => setShowQr(false)} style={{ background: 'none', border: 'none', fontSize: 24, color: '#999', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>

              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 20 }}>
                  {devices.length >= 3 ? (
                    <div style={{ padding: 14, background: '#FEF9EC', border: '1px solid #FDE68A', borderRadius: 10, fontSize: 12, color: '#92400E', textAlign: 'center' }}>
                      ⚠️ Maximum 3 cook devices reached. Revoke one to add a new device.
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8 }}>Generate new device QR ({devices.length}/3)</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          placeholder="Device name (e.g., Cook 1)"
                          value={deviceName}
                          onChange={e => setDeviceName(e.target.value)}
                          style={{ flex: 1, minWidth: 150, padding: '10px 12px', border: '1px solid #E5E5E5', borderRadius: 8, fontSize: 13, outline: 'none' }}
                        />
                        <button
                          onClick={generateQr}
                          style={{ padding: '10px 16px', background: '#C9A84C', color: '#FFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Generate QR
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {newToken && (
                  <div style={{ marginBottom: 20, padding: 16, background: '#FBF7ED', border: '1px solid #F5D98B', borderRadius: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>
                      Scan this QR on the cook's device
                    </div>
                    <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'center' }}>
                      <img src={qrUrl} alt="Kitchen QR" style={{ width: '100%', maxWidth: 220, aspectRatio: '1' }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#92400E', textAlign: 'center', marginTop: 10, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      Token: {newToken}
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8 }}>
                    Active devices ({devices.length})
                  </div>
                  {devices.length === 0 ? (
                    <div style={{ padding: 16, background: '#F8F8F8', borderRadius: 10, fontSize: 12, color: '#999', textAlign: 'center' }}>
                      No devices connected yet
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {devices.map(d => (
                        <div key={d.token} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 10, gap: 8 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{d.device_name || 'Device'}</div>
                            <div style={{ fontSize: 10, color: '#999', fontFamily: 'monospace', marginTop: 2 }}>Token: {d.token}</div>
                          </div>
                          <button
                            onClick={() => revokeDevice(d.token)}
                            style={{ padding: '6px 12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}