'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { buildPosterHtml } from '@/lib/poster'

const compressImage = (file: File, maxSize = 512, quality = 0.85): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas not supported')); return }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('Compression failed')),
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Invalid image'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('Read failed'))
    reader.readAsDataURL(file)
  })
}

export default function SettingsPage() {
  const supabase = createClient()

  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState({
    name: '',
    slug: '',
    address: '',
    upi_id: '',
    phone: '',
    email: '',
    logo_url: '',
    gst_enabled: false,
    gst_number: '',
    bill_footer: 'Thank you for your order!',
  })

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [qrType, setQrType] = useState<'menu' | 'home'>('menu')
  const [editBasic, setEditBasic] = useState(false)
  const [editGst, setEditGst] = useState(false)

  // Load from Supabase
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (data) {
        setRestaurantId(data.id)
        setRestaurant({
          name: data.name || '',
          slug: data.slug || '',
          address: data.address || '',
          upi_id: data.upi_id || '',
          phone: data.phone || '',
          email: data.email || '',
          logo_url: data.logo_url || '',
          gst_enabled: data.gst_enabled || false,
          gst_number: data.gst_number || '',
          bill_footer: data.bill_footer || 'Thank you for your order!',
        })
        if (data.logo_url) setLogoPreview(data.logo_url)
      }

      setLoading(false)
    }
    load()
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    setSaveError('')

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: restaurant.name.trim(),
          slug: restaurant.slug.trim(),
          address: restaurant.address.trim(),
          phone: restaurant.phone,
          email: restaurant.email.trim().toLowerCase(),
          upi_id: restaurant.upi_id.trim(),
          logo_url: restaurant.logo_url,
          gst_enabled: restaurant.gst_enabled,
          gst_number: restaurant.gst_enabled ? restaurant.gst_number.trim().toUpperCase() : null,
          bill_footer: restaurant.bill_footer.trim(),
        })
        .eq('id', restaurantId)

      if (error) {
        setSaveError(error.message)
      } else {
        setSaved(true)
        setEditBasic(false)
        setEditGst(false)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      setSaveError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file || !restaurantId) return

  setSaving(true)
  setSaveError('')

  // Show local preview immediately
  const localUrl = URL.createObjectURL(file)
  setLogoPreview(localUrl)

  // Compress before upload
  let fileToUpload: Blob = file
  let fileExt = file.name.split('.').pop() || 'jpg'
  try {
    fileToUpload = await compressImage(file, 512, 0.85)
    fileExt = 'jpg'
  } catch (err) {
    console.warn('Compression failed, uploading original:', err)
  }

  // Upload to Supabase Storage
  const fileName = `${restaurantId}/logo-${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('restaurant-logos')
    .upload(fileName, fileToUpload, { upsert: true, contentType: 'image/jpeg' })

  if (uploadError) {
    setSaveError('Logo upload failed: ' + uploadError.message)
    setSaving(false)
    return
  }

  const { data: urlData } = supabase.storage
    .from('restaurant-logos')
    .getPublicUrl(fileName)

  // Save logo_url to database
  const { error: dbError } = await supabase
    .from('restaurants')
    .update({ logo_url: urlData.publicUrl })
    .eq('id', restaurantId)

  if (dbError) {
    setSaveError('Failed to save logo URL: ' + dbError.message)
    setSaving(false)
    return
  }

  setRestaurant({ ...restaurant, logo_url: urlData.publicUrl })
  setSaved(true)
  setTimeout(() => setSaved(false), 3000)
  setSaving(false)
}

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ordexaa.site'

const menuQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
  `${baseUrl}/menu/${restaurant.slug || 'sharma-cafe'}`
)}`

const homeQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
  `${baseUrl}/order/${restaurant.slug || 'sharma-cafe'}`
)}`
  const inputCls = "w-full px-3 py-2.5 border border-[#EBEBEB] rounded-lg text-sm outline-none focus:border-[#C9A84C] bg-white text-black disabled:bg-gray-50 disabled:text-gray-800"

  const RedDot = () => <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading settings...</div>
      </div>
    )
  }

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
            <a href="/dashboard/reports" className="hidden sm:inline text-[11px] sm:text-xs text-[#CCCCCC] hover:text-white no-underline">Reports</a>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-4 sm:py-6">

        <h1 className="text-xl sm:text-2xl font-bold text-[#111] mb-1">Business Settings</h1>
        <p className="text-xs sm:text-sm text-gray-500 mb-5">Manage your business details and preferences</p>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">
            ✓ Settings saved successfully
          </div>
        )}

        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

          {/* Left: Form */}
          <div className="space-y-4">

            {/* Basic Info */}
            <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#111]">Basic Info</h2>
                <button
                  onClick={() => setEditBasic(!editBasic)}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg"
                  style={{
                    background: editBasic ? '#FBF7ED' : '#FFFFFF',
                    border: `1px solid ${editBasic ? '#C9A84C' : '#EBEBEB'}`,
                    color: editBasic ? '#C9A84C' : '#666',
                  }}
                >
                  {editBasic ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-xs text-gray-800">Business Name</label>
                    <RedDot />
                  </div>
                  <input
                    type="text"
                    value={restaurant.name}
                    onChange={e => setRestaurant({ ...restaurant, name: e.target.value })}
                    className={inputCls}
                    placeholder="Sharma Cafe"
                    disabled={!editBasic}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-800 block mb-1.5">Slug (URL)</label>
                  <input
                    type="text"
                    value={restaurant.slug}
                    onChange={e => setRestaurant({ ...restaurant, slug: e.target.value.toLowerCase().replace(/\s/g, '-').replace(/[^a-z0-9-]/g, '') })}
                    className={inputCls}
                    placeholder="sharma-cafe"
                    disabled={!editBasic}
                  />
                  <p className="text-[11px] text-gray-600 mt-1.5">Menu URL: /menu/{restaurant.slug || 'your-slug'}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-xs text-gray-800">Address</label>
                    <RedDot />
                  </div>
                  <input
                    type="text"
                    value={restaurant.address}
                    onChange={e => setRestaurant({ ...restaurant, address: e.target.value })}
                    className={inputCls}
                    placeholder="Shop 12, Main Market"
                    disabled={!editBasic}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className="text-xs text-gray-800">UPI ID</label>
                      <RedDot />
                    </div>
                    <input
                      type="text"
                      value={restaurant.upi_id}
                      onChange={e => setRestaurant({ ...restaurant, upi_id: e.target.value })}
                      className={inputCls}
                      placeholder="sharmacafe@okaxis"
                      disabled={!editBasic}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className="text-xs text-gray-800">Phone</label>
                      <RedDot />
                    </div>
                    <input
                      type="tel"
                      value={restaurant.phone}
                      onChange={e => setRestaurant({ ...restaurant, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      className={inputCls}
                      placeholder="9876543210"
                      disabled={!editBasic}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-xs text-gray-800">Email</label>
                    <RedDot />
                  </div>
                  <input
                    type="email"
                    value={restaurant.email}
                    onChange={e => setRestaurant({ ...restaurant, email: e.target.value })}
                    className={inputCls}
                    placeholder="owner@example.com"
                    disabled={!editBasic}
                  />
                </div>

                {editBasic && (
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="w-full bg-[#C9A84C] text-white py-2.5 rounded-lg font-semibold text-sm mt-2 disabled:opacity-60"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-[#111] mb-4">Logo</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-[#EBEBEB] bg-[#F8F8F8] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-gray-300">🏪</span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="inline-block px-4 py-2 bg-white border border-[#EBEBEB] rounded-lg text-xs font-medium text-gray-700 cursor-pointer">
                    Choose Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {logoPreview && (
  <button
    onClick={async () => {
      if (!restaurantId) return
      setLogoPreview(null)
      setRestaurant({ ...restaurant, logo_url: '' })
      await supabase.from('restaurants').update({ logo_url: null }).eq('id', restaurantId)
    }}
    className="ml-2 px-3 py-2 text-xs text-red-600"
  >
    Remove
  </button>
)}
                  <p className="text-[11px] text-gray-600 mt-1.5">PNG or JPG, square recommended</p>
                </div>
              </div>
            </div>

            {/* GST & Billing */}
            <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#111]">Billing & GST</h2>
                <button
                  onClick={() => setEditGst(!editGst)}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg"
                  style={{
                    background: editGst ? '#FBF7ED' : '#FFFFFF',
                    border: `1px solid ${editGst ? '#C9A84C' : '#EBEBEB'}`,
                    color: editGst ? '#C9A84C' : '#666',
                  }}
                >
                  {editGst ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-[#111] font-medium">Enable GST on bills</div>
                  <div className="text-[11px] text-gray-600 mt-0.5">Show GST number and tax breakdown</div>
                </div>
                <button
                  onClick={() => editGst && setRestaurant({ ...restaurant, gst_enabled: !restaurant.gst_enabled })}
                  className="w-11 h-6 rounded-full relative transition-colors flex-shrink-0"
                  style={{
                    background: restaurant.gst_enabled ? '#C9A84C' : '#DDD',
                    opacity: editGst ? 1 : 0.6,
                    cursor: editGst ? 'pointer' : 'not-allowed',
                  }}
                  disabled={!editGst}
                >
                  <div
                    className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                    style={{ left: restaurant.gst_enabled ? 22 : 2 }}
                  />
                </button>
              </div>

              {restaurant.gst_enabled && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-xs text-gray-800">GST Number</label>
                    <RedDot />
                  </div>
                  <input
                    type="text"
                    value={restaurant.gst_number}
                    onChange={e => setRestaurant({ ...restaurant, gst_number: e.target.value.toUpperCase() })}
                    className={inputCls}
                    placeholder="22AAAAA0000A1Z5"
                    disabled={!editGst}
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-gray-800 block mb-1.5">Bill Footer Text</label>
                <input
                  type="text"
                  value={restaurant.bill_footer}
                  onChange={e => setRestaurant({ ...restaurant, bill_footer: e.target.value })}
                  className={inputCls}
                  placeholder="Thank you for your order!"
                  disabled={!editGst}
                />
                <p className="text-[11px] text-gray-600 mt-1.5">Appears at the bottom of every bill</p>
              </div>

              {editGst && (
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full bg-[#C9A84C] text-white py-2.5 rounded-lg font-semibold text-sm mt-4 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>

            <div className="text-center text-[11px] text-gray-600">
              Fields marked <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block align-middle mx-1" /> are required
            </div>
          </div>

          {/* Right: QR */}
          <div>
            <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 sm:p-5 lg:sticky lg:top-20">
              <h2 className="text-sm font-semibold text-[#111] mb-1">QR Codes</h2>
              <p className="text-[11px] text-gray-600 mb-4">Print and place at tables and counter</p>

              <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg mb-4">
                <button
                  onClick={() => setQrType('menu')}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-md font-medium ${qrType === 'menu' ? 'bg-white text-[#111] shadow-sm' : 'text-gray-500'}`}
                >
                  Menu
                </button>
                <button
                  onClick={() => setQrType('home')}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-md font-medium ${qrType === 'home' ? 'bg-white text-[#111] shadow-sm' : 'text-gray-500'}`}
                >
                  Home Order
                </button>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#EBEBEB] flex justify-center">
                <img
                  src={qrType === 'menu' ? menuQrUrl : homeQrUrl}
                  alt="QR Code"
                  className="w-full max-w-[200px] aspect-square"
                />
              </div>

              <p className="text-[11px] text-gray-600 text-center mt-3 truncate">
                {qrType === 'menu' ? `/menu/${restaurant.slug || 'your-slug'}` : `/order/${restaurant.slug || 'your-slug'}`}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => {
                    const slug = restaurant.slug || 'your-restaurant'
                    const url = qrType === 'menu'
                      ? `${baseUrl}/menu/${slug}`
                      : `${baseUrl}/order/${slug}`
                    const html = buildPosterHtml(
                      restaurant.name || 'Restaurant Name',
                      restaurant.address || '',
                      url,
                      qrType
                    )
                    const w = window.open('', '_blank')
                    if (w) {
                      w.document.write(html)
                      w.document.close()
                    }
                    
                  }}

                
                  className="text-center bg-[#C9A84C] text-white px-3 py-2.5 rounded-lg text-xs font-semibold"
                >
                  Download Poster
                </button>
                <button
                  onClick={() => window.print()}
                  className="text-center bg-white border border-[#EBEBEB] text-gray-700 px-3 py-2.5 rounded-lg text-xs font-semibold"
                >
                  Print
                </button>
              </div>



              <div className="mt-4 pt-4 border-t border-[#F5F5F5] text-[11px] text-gray-600 space-y-1.5">
                <div className="flex justify-between">
                  <span>Print size</span>
                  <span className="text-gray-800">4×4 inch</span>
                </div>
                <div className="flex justify-between">
                  <span>Scan works on</span>
                  <span className="text-gray-800">Any phone</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}