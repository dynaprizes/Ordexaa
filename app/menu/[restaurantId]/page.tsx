'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// No mock data — everything from Supabase

type Restaurant = {
  id: string
  name: string
  logo_url: string | null
  slug: string
}

type Category = {
  id: string
  name: string
  display_order: number
}

type MenuItem = {
  id: string
  name: string
  price: number
  description: string | null
  image_url: string | null
  prep_time_minutes: number
  category_id: string
  is_available: boolean
}

type CartItem = MenuItem & { quantity: number }

type OrderStatus = 'idle' | 'placing' | 'placed' | 'error'

type PlacedOrder = {
  id: string
  serial_number: string
  status: string
  payment_method: string
  total_amount?: number
  restaurant_slug?: string
  restaurant_name?: string
}

export default function CustomerMenuPage({ params }: { params: { restaurantId: string } }) {
  const { restaurantId } = params

  const [restaurant, setRestaurant] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi')
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('idle')
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null)
  const [orderError, setOrderError] = useState('')

// ── Fetch data from Supabase ─────────────────────────────────────
const fetchData = useCallback(async () => {
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()

  

  // Fetch restaurant by ID
  const { data: rest } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, address')
    .eq('id', restaurantId)
    .maybeSingle()

  if (!rest) {
    setLoading(false)
    return
  }
  setRestaurant(rest)

  // Fetch categories
  const { data: cats } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', rest.id)
    .eq('is_active', true)
    .order('display_order')

  // Fetch items
  const { data: its } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', rest.id)
    .eq('is_available', true)

  setCategories(cats || [])
  setItems(its || [])
  setLoading(false)
}, [restaurantId])

  useEffect(() => {
  const init = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    // Silent anonymous sign-in
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      await supabase.auth.signInAnonymously()
    }

    fetchData()
  }
  init()
}, [fetchData])

  // ── Live order status tracking (Supabase) ─────────────────────────
useEffect(() => {
  if (!placedOrder) return

  const supabase = createClient()

  const checkStatus = async () => {
    const { data } = await supabase
      .from('orders')
      .select('status')
      .eq('id', placedOrder.id)
      .maybeSingle()
    if (data && data.status !== placedOrder.status) {
      setPlacedOrder(p => p ? { ...p, status: data.status } : p)
    }
  }

  const interval = setInterval(checkStatus, 5000)
  return () => clearInterval(interval)
}, [placedOrder])

  // ── Voice ────────────────────────────────────────────────────────
  const speak = (text: string) => {
    if (typeof window === 'undefined') return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-IN'
    u.rate = 0.85
    window.speechSynthesis.speak(u)
  }

  // ── Cart helpers ─────────────────────────────────────────────────
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id)
      if (exists) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === itemId)
      if (!exists) return prev
      if (exists.quantity === 1) return prev.filter(c => c.id !== itemId)
      return prev.map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)
    })
  }

  const getQty = (itemId: string) => cart.find(c => c.id === itemId)?.quantity || 0
  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0)
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)

  // ── Generate serial ──────────────────────────────────────────────
  const generateSerial = () => String(Math.floor(1000 + Math.random() * 9000))

 const placeOrder = async () => {
  if (cart.length === 0 || !restaurant) return
  setOrderStatus('placing')
  setOrderError('')

  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()

  const serial = generateSerial()

  // 1. Insert order
  const { data: { user } } = await supabase.auth.getUser()

const { data: orderData, error: orderError } = await supabase
  .from('orders')
  .insert({
    restaurant_id: restaurant.id,
    customer_auth_id: user?.id || null,
    serial_number: serial,
    customer_name: customerName || null,
    customer_phone: customerPhone || null,
    total_amount: cartTotal,
    payment_method: paymentMethod,
    payment_status: paymentMethod === 'cash' ? 'pending' : 'paid',
    status: 'confirmed',
    is_home_order: false,
  })
  .select()
  .single()

  if (orderError || !orderData) {
    setOrderError(orderError?.message || 'Failed to place order')
    setOrderStatus('error')
    return
  }

  // 2. Insert order items
  const orderItems = cart.map(c => ({
    order_id: orderData.id,
    menu_item_id: c.id,
    name: c.name,
    quantity: c.quantity,
    unit_price: c.price,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    setOrderError(itemsError.message)
    setOrderStatus('error')
    return
  }

  // Check if this is customer's first ever order at this restaurant
const { count } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true })
  .eq('restaurant_id', restaurant.id)
  .eq('customer_auth_id', user?.id || '')

const isFirstOrder = count === 1

setPlacedOrder({
  id: orderData.id,
  serial_number: serial,
  status: 'confirmed',
  payment_method: paymentMethod,
  total_amount: cartTotal,
  restaurant_slug: restaurant.slug,
  restaurant_name: restaurant.name,
  is_first_order: isFirstOrder,
} as any)
setOrderStatus('placed')
setCart([])
setShowCheckout(false)
}

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter(i => i.category_id === activeCategory)

  const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    confirmed: { label: 'Order Confirmed', color: '#92400E', bg: '#FEF9EC' },
    preparing: { label: 'Being Prepared', color: '#1E40AF', bg: '#EFF6FF' },
    ready:     { label: 'Ready to Collect!', color: '#15803D', bg: '#F0FDF4' },
    completed: { label: 'Collected', color: '#6B7280', bg: '#F9FAFB' },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center" style={{ fontFamily: 'system-ui' }}>
        <div className="text-center">
          <div className="text-4xl mb-2">🍽</div>
          <div className="text-sm text-gray-400">Loading menu...</div>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center" style={{ fontFamily: 'system-ui' }}>
        <div className="text-sm text-gray-400">Restaurant not found.</div>
      </div>
    )
  }


  // ── Order placed screen ──────────────────────────────────────────

  if (orderStatus === 'placed' && placedOrder && (placedOrder as any).is_first_order) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 flex items-center justify-center" style={{ fontFamily: 'system-ui' }}>
      <div className="max-w-[400px] w-full text-center">

        <div className="text-7xl mb-6 animate-bounce">🎉</div>

        <h1 className="text-3xl font-black text-[#111] mb-3">First Order!</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Welcome to <strong>{restaurant.name}</strong>.<br />
          This is your first order here.
        </p>

        <div className="bg-white border-2 border-[#C9A84C] rounded-2xl p-6 mb-6">
          <div className="text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-2">
            Your Order Serial
          </div>
          <div className="text-6xl font-black text-[#C9A84C] font-mono leading-none mb-2">
            {placedOrder.serial_number}
          </div>
          <div className="text-xs text-gray-500">
            Show this at the counter
          </div>
        </div>

        <button
          onClick={() => { setPlacedOrder(p => p ? { ...p, is_first_order: false } as any : p) }}
          className="w-full py-3.5 bg-[#111111] text-white rounded-xl text-sm font-semibold"
        >
          Track My Order →
        </button>

      </div>
    </div>
  )
}

  if (orderStatus === 'placed' && placedOrder) {
    const sc = statusLabel[placedOrder.status] || statusLabel.confirmed
    const statuses = ['confirmed', 'preparing', 'ready']
    const currentIdx = statuses.indexOf(placedOrder.status)

    return (
      <div className="min-h-screen bg-[#FAFAFA] p-6 flex items-center justify-center" style={{ fontFamily: 'system-ui' }}>
        <div className="max-w-[400px] w-full">

          <div className="text-center mb-6">
  <div className="text-lg font-bold text-[#111]">{restaurant.name}</div>
  <div className="flex items-center justify-center gap-1.5 mt-1">
    <img src="/ordexaa-logo.jpeg" alt="Ordexaa" className="w-4 h-4 rounded object-cover" />
    <div className="text-xs text-gray-400">Powered by Ordexaa</div>
  </div>
</div>

          {/* Serial */}
          <div className="bg-white border-2 border-[#C9A84C] rounded-2xl p-6 text-center mb-4">
            <div className="text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-2">
              Your Order Serial
            </div>
            <div className="text-6xl sm:text-7xl font-black text-[#C9A84C] font-mono leading-none mb-2">
              {placedOrder.serial_number}
            </div>
            {placedOrder.payment_method === 'cash' && (
              <div className="text-xs text-gray-500 mb-4">
                Show this number at the counter to pay
              </div>
            )}
            <div className="inline-block px-5 py-2 rounded-full text-sm font-semibold"
              style={{ background: sc.bg, color: sc.color }}>
              {sc.label}
            </div>
          </div>

          {/* Status Tracker */}
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-5 mb-4">
            <div className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-4">
              Live Status
            </div>
            {statuses.map((s, i) => {
              const done = i <= currentIdx
              const active = i === currentIdx
              return (
                <div key={s} className="flex items-center gap-3" style={{ marginBottom: i < 2 ? 14 : 0 }}>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{
                      background: done ? '#C9A84C' : '#F5F5F5',
                      border: `2px solid ${done ? '#C9A84C' : '#EBEBEB'}`,
                      color: done ? '#FFFFFF' : '#CCC'
                    }}
                  >
                    {done ? '✓' : i + 1}
                  </div>
                  <div>
                    <div
                      className="text-[13px]"
                      style={{
                        fontWeight: active ? 700 : 500,
                        color: active ? '#111' : done ? '#666' : '#CCC'
                      }}
                    >
                      {s === 'confirmed' ? 'Order Confirmed' : s === 'preparing' ? 'Being Prepared' : 'Ready to Collect'}
                    </div>
                    {active && (
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {s === 'confirmed' ? 'Your order is in queue' : s === 'preparing' ? 'Kitchen is preparing your order' : 'Please collect from counter'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* WhatsApp Bill Button */}
{customerPhone && customerPhone.length === 10 && (
  <a
    href={`https://wa.me/91${customerPhone}?text=${encodeURIComponent(
      `🍽️ ${placedOrder.restaurant_name || restaurant.name}\n\nOrder #${placedOrder.serial_number} confirmed.\nTotal: ₹${placedOrder.total_amount || 0}\n\n🔗 View bill: http://localhost:3000/bill/${placedOrder.id}\n🏠 Order from home: http://localhost:3000/order/${placedOrder.restaurant_slug || ''}\n\nThank you!`
    )}`}
    target="_blank"
    rel="noreferrer"
    className="block text-center w-full py-3.5 bg-[#25D366] text-white rounded-xl text-sm font-semibold no-underline mb-2"
  >
    📱 Send Bill on WhatsApp
  </a>
)}

<button
  onClick={() => { setOrderStatus('idle'); setPlacedOrder(null) }}
  className="w-full py-3.5 bg-white border border-[#EBEBEB] text-gray-700 rounded-xl text-sm font-semibold mb-2"
>
  ← Back to Menu
</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: 'system-ui, sans-serif', paddingBottom: cartCount > 0 ? 90 : 0 }}>

      {/* Restaurant Header */}
      <div className="bg-[#111111] px-5 py-5">
        <div className="max-w-[600px] mx-auto flex items-center gap-3.5">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt={restaurant.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-xl">🍽</div>
          )}
          <div>
  <div className="text-lg font-bold text-white">{restaurant.name}</div>
  <div className="flex items-center gap-1.5 mt-0.5">
    <img src="/ordexaa-logo.jpeg" alt="Ordexaa" className="w-3.5 h-3.5 rounded object-cover" />
    <div className="text-[11px] text-[#C9A84C]">Powered by Ordexaa</div>
  </div>
</div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-[#EBEBEB] sticky top-0 z-10 overflow-x-auto">
        <div className="flex max-w-[600px] mx-auto px-4">
          {[{ id: 'all', name: 'All' }, ...categories].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-4 py-3.5 text-[13px] whitespace-nowrap transition-all"
              style={{
                borderBottom: `2px solid ${activeCategory === cat.id ? '#C9A84C' : 'transparent'}`,
                fontWeight: activeCategory === cat.id ? 700 : 500,
                color: activeCategory === cat.id ? '#C9A84C' : '#666',
                background: 'transparent',
                border: 'none',
                borderBottomWidth: 2,
                borderBottomStyle: 'solid',
                borderBottomColor: activeCategory === cat.id ? '#C9A84C' : 'transparent',
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items — Single card, arranged list, no gaps */}
      <div className="max-w-[600px] mx-auto px-4 py-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-300 text-sm">
            No items available
          </div>
        ) : (
          <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
            {filteredItems.map((item, idx) => {
              const qty = getQty(item.id)
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3.5"
                  style={{
                    borderBottom: idx < filteredItems.length - 1 ? '1px solid #F5F5F5' : 'none',
                    opacity: item.is_available ? 1 : 0.5,
                  }}
                >
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-[#111] mb-0.5">{item.name}</div>
                    {item.description && (
                      <div className="text-xs text-gray-400 truncate mb-1">{item.description}</div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-[#C9A84C]">₹{item.price}</span>
                      <span className="text-[11px] text-gray-300">· {item.prep_time_minutes} min</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {!item.is_available ? (
                      <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg">
                        Sold Out
                      </span>
                    ) : qty === 0 ? (
                      <button
                        onClick={() => addToCart(item)}
                        className="px-5 py-2 bg-[#C9A84C] text-white rounded-lg text-sm font-bold"
                      >
                        Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-lg border border-[#EBEBEB] bg-white text-lg font-medium flex items-center justify-center"
                          style={{ color: '#666' }}
                        >
                          −
                        </button>
                        <span className="text-base font-bold text-[#111] min-w-[18px] text-center">{qty}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-8 h-8 rounded-lg bg-[#C9A84C] text-white text-lg font-medium flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      {cartCount > 0 && !showCheckout && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-white via-white to-transparent z-40">
          <div className="max-w-[600px] mx-auto">
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full px-5 py-4 bg-[#111111] text-white rounded-xl text-[15px] font-bold flex justify-between items-center shadow-2xl"
            >
              <span className="bg-[#C9A84C] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {cartCount} item{cartCount > 1 ? 's' : ''}
              </span>
              <span>View Order</span>
              <span className="text-[#C9A84C] text-[15px] font-bold">₹{cartTotal}</span>
            </button>
          </div>
        </div>
      )}

      {/* Checkout Sheet */}
      {showCheckout && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black bg-opacity-50"
          onClick={e => { if (e.target === e.currentTarget) setShowCheckout(false) }}
        >
          <div className="bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="max-w-[500px] mx-auto">

              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

              <div className="text-[17px] font-bold text-[#111] mb-5">Your Order</div>

              {/* Cart items */}
              <div className="mb-5">
                {cart.map(item => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2.5"
                    style={{ borderBottom: '1px solid #F5F5F5' }}
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#111]">{item.name}</div>
                      <div className="text-xs text-gray-400">₹{item.price} × {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded-md border border-[#EBEBEB] bg-white text-base flex items-center justify-center"
                        style={{ color: '#666' }}
                      >
                        −
                      </button>
                      <span className="text-sm font-bold min-w-[16px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="w-7 h-7 rounded-md bg-[#C9A84C] text-white text-base flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-between py-3 mb-5" style={{ borderBottom: '2px solid #EBEBEB' }}>
                <span className="text-base font-bold text-[#111]">Total</span>
                <span className="text-lg font-black text-[#C9A84C]">₹{cartTotal}</span>
              </div>

              {/* Customer details */}
              <div className="mb-5">
                <div className="text-[13px] font-semibold text-gray-500 mb-3">Your Details (optional)</div>
                <div className="flex flex-col gap-2.5">
                  <input
                    type="text"
                    placeholder="Your name"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="px-3 py-2.5 border border-[#EBEBEB] rounded-lg text-sm text-[#111] outline-none focus:border-[#C9A84C] bg-white"
                  />
                  <input
  type="tel"
  inputMode="numeric"
  maxLength={10}
  placeholder="Phone number (for WhatsApp bill)"
  value={customerPhone}
  onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
  className="px-3 py-2.5 border border-[#EBEBEB] rounded-lg text-sm text-[#111] outline-none focus:border-[#C9A84C] bg-white"
/>
<p className="text-[11px] text-gray-400 mt-1.5">
  We'll send your bill + order updates on WhatsApp. 10-digit mobile only.
</p>
                </div>
              </div>

              {/* Payment method */}
              <div className="mb-6">
                <div className="text-[13px] font-semibold text-gray-500 mb-3">Payment Method</div>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['upi', 'cash'] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className="py-3.5 rounded-xl text-center"
                      style={{
                        border: `2px solid ${paymentMethod === method ? '#C9A84C' : '#EBEBEB'}`,
                        background: paymentMethod === method ? '#FBF7ED' : '#FFFFFF',
                      }}
                    >
                      <div className="text-xl mb-1">{method === 'upi' ? '📱' : '💵'}</div>
                      <div
                        className="text-[13px] font-bold"
                        style={{ color: paymentMethod === method ? '#92400E' : '#444' }}
                      >
                        {method === 'upi' ? 'Pay via UPI' : 'Pay Cash'}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {method === 'upi' ? 'Instant confirmation' : 'Pay at counter'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {orderError && (
                <div className="text-[13px] text-red-600 mb-3.5 text-center">{orderError}</div>
              )}

              <button
                onClick={placeOrder}
                disabled={orderStatus === 'placing'}
                className="w-full py-4 bg-[#C9A84C] text-white rounded-xl text-[15px] font-bold disabled:opacity-70"
              >
                {orderStatus === 'placing' ? 'Placing Order...' : `Place Order — ₹${cartTotal}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}