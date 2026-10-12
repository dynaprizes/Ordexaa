'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type OrderItem = {
  id: string
  name: string
  quantity: number
  unit_price: number
}

type Order = {
  id: string
  serial_number: string
  customer_name: string | null
  total_amount: number
  payment_method: string
  payment_status: string
  status: string
  is_home_order: boolean
  created_at: string
  order_items: OrderItem[]
}

type Restaurant = {
  name: string
  logo_url: string | null
  slug: string
  address: string | null
  phone: string | null
  gst_enabled: boolean
  gst_number: string | null
  bill_footer: string | null
}

export default function BillPage({ params }: { params: { orderId: string } }) {
  const supabase = createClient()
  const [order, setOrder] = useState<Order | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      // Fetch order with items
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          id, serial_number, customer_name, total_amount, payment_method,
          payment_status, status, is_home_order, created_at, restaurant_id,
          order_items ( id, name, quantity, unit_price )
        `)
        .eq('id', params.orderId)
        .maybeSingle()

      if (orderData) {
        setOrder(orderData as any)

        // Fetch restaurant
        const { data: restData } = await supabase
          .from('restaurants')
          .select('name, logo_url, slug, address, phone, gst_enabled, gst_number, bill_footer')
          .eq('id', (orderData as any).restaurant_id)
          .maybeSingle()

        if (restData) setRestaurant(restData as any)
      }

      setLoading(false)
    }
    load()
  }, [params.orderId])

  const handlePrint = () => window.print()

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Order #${order?.serial_number}`,
          text: `View bill for order #${order?.serial_number}`,
          url: window.location.href,
        })
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center" style={{ fontFamily: 'system-ui' }}>
        <div className="text-sm text-gray-500">Loading bill...</div>
      </div>
    )
  }

  if (!order || !restaurant) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center" style={{ fontFamily: 'system-ui' }}>
        <div className="text-sm text-gray-500">Order not found.</div>
      </div>
    )
  }

  const subtotal = order.order_items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
  const gst = restaurant.gst_enabled ? subtotal * 0.05 : 0
  const grandTotal = subtotal + gst

  return (
    <div className="min-h-screen bg-[#F5F3EF] py-6 px-4" style={{ fontFamily: 'system-ui, sans-serif' }}>

      <div className="max-w-[440px] mx-auto">

        {/* Bill Card */}
        <div className="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden shadow-sm">

          {/* Header */}
          <div className="bg-[#111111] px-6 py-6 text-center">
            <div className="flex justify-center mb-3">
              {restaurant.logo_url ? (
                <img src={restaurant.logo_url} alt="Logo" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#222] flex items-center justify-center text-2xl">
                  🍽
                </div>
              )}
            </div>
            <div className="text-lg font-bold text-white">{restaurant.name}</div>
            {restaurant.address && (
              <div className="text-[11px] text-[#888] mt-1">{restaurant.address}</div>
            )}
            {restaurant.gst_enabled && restaurant.gst_number && (
              <div className="text-[11px] text-[#888] mt-0.5">GST: {restaurant.gst_number}</div>
            )}
            <div className="text-[10px] text-[#C9A84C] mt-3 tracking-widest">BILL RECEIPT</div>
          </div>

          {/* Order Info */}
          <div className="px-6 py-4 border-b border-[#F5F5F5]">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-[10px] text-gray-400 tracking-widest uppercase mb-1">Order Number</div>
                <div className="font-mono text-3xl font-black text-[#C9A84C] leading-none">
                  #{order.serial_number}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-400 tracking-widest uppercase mb-1">Status</div>
                <div className="text-xs font-semibold text-green-600 uppercase">
                  {order.status}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#F5F5F5]">
              <div>
                <div className="text-[10px] text-gray-400 tracking-widest uppercase mb-1">Customer</div>
                <div className="text-sm font-medium text-[#111]">{order.customer_name || 'Guest'}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-400 tracking-widest uppercase mb-1">Date & Time</div>
                <div className="text-xs text-[#111]">
                  {new Date(order.created_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="px-6 py-4 border-b border-[#F5F5F5]">
            <div className="text-[10px] text-gray-400 tracking-widest uppercase mb-3">Items</div>
            <div className="space-y-2.5">
              {order.order_items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <span className="text-[#111]">{item.name}</span>
                    <span className="text-gray-400 ml-2">× {item.quantity}</span>
                  </div>
                  <span className="font-medium text-[#111]">₹{item.unit_price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="px-6 py-4 border-b border-[#F5F5F5]">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-[#111]">₹{subtotal.toFixed(2)}</span>
            </div>
            {restaurant.gst_enabled && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">GST (5%)</span>
                <span className="text-[#111]">₹{gst.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 mt-2 border-t border-[#F5F5F5]">
              <span className="text-base font-bold text-[#111]">Total</span>
              <span className="text-xl font-black text-[#C9A84C]">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="px-6 py-4 border-b border-[#F5F5F5]">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Payment Method</span>
              <span className="font-semibold text-[#111] uppercase">{order.payment_method}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-gray-500">Payment Status</span>
              <span className={`font-semibold ${order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                {order.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 text-center">
            <div className="text-xs text-gray-400 italic">
              {restaurant.bill_footer || 'Thank you for your order!'}
            </div>
            <div className="text-[10px] text-gray-300 mt-2">Powered by Ordexaa</div>
          </div>
        </div>

        {/* Home Order Link */}
        <a
          href={`/order/${restaurant.slug}`}
          className="mt-4 block text-center bg-white border border-[#EBEBEB] rounded-xl py-3 text-sm font-medium text-[#C9A84C] no-underline"
        >
          🏠 Order from home next time →
        </a>

        {/* Actions */}
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button
            onClick={handlePrint}
            className="py-3 bg-white border border-[#EBEBEB] rounded-xl text-sm font-semibold text-[#444]"
          >
            🖨 Print
          </button>
          <button
            onClick={handleShare}
            className="py-3 bg-[#111111] text-white rounded-xl text-sm font-semibold"
          >
            {copied ? '✓ Copied!' : '🔗 Share'}
          </button>
        </div>

        <div className="text-center text-[11px] text-gray-400 mt-6">
          This bill is permanently available at this URL
        </div>
      </div>
    </div>
  )
}