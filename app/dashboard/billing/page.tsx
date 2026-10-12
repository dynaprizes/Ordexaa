'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const YOUR_UPI_ID = 'yourname@upi' // ← REPLACE with your actual UPI ID
const YOUR_WHATSAPP = '918750083831'

export default function BillingPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [restaurantName, setRestaurantName] = useState('')
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [showQr, setShowQr] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: rest } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!rest) { setLoading(false); return }
      setRestaurantName(rest.name)

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('restaurant_id', rest.id)
        .maybeSingle()

      if (sub) setSubscription(sub)
      setLoading(false)
    }
    load()
  }, [])

  const amount = selectedCycle === 'monthly' ? 999 : 9999

  const upiLink = `upi://pay?pa=${YOUR_UPI_ID}&pn=Ordexaa&am=${amount}&cu=INR&tn=${encodeURIComponent(`Ordexaa ${selectedCycle} subscription`)}`

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`

  const whatsappLink = `https://wa.me/${YOUR_WHATSAPP}?text=${encodeURIComponent(
    `Hi Ordexaa team,\n\nI have paid ₹${amount} for the ${selectedCycle} plan.\n\nRestaurant: ${restaurantName}\n\nSending payment screenshot next.`
  )}`

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    )
  }

  const daysLeft = subscription?.ends_at
    ? Math.ceil((new Date(subscription.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: 'system-ui, sans-serif' }}>

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
            <a href="/dashboard" className="text-[11px] sm:text-xs text-[#CCCCCC] hover:text-white no-underline">Orders</a>
            <a href="/dashboard/menu" className="text-[11px] sm:text-xs text-[#CCCCCC] hover:text-white no-underline">Menu</a>
            <a href="/dashboard/settings" className="hidden sm:inline text-[11px] sm:text-xs text-[#CCCCCC] hover:text-white no-underline">Settings</a>
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-3 sm:px-6 py-6">

        <h1 className="text-xl sm:text-2xl font-bold text-[#111] mb-1">Subscription</h1>
        <p className="text-xs sm:text-sm text-gray-500 mb-5">Manage your Ordexaa plan</p>

        {/* Current Status */}
        {subscription && (
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 sm:p-5 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-1">Current Status</div>
                <div className="text-lg font-bold text-[#111] capitalize">
                  {subscription.status === 'trial' ? `Free Trial — ${daysLeft} days left` : subscription.status}
                </div>
                {subscription.ends_at && (
                  <div className="text-xs text-gray-500 mt-1">
                    {subscription.status === 'trial' ? 'Trial ends' : 'Renews on'}: {new Date(subscription.ends_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
                subscription.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                subscription.status === 'trial' ? 'bg-[#FEF9EC] text-[#92400E] border border-[#FDE68A]' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {subscription.status}
              </div>
            </div>
          </div>
        )}

        {/* What's Included */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 sm:p-5 mb-5">
          <div className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-3">Everything included</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {[
              'QR ordering with serials',
              'AI kitchen batching',
              'Bluetooth voice alerts',
              'Home ordering',
              'Cash + UPI payments',
              'Digital bill via WhatsApp',
              'Live order tracking',
              'Revenue reports',
              'Best selling analysis',
              'Multi-device access',
              'Kitchen QR for cooks',
              'Priority support',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-[12px] sm:text-[13px] text-gray-700">
                <span className="text-[#C9A84C] font-bold">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Cycle Selection */}
        <div className="mb-5">
          <div className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-3">Choose billing cycle</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Monthly */}
            <button
              onClick={() => setSelectedCycle('monthly')}
              className="text-left bg-white border-2 rounded-xl p-4 sm:p-5 transition-all"
              style={{ borderColor: selectedCycle === 'monthly' ? '#C9A84C' : '#EBEBEB' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold text-[#111]">Monthly</div>
                {selectedCycle === 'monthly' && <span className="text-[10px] bg-[#C9A84C] text-white px-2 py-0.5 rounded-full font-bold">SELECTED</span>}
              </div>
              <div className="text-3xl font-black text-[#111] mb-1">
                ₹999
                <span className="text-sm font-normal text-gray-500 ml-1">/month</span>
              </div>
              <div className="text-[11px] text-gray-500">Cancel anytime</div>
            </button>

            {/* Yearly */}
            <button
              onClick={() => setSelectedCycle('yearly')}
              className="text-left bg-white border-2 rounded-xl p-4 sm:p-5 transition-all relative"
              style={{ borderColor: selectedCycle === 'yearly' ? '#C9A84C' : '#EBEBEB' }}
            >
              <div className="absolute -top-2 left-4 bg-[#C9A84C] text-white text-[9px] font-bold px-2 py-0.5 rounded-full tracking-wider">
                SAVE ₹1,989
              </div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold text-[#111]">Yearly</div>
                {selectedCycle === 'yearly' && <span className="text-[10px] bg-[#C9A84C] text-white px-2 py-0.5 rounded-full font-bold">SELECTED</span>}
              </div>
              <div className="text-3xl font-black text-[#111] mb-1">
                ₹9,999
                <span className="text-sm font-normal text-gray-500 ml-1">/year</span>
              </div>
              <div className="text-[11px] text-gray-500">₹833/month · Save ₹1,989</div>
            </button>
          </div>
        </div>

        {/* Pay Section */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-1">Amount to pay</div>
              <div className="text-2xl font-black text-[#111]">₹{amount.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <a
              href={upiLink}
              className="block text-center py-3.5 bg-[#C9A84C] text-white rounded-lg font-semibold text-sm no-underline"
            >
              📱 Pay via UPI App
            </a>
            <button
              onClick={() => setShowQr(!showQr)}
              className="py-3.5 bg-white border border-[#EBEBEB] text-gray-700 rounded-lg font-semibold text-sm"
            >
              {showQr ? 'Hide QR' : '🔳 Show UPI QR'}
            </button>
          </div>

          {showQr && (
            <div className="mb-4 p-4 bg-[#FBF7ED] border border-[#F5D98B] rounded-xl text-center">
              <div className="text-[11px] font-semibold text-[#92400E] tracking-wider uppercase mb-3">
                Scan to pay ₹{amount.toLocaleString('en-IN')}
              </div>
              <div className="bg-white p-4 rounded-xl inline-block">
                <img src={qrUrl} alt="UPI QR" className="w-56 h-56" />
              </div>
              <div className="text-[11px] text-[#B45309] mt-3">
                UPI: {YOUR_UPI_ID}
              </div>
            </div>
          )}

          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 mb-3">
            <div className="text-[12px] font-semibold text-[#15803D] mb-1">📸 After payment</div>
            <div className="text-[11px] text-[#15803D] leading-relaxed">
              Send payment screenshot on WhatsApp. We'll activate your plan within 2 hours.
            </div>
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="block text-center w-full py-3.5 bg-[#25D366] text-white rounded-lg font-semibold text-sm no-underline"
          >
            💬 Send Screenshot on WhatsApp
          </a>

          <div className="text-center text-[11px] text-gray-400 mt-4">
            Questions? Call 8433242149
          </div>
        </div>
      </div>
    </div>
  )
}