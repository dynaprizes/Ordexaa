'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Order = {
  id: string
  serial_number: string
  customer_name: string | null
  customer_phone: string | null
  total_amount: number
  payment_method: string
  payment_status: string
  status: string
  is_home_order: boolean
  created_at: string
  order_items: { id: string; name: string; quantity: number }[]
}

export default function DashboardPage() {
  const supabase = createClient()

  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<'active' | 'ready' | 'all'>('active')
  const [cashSerial, setCashSerial] = useState('')
  const [cashError, setCashError] = useState('')
  const [searchSerial, setSearchSerial] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => { setMounted(true) }, [])

  // Load restaurant + initial orders
  useEffect(() => {
    const init = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: rest } = await supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!rest) return
  setRestaurantId(rest.id)
  await fetchOrders(rest.id)

  // Fetch subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('restaurant_id', rest.id)
    .maybeSingle()

 console.log('Subscription fetched:', sub)
if (sub) setSubscription(sub)
}
    init()
  }, [])

  // Realtime subscription
  useEffect(() => {
    if (!restaurantId) return

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        () => { fetchOrders(restaurantId) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId])

  const fetchOrders = async (rid: string) => {
    const { data } = await supabase
      .from('orders')
      .select(`
        id, serial_number, customer_name, customer_phone, total_amount,
        payment_method, payment_status, status, is_home_order, created_at,
        order_items ( id, name, quantity )
      `)
      .eq('restaurant_id', rid)
      .order('created_at', { ascending: false })

    setOrders((data as any) || [])
  }

  const handleRefresh = async () => {
    if (!restaurantId) return
    setRefreshing(true)
    await fetchOrders(restaurantId)
    setTimeout(() => setRefreshing(false), 400)
  }

  const markReady = async (order: Order) => {
    await supabase.from('orders').update({ status: 'ready' }).eq('id', order.id)
    if (restaurantId) fetchOrders(restaurantId)
  }

  const markCollected = async (order: Order) => {
    await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id)
    setSelectedOrder(null)
    if (restaurantId) fetchOrders(restaurantId)
  }

  const confirmCash = async () => {
    if (!cashSerial.trim() || cashSerial.length !== 4) {
      setCashError('Enter 4-digit serial number')
      return
    }
    const order = orders.find(o =>
      o.serial_number === cashSerial &&
      o.payment_method === 'cash' &&
      o.payment_status === 'pending'
    )
    if (!order) {
      setCashError('Order not found. Check serial number.')
      return
    }
    await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'confirmed' })
      .eq('id', order.id)
    setCashSerial('')
    setCashError('')
    if (restaurantId) fetchOrders(restaurantId)
  }

  const cashPending = orders.filter(o =>
    o.payment_method === 'cash' && o.payment_status === 'pending'
  )

  const filteredOrders = orders
    .filter(o => !(o.payment_method === 'cash' && o.payment_status === 'pending'))
    .filter(o => {
      if (filter === 'active') return ['confirmed', 'preparing'].includes(o.status)
      if (filter === 'ready') return o.status === 'ready'
      if (filter === 'all') return true
      return true
    })
    .filter(o => {
      if (!searchSerial.trim()) return true
      return o.serial_number.includes(searchSerial.trim())
    })
    .sort((a, b) => {
      if (filter === 'active') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const activeOrdersCount = orders.filter(o =>
    !(o.payment_method === 'cash' && o.payment_status === 'pending') &&
    ['confirmed', 'preparing'].includes(o.status)
  ).length

  const statusConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    confirmed: { label: 'Confirmed', bg: '#FEF9EC', text: '#92400E', border: '#FDE68A' },
    preparing: { label: 'Preparing', bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
    ready:     { label: 'Ready',     bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0' },
    completed: { label: 'Done',      bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' },
  }

  const timeAgo = (dateStr: string) => {
    if (!mounted) return '—'
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (diff < 1) return 'just now'
    if (diff === 1) return '1 min ago'
    if (diff < 60) return `${diff} mins ago`
    return `${Math.floor(diff / 60)} hrs ago`
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Top Bar */}
      <div className="bg-[#111111] border-b border-[#222] sticky top-0 z-50">
        <div className="max-w-[1100px] mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/ordexaa-logo.jpeg" alt="Ordexaa" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs sm:text-base font-bold tracking-widest text-white leading-tight">ORDEXAA</div>
              <div className="text-[7px] sm:text-[9px] text-[#C9A84C] tracking-[0.2em] leading-tight">ORDER. MANAGE. GROW.</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <a href="/dashboard/menu" className="text-[11px] sm:text-xs text-[#CCCCCC] hover:text-white no-underline">Menu</a>
            <a href="/dashboard/reports" className="hidden sm:inline text-[11px] sm:text-xs text-[#CCCCCC] hover:text-white no-underline">Reports</a>
            <a href="/dashboard/settings" className="text-[11px] sm:text-xs text-[#CCCCCC] hover:text-white no-underline">Settings</a>
            <a href="/kitchen/test-123" className="text-[11px] sm:text-xs text-[#CCCCCC] hover:text-white no-underline">Kitchen</a>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/auth/login'
              }}
              className="text-[11px] sm:text-xs text-red-400 hover:text-red-300 bg-transparent border-none cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-4 sm:py-6">

        {/* Trial / Subscription Banner */}
{subscription && (() => {
  const now = new Date()
  const ends = new Date(subscription.ends_at)
  const daysLeft = Math.ceil((ends.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (subscription.status === 'trial' && daysLeft > 0) {
    return (
      <div className="bg-[#FBF7ED] border border-[#F5D98B] rounded-xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-[13px] sm:text-sm font-semibold text-[#92400E]">
            🎁 Free Trial — {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
          </div>
          <div className="text-[11px] sm:text-xs text-[#B45309] mt-1">
            Subscribe to keep your kitchen running without interruption.
          </div>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard/billing'}
          className="px-4 py-2 bg-[#C9A84C] text-white rounded-lg text-xs sm:text-[13px] font-semibold whitespace-nowrap"
        >
          Subscribe Now →
        </button>
      </div>
    )
  }

  if (subscription.status === 'trial' && daysLeft <= 0) {
    return (
      <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-[13px] sm:text-sm font-semibold text-red-700">
            ⚠️ Trial ended
          </div>
          <div className="text-[11px] sm:text-xs text-red-600 mt-1">
            Subscribe to reactivate your account.
          </div>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard/billing'}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-[13px] font-semibold whitespace-nowrap"
        >
          Subscribe Now →
        </button>
      </div>
    )
  }

  if (subscription.status === 'active') {
    return null // no banner
  }

  return null
})()}

        {/* Cash Pending */}
        {cashPending.length > 0 && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-4 sm:p-5 mb-4 sm:mb-5">
            <div className="text-[10px] sm:text-[11px] font-semibold text-[#92400E] tracking-widest uppercase mb-3">
              Cash Pending — {cashPending.length} order{cashPending.length > 1 ? 's' : ''}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {cashPending.map(o => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrder(o)}
                  className="bg-[#FEF3C7] border border-[#FCD34D] rounded-lg px-2.5 py-1.5 text-xs sm:text-[13px] cursor-pointer hover:border-[#C9A84C] transition-colors"
                >
                  <span className="font-mono font-bold text-[#92400E]">#{o.serial_number}</span>
                  {o.customer_name && <span className="text-[#B45309] ml-2">{o.customer_name}</span>}
                  <span className="text-[#B45309] ml-2">₹{o.total_amount}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="0000"
                value={cashSerial}
                onChange={e => { setCashSerial(e.target.value.replace(/\D/g, '').slice(0, 4)); setCashError('') }}
                onKeyDown={e => e.key === 'Enter' && confirmCash()}
                className="w-full sm:w-[130px] px-3 py-2.5 border rounded-lg text-center text-lg font-mono font-bold tracking-wider outline-none bg-white text-black"
                style={{ borderColor: cashError ? '#FCA5A5' : '#FCD34D' }}
              />
              <button
                onClick={confirmCash}
                className="px-5 py-2.5 bg-[#C9A84C] text-white rounded-lg text-[13px] font-semibold"
              >
                Confirm Cash
              </button>
              {cashError && <span className="text-xs text-red-600">{cashError}</span>}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-5">
          <div className="flex gap-2 overflow-x-auto">
            {(['active', 'ready', 'all'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className="px-4 sm:px-5 py-2 rounded-lg border text-xs sm:text-[13px] font-semibold capitalize whitespace-nowrap"
                style={{
                  borderColor: filter === tab ? '#C9A84C' : '#EBEBEB',
                  background: filter === tab ? '#C9A84C' : '#FFFFFF',
                  color: filter === tab ? '#FFFFFF' : '#666666',
                }}
              >
                {tab}
                {tab === 'active' && activeOrdersCount > 0 && (
                  <span
                    className="ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: filter === tab ? 'rgba(255,255,255,0.3)' : '#F3F4F6',
                      color: filter === tab ? '#FFFFFF' : '#374151',
                    }}
                  >
                    {activeOrdersCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="Search serial #"
              value={searchSerial}
              onChange={e => setSearchSerial(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="flex-1 px-3 py-2 border border-[#EBEBEB] rounded-lg text-sm outline-none focus:border-[#C9A84C] bg-white"
            />
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-white border border-[#EBEBEB] rounded-lg text-sm font-semibold text-gray-600 whitespace-nowrap"
            >
              {refreshing ? '...' : '↻'}
            </button>
          </div>
        </div>

        {/* Orders */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 sm:py-20 bg-white border border-[#EBEBEB] rounded-xl">
            <div className="text-3xl mb-3 text-gray-300">—</div>
            <div className="text-sm sm:text-[15px] text-gray-400">
              {searchSerial ? 'No order found with that serial' : 'No orders yet'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredOrders.map((order, idx) => {
              const sc = statusConfig[order.status] || statusConfig.completed
              const isFirst = idx === 0 && filter === 'active' && !searchSerial
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="bg-white rounded-xl p-4 sm:p-5 cursor-pointer hover:border-[#C9A84C] transition-colors"
                  style={{
                    border: `1px solid ${isFirst ? '#C9A84C' : '#EBEBEB'}`,
                    boxShadow: isFirst ? '0 0 0 3px rgba(201,168,76,0.08)' : 'none',
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-mono text-xl sm:text-2xl font-extrabold text-[#C9A84C] tracking-wider">
                          #{order.serial_number}
                        </span>
                        <span
                          className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full tracking-wider"
                          style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                        >
                          {sc.label}
                        </span>
                        {order.is_home_order && (
                          <span className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
                            Home Order
                          </span>
                        )}
                        {isFirst && (
                          <span className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                            ← Make this now
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                        {order.customer_name ? (
                          <span className="text-sm sm:text-[15px] font-semibold text-[#111111]">
                            {order.customer_name}
                          </span>
                        ) : (
                          <span className="text-sm sm:text-[15px] font-semibold text-gray-400 italic">
                            No name
                          </span>
                        )}
                        <span className="text-gray-300">·</span>
                        <span className="text-xs sm:text-[13px] text-gray-600">₹{order.total_amount}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">
                          {order.payment_method}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span className="text-[10px] sm:text-xs text-gray-400">{timeAgo(order.created_at)}</span>
                      </div>

                      {order.order_items && order.order_items.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {order.order_items.map(item => (
                            <span
                              key={item.id}
                              className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-1 bg-[#F8F8F8] border border-[#EBEBEB] rounded-full text-gray-700"
                            >
                              {item.quantity}× {item.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col gap-2 sm:items-end sm:flex-shrink-0">
                      {['confirmed', 'preparing'].includes(order.status) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markReady(order) }}
                          className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-[#C9A84C] text-white rounded-lg text-xs sm:text-[13px] font-semibold whitespace-nowrap"
                        >
                          Ready to Serve
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markCollected(order) }}
                          className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] rounded-lg text-xs sm:text-[13px] font-semibold whitespace-nowrap"
                        >
                          Mark Collected
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-[420px] max-h-[90vh] sm:max-h-[85vh] flex flex-col pointer-events-auto">

              <div className="p-5 border-b border-gray-100 flex justify-between items-start flex-shrink-0">
                <div>
                  <div className="font-mono text-2xl font-extrabold text-[#C9A84C]">#{selectedOrder.serial_number}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-4"
                >
                  ×
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                <div className="p-5 border-b border-gray-100 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customer</span>
                    <span className="font-medium">{selectedOrder.customer_name || '—'}</span>
                  </div>
                  {selectedOrder.customer_phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-medium">{selectedOrder.customer_phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment</span>
                    <span className="font-medium uppercase">{selectedOrder.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className="font-medium capitalize">{selectedOrder.status}</span>
                  </div>
                  {selectedOrder.is_home_order && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type</span>
                      <span className="font-medium text-blue-600">Home Order</span>
                    </div>
                  )}
                </div>

                <div className="p-5 border-b border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Items</div>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.quantity}× {item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-[#C9A84C]">₹{selectedOrder.total_amount}</span>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-2 flex-shrink-0 bg-white">
                {['confirmed', 'preparing'].includes(selectedOrder.status) && (
                  <button
                    onClick={() => markReady(selectedOrder)}
                    className="flex-1 py-3 bg-[#C9A84C] text-white rounded-lg font-semibold text-sm"
                  >
                    Ready to Serve
                  </button>
                )}
                {selectedOrder.status === 'ready' && (
                  <button
                    onClick={() => markCollected(selectedOrder)}
                    className="flex-1 py-3 bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] rounded-lg font-semibold text-sm"
                  >
                    Mark Collected
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}