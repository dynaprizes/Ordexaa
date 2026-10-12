'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    name: '',
    phone: '',
    email: '',
    upi_id: '',
    address: '',
    gst_enabled: false,
    gst_number: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const validateStep = (s: number) => {
    const e: Record<string, string> = {}
    if (s === 1) {
      if (!data.name.trim()) e.name = 'Business name is required'
      if (!data.phone || data.phone.length !== 10) e.phone = 'Valid 10-digit mobile required'
      if (!data.email || !data.email.includes('@')) e.email = 'Valid email required'
    }
    if (s === 2) {
      if (!data.upi_id.trim()) e.upi_id = 'UPI ID is required'
    }
    if (s === 3) {
      if (!data.address.trim()) e.address = 'Address is required'
      if (data.gst_enabled && !data.gst_number.trim()) e.gst_number = 'GST number required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validateStep(step)) setStep(step + 1) }
  const back = () => setStep(step - 1)

  const submit = async () => {
    if (!validateStep(3)) return
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSaving(false)
        router.push('/auth/login')
        return
      }

      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const { data: restData, error } = await supabase
  .from('restaurants')
  .insert({
    owner_id: user.id,
    name: data.name.trim(),
    slug,
    address: data.address.trim(),
    phone: data.phone,
    email: data.email.trim().toLowerCase(),
    upi_id: data.upi_id.trim(),
    gst_enabled: data.gst_enabled,
    gst_number: data.gst_enabled ? data.gst_number.trim().toUpperCase() : null,
    bill_footer: 'Thank you for your order!',
  })
  .select()
  .single()

if (error || !restData) {
  alert('Error: ' + (error?.message || 'Failed to create restaurant'))
  setSaving(false)
  return
}

// Create subscription row with 14-day trial
const trialEndsAt = new Date()
trialEndsAt.setDate(trialEndsAt.getDate() + 14)

const { error: subError } = await supabase
  .from('subscriptions')
  .insert({
    restaurant_id: restData.id,
    plan: 'starter',
    status: 'trial',
    starts_at: new Date().toISOString(),
    ends_at: trialEndsAt.toISOString(),
  })

if (subError) {
  console.error('Subscription creation failed:', subError)
  // Don't block — restaurant is created
}

router.push('/dashboard')
    } catch {
      alert('Something went wrong')
      setSaving(false)
    }
  }

  const inputCls = "w-full px-3.5 sm:px-4 py-3 sm:py-3.5 border border-[#EBEBEB] rounded-xl text-[14px] sm:text-[15px] outline-none focus:border-[#C9A84C] bg-white text-black"
const inputErrCls = "w-full px-3.5 sm:px-4 py-3 sm:py-3.5 border-2 border-red-400 rounded-xl text-[14px] sm:text-[15px] outline-none bg-white text-black"

  const Label = ({ text, required }: { text: string; required?: boolean }) => (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm font-medium text-gray-700">{text}</span>
      {required && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>

      <div className="bg-white border-b border-[#E5E1D8] px-4 sm:px-5 py-3 sm:py-4">
  <div className="max-w-[480px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/ordexaa-logo.jpeg" alt="Ordexaa" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <div className="text-sm font-black tracking-widest text-[#111]">ORDEXAA</div>
              <div className="text-[8px] text-[#B8923A] tracking-[0.24em]">SETUP</div>
            </div>
          </div>
          <div className="text-[11px] sm:text-xs text-gray-400">Step {step} of 3</div>
        </div>
      </div>

      <div className="bg-white border-b border-[#E5E1D8]">
        <div className="max-w-[480px] mx-auto px-5 h-1 bg-gray-100">
          <div
            className="h-1 bg-[#C9A84C] transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-3 sm:px-5 py-6 sm:py-10">
  <div className="max-w-[480px] w-full">

          {step === 1 && (
            <>
              <div className="mb-6">
                <div className="text-xl sm:text-2xl font-black text-[#111] mb-1.5 sm:mb-2">Let's set up your business</div>
                <div className="text-sm text-gray-500">Basic details — takes 30 seconds</div>
              </div>

              <div className="bg-white border border-[#E5E1D8] rounded-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4">
                <div>
                  <Label text="Business Name" required />
                  <input
                    type="text"
                    placeholder="Sharma Cafe"
                    value={data.name}
                    onChange={e => setData({ ...data, name: e.target.value })}
                    className={errors.name ? inputErrCls : inputCls}
                    autoFocus
                  />
                  {errors.name && <div className="text-xs text-red-500 mt-1.5">{errors.name}</div>}
                </div>

                <div>
                  <Label text="Mobile Number" required />
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="9876543210"
                    value={data.phone}
                    onChange={e => setData({ ...data, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className={errors.phone ? inputErrCls : inputCls}
                  />
                  {errors.phone && <div className="text-xs text-red-500 mt-1.5">{errors.phone}</div>}
                </div>

                <div>
                  <Label text="Email" required />
                  <input
                    type="email"
                    placeholder="owner@example.com"
                    value={data.email}
                    onChange={e => setData({ ...data, email: e.target.value })}
                    className={errors.email ? inputErrCls : inputCls}
                  />
                  {errors.email && <div className="text-xs text-red-500 mt-1.5">{errors.email}</div>}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-6">
                <div className="text-xl sm:text-2xl font-black text-[#111] mb-1.5 sm:mb-2">How do you get paid?</div>
                <div className="text-sm text-gray-500">Customer UPI payments go directly to your account</div>
              </div>

              <div className="bg-white border border-[#E5E1D8] rounded-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4">
                <div>
                  <Label text="UPI ID" required />
                  <input
                    type="text"
                    placeholder="sharmacafe@okaxis"
                    value={data.upi_id}
                    onChange={e => setData({ ...data, upi_id: e.target.value })}
                    className={errors.upi_id ? inputErrCls : inputCls}
                    autoFocus
                  />
                  {errors.upi_id && <div className="text-xs text-red-500 mt-1.5">{errors.upi_id}</div>}
                  <div className="text-[11px] text-gray-400 mt-2">
                    Zero commission. Money arrives instantly.
                  </div>
                </div>

                <div className="bg-[#FBF7ED] border border-[#F5D98B] rounded-xl p-3.5">
                  <div className="text-[11px] text-[#92400E] leading-relaxed">
                    💡 <strong>Tip:</strong> This is where all UPI payments will arrive. Double-check before continuing.
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="mb-6">
                <div className="text-xl sm:text-2xl font-black text-[#111] mb-1.5 sm:mb-2">Where are you located?</div>
                <div className="text-sm text-gray-500">Shown on bills and home ordering page</div>
              </div>

              <div className="bg-white border border-[#E5E1D8] rounded-2xl p-4 sm:p-5 space-y-3.5 sm:space-y-4">
                <div>
                  <Label text="Address" required />
                  <input
                    type="text"
                    placeholder="Shop 12, Main Market, Greater Noida"
                    value={data.address}
                    onChange={e => setData({ ...data, address: e.target.value })}
                    className={errors.address ? inputErrCls : inputCls}
                    autoFocus
                  />
                  {errors.address && <div className="text-xs text-red-500 mt-1.5">{errors.address}</div>}
                </div>

                <div className="pt-3 border-t border-[#F5F5F5]">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700">GST Registered?</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">Enable if you generate GST bills</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setData({ ...data, gst_enabled: !data.gst_enabled })}
                      className="w-11 h-6 rounded-full relative transition-colors flex-shrink-0"
                      style={{ background: data.gst_enabled ? '#C9A84C' : '#DDD' }}
                    >
                      <div
                        className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                        style={{ left: data.gst_enabled ? 22 : 2 }}
                      />
                    </button>
                  </div>

                  {data.gst_enabled && (
                    <div>
                      <Label text="GST Number" required />
                      <input
                        type="text"
                        placeholder="22AAAAA0000A1Z5"
                        value={data.gst_number}
                        onChange={e => setData({ ...data, gst_number: e.target.value.toUpperCase() })}
                        className={errors.gst_number ? inputErrCls : inputCls}
                      />
                      {errors.gst_number && <div className="text-xs text-red-500 mt-1.5">{errors.gst_number}</div>}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3.5">
                <div className="text-[11px] text-[#15803D] leading-relaxed">
                  ✓ You're all set. Click <strong>Finish Setup</strong> to start taking orders.
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2.5 mt-5 sm:mt-6">
            {step > 1 && (
              <button
                onClick={back}
                className="flex-1 py-3.5 bg-white border border-[#E5E1D8] text-gray-700 rounded-xl text-sm font-semibold"
              >
                ← Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={next}
                className="flex-1 py-3.5 bg-[#C9A84C] text-white rounded-xl text-sm font-bold"
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={saving}
                className="flex-1 py-3.5 bg-[#C9A84C] text-white rounded-xl text-sm font-bold disabled:opacity-60"
              >
                {saving ? 'Setting up...' : 'Finish Setup'}
              </button>
            )}
          </div>

          <div className="text-center mt-4 sm:mt-5 text-[10px] sm:text-[11px] text-gray-400">
            Fields marked <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 align-middle mx-1" /> are required
          </div>
        </div>
      </div>
    </div>
  )
}