'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type OrderItem = { id: string; name: string; quantity: number; unit_price: number }
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
type PlacedOrder = {
  id: string
  serial_number: string
  status: string
}

export default function HomeOrderingPage({ params }: { params: { restaurantSlug: string } }) {
  const supabase = createClient()

  const [restaurant, setRestaurant] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCheckout, setShowCheckout] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [placing, setPlacing] = useState(false)
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null)
  const [orderError, setOrderError] = useState('')

  // Init
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        await supabase.auth.signInAnonymously()
      }
      await fetchData()
    }
    init()
  }, [])

  const fetchData = useCallback(async () => {
    const { data: rest } = await supabase
      .from('restaurants')
      .select('id, name, slug, logo_url, address, upi_id')
      .eq('slug', params.restaurantSlug)
      .maybeSingle()

    if (!rest) { setLoading(false); return }
    setRestaurant(rest)

    const { data: cats } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', rest.id)
      .eq('is_active', true)
      .order('display_order')

    const { data: its } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', rest.id)
      .eq('is_available', true)

    setCategories(cats || [])
    setItems((its as any) || [])
    setLoading(false)
  }, [params.restaurantSlug])

  // Poll for order status
  useEffect(() => {
    if (!placedOrder) return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', placedOrder.id)
        .maybeSingle()
      if (data && data.status !== placedOrder.status) {
        setPlacedOrder(p => p ? { ...p, status: data.status } : p)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [placedOrder])

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

  // Fixed placeOrder — no duplicate function
  const placeOrder = async () => {
    setPhoneError('')
    setOrderError('')

    if (!customerName.trim()) {
      setOrderError('Please enter your name')
      return
    }

    if (!customerPhone || customerPhone.length !== 10) {
      setPhoneError('Phone number is required for home orders')
      return
    }

    if (!restaurant) return

    setPlacing(true)

    const { data: { user } } = await supabase.auth.getUser()
    const serial = String(Math.floor(1000 + Math.random() * 9000))

    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurant.id,
        customer_auth_id: user?.id || null,
        serial_number: serial,
        customer_name: customerName || null,
        customer_phone: customerPhone,
        total_amount: cartTotal,
        payment_method: 'upi',
        payment_status: 'pending',
        status: 'confirmed',
        is_home_order: true,
      })
      .select()
      .single()

    if (orderErr || !orderData) {
      setOrderError(orderErr?.message || 'Failed to place order')
      setPlacing(false)
      return
    }

    const orderItems = cart.map(c => ({
      order_id: orderData.id,
      menu_item_id: c.id,
      name: c.name,
      quantity: c.quantity,
      unit_price: c.price,
    }))

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsErr) {
      setOrderError(itemsErr.message)
      setPlacing(false)
      return
    }

    setPlacedOrder({
      id: orderData.id,
      serial_number: serial,
      status: 'confirmed',
    })
    setPlacing(false)
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
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center" style={{ fontFamily: 'system-ui' }}>
        <div className="text-sm text-gray-500">Loading menu...</div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center" style={{ fontFamily: 'system-ui' }}>
        <div className="text-sm text-gray-500">Restaurant not found.</div>
      </div>
    )
  }

  if (placedOrder) {
    const sc = statusLabel[placedOrder.status] || statusLabel.confirmed
    const statuses = ['confirmed', 'preparing', 'ready']
    const currentIdx = statuses.indexOf(placedOrder.status)

    return (
      <div className="min-h-screen bg-[#FAFAFA] p-6 flex items-center justify-center" style={{ fontFamily: 'system-ui' }}>
        <div className="max-w-[400px] w-full">

          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg py-2 px-3 text-center mb-4">
            <div className="text-[11px] font-semibold text-[#1E40AF] tracking-widest uppercase">
              🏠 Home Order
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="text-lg font-bold text-[#111]">{restaurant.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">Powered by Ordexaa</div>
          </div>

          <div className="bg-white border-2 border-[#C9A84C] rounded-2xl p-6 text-center mb-4">
            <div className="text-[11px] font-semibold text-gray-500 tracking-widest uppercase mb-2">
              Your Order Serial
            </div>
            <div className="text-6xl sm:text-7xl font-black text-[#C9A84C] font-mono leading-none mb-2">
              {placedOrder.serial_number}
            </div>
            <div className="text-xs text-gray-500 mb-4">
              Show this number when collecting
            </div>
            <div className="inline-block px-5 py-2 rounded-full text-sm font-semibold"
              style={{ background: sc.bg, color: sc.color }}>
              {sc.label}
            </div>
          </div>

          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">📱</span>
              <div>
                <div className="text-[13px] font-semibold text-[#15803D]">WhatsApp will notify you</div>
                <div className="text-[11px] text-[#15803D] mt-0.5">
                  We'll message +91 {customerPhone} when ready
                </div>
              </div>
            </div>
          </div>

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
                        {s === 'confirmed' ? 'Your order is in queue' : s === 'preparing' ? 'Kitchen is preparing your order' : 'Please come collect your order'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <a
            href={`/bill/${placedOrder.id}`}
            className="block text-center w-full py-3.5 bg-white border border-[#EBEBEB] text-[#C9A84C] rounded-xl text-sm font-semibold no-underline mb-2"
          >
            View Bill
          </a>

          <button
            onClick={() => setPlacedOrder(null)}
            className="w-full py-3.5 bg-[#111111] text-white rounded-xl text-sm font-semibold"
          >
            Order More
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: 'system-ui, sans-serif', paddingBottom: cartCount > 0 ? 90 : 0 }}>

      <div className="bg-[#EFF6FF] border-b border-[#BFDBFE] py-2 px-4 text-center sticky top-0 z-20">
        <div className="text-[11px] font-semibold text-[#1E40AF] tracking-widest uppercase">
          🏠 Home Order — {restaurant.slug}
        </div>
      </div>

      <div className="bg-[#111111] px-5 py-5">
        <div className="max-w-[600px] mx-auto flex items-center gap-3.5">
          {restaurant.logo_url ? (
            <img src={restaurant.logo_url} alt={restaurant.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#222] flex items-center justify-center text-xl">🍽</div>
          )}
          <div>
            <div className="text-lg font-bold text-white">{restaurant.name}</div>
            <div className="text-[11px] text-[#C9A84C] mt-0.5">Powered by Ordexaa</div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-[#EBEBEB] sticky top-[36px] z-10 overflow-x-auto">
        <div className="flex max-w-[600px] mx-auto px-4">
          {[{ id: 'all', name: 'All' }, ...categories].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-4 py-3.5 text-[13px] whitespace-nowrap"
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

      <div className="max-w-[600px] mx-auto px-4 py-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-300 text-sm">No items available</div>
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
                    <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
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
                      <span className="text-[11px] font-semibold text-red-500 bg-red-50 px-2.5 py-1.5 rounded-lg">Sold Out</span>
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
                          className="w-8 h-8 rounded-lg border border-[#EBEBEB] bg-white text-lg flex items-center justify-center"
                          style={{ color: '#666' }}
                        >
                          −
                        </button>
                        <span className="text-base font-bold text-[#111] min-w-[18px] text-center">{qty}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="w-8 h-8 rounded-lg bg-[#C9A84C] text-white text-lg flex items-center justify-center"
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

      {showCheckout && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black bg-opacity-50"
          onClick={e => { if (e.target === e.currentTarget) setShowCheckout(false) }}
        >
          <div className="bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto p-6">
            <div className="max-w-[500px] mx-auto">

              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

              <div className="text-[17px] font-bold text-[#111] mb-1">Your Order</div>
              <div className="text-xs text-[#1E40AF] mb-5">🏠 Home Order</div>

              <div className="mb-5">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2.5" style={{ borderBottom: '1px solid #F5F5F5' }}>
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

              <div className="flex justify-between py-3 mb-5" style={{ borderBottom: '2px solid #EBEBEB' }}>
                <span className="text-base font-bold text-[#111]">Total</span>
                <span className="text-lg font-black text-[#C9A84C]">₹{cartTotal}</span>
              </div>

              <div className="mb-5">
                <div className="text-[13px] font-semibold text-gray-500 mb-3">Your Details</div>
                <div className="flex flex-col gap-2.5">
                  <input
                    type="text"
                    placeholder="Your name * (required)"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="px-3 py-2.5 border border-[#EBEBEB] rounded-lg text-sm text-[#111] outline-none focus:border-[#C9A84C] bg-white"
                  />
                  <div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="Phone number * (required)"
                      value={customerPhone}
                      onChange={e => { setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setPhoneError('') }}
                      className="w-full px-3 py-2.5 rounded-lg text-sm text-[#111] outline-none bg-white"
                      style={{ border: `1px solid ${phoneError ? '#FCA5A5' : '#EBEBEB'}` }}
                    />
                    {phoneError && (
                      <div className="text-[11px] text-red-600 mt-1.5">{phoneError}</div>
                    )}
                    {!phoneError && customerPhone.length === 10 && (
                      <div className="text-[11px] text-green-600 mt-1.5">
                        ✓ WhatsApp bill will be sent to +91 {customerPhone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-[13px] font-semibold text-gray-500 mb-3">Payment Method</div>
                <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex items-center gap-3">
                  <span className="text-xl">📱</span>
                  <div>
                    <div className="text-[13px] font-bold text-[#1E40AF]">Pay via UPI</div>
                    <div className="text-[11px] text-[#1E40AF] mt-0.5">
                      Only UPI for home orders. Pay to {restaurant.upi_id || 'restaurant UPI'}
                    </div>
                  </div>
                </div>
              </div>

              {orderError && (
                <div className="text-[13px] text-red-600 mb-3.5 text-center">{orderError}</div>
              )}

              <button
                onClick={placeOrder}
                disabled={placing}
                className="w-full py-4 bg-[#C9A84C] text-white rounded-xl text-[15px] font-bold disabled:opacity-70"
              >
                {placing ? 'Placing Order...' : `Place Home Order — ₹${cartTotal}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}