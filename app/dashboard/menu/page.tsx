'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Category = {
  id: string
  name: string
  is_active: boolean
  display_order: number
}

type Item = {
  id: string
  name: string
  price: number
  description: string | null
  prep_time_minutes: number
  category_id: string
  image_url: string | null
  is_available: boolean
}

const COMMON_CATEGORIES = ['Beverages', 'Snacks', 'Main Course', 'Desserts', 'Breakfast', 'Starters', 'Rice & Roti']

const COMMON_ITEMS: Record<string, string[]> = {
  'Beverages': ['Cutting Chai', 'Cold Coffee', 'Masala Chai', 'Lemon Tea', 'Lassi', 'Fresh Lime Soda', 'Buttermilk', 'Cold Drink'],
  'Snacks': ['Cheese Maggi', 'Samosa', 'Vada Pav', 'Pav Bhaji', 'French Fries', 'Sandwich', 'Momos', 'Spring Roll'],
  'Main Course': ['Veg Thali', 'Paneer Tikka', 'Butter Chicken', 'Dal Makhani', 'Chole Bhature', 'Rajma Chawal', 'Kadhai Paneer'],
  'Desserts': ['Gulab Jamun', 'Rasgulla', 'Ice Cream', 'Kheer', 'Jalebi', 'Gajar Halwa'],
  'Breakfast': ['Aloo Paratha', 'Poha', 'Upma', 'Idli Sambar', 'Dosa', 'Poori Sabzi'],
  'Starters': ['Paneer Tikka', 'Chicken Tikka', 'Veg Pakora', 'Chilli Paneer', 'Manchurian'],
  'Rice & Roti': ['Jeera Rice', 'Veg Biryani', 'Roti', 'Naan', 'Tandoori Roti', 'Paratha'],
}

const COMMON_PREP_TIMES = [5, 7, 10, 15, 20, 25, 30]

export default function MenuManagement() {
  const supabase = createClient()

  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const [showCatForm, setShowCatForm] = useState(false)
  const [catMode, setCatMode] = useState<'pick' | 'new'>('pick')
  const [pickedCat, setPickedCat] = useState('')
  const [customCat, setCustomCat] = useState('')

  const [showItemForm, setShowItemForm] = useState(false)
  const [itemMode, setItemMode] = useState<'pick' | 'new'>('pick')
  const [pickedItem, setPickedItem] = useState('')
  const [customItem, setCustomItem] = useState('')
  const [newItem, setNewItem] = useState({
    name: '', price: '', prep_time: '10', description: '', category_id: '', image_url: ''
  })
  const [itemError, setItemError] = useState('')

  // Load restaurant + data
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: rest } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!rest) { setLoading(false); return }
      setRestaurantId(rest.id)
      await fetchData(rest.id)
    }
    load()
  }, [])

  const fetchData = async (rid: string) => {
    setLoading(true)
    const { data: cats } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('restaurant_id', rid)
      .order('display_order')

    const { data: its } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', rid)
      .order('name')

    setCategories(cats || [])
    setItems(its || [])
    setLoading(false)
  }

  const refresh = () => { if (restaurantId) fetchData(restaurantId) }

  // ── Add Category ─────────────────────────────────────────────────
  const addCategory = async () => {
    const name = catMode === 'pick' ? pickedCat : customCat.trim()
    if (!name || !restaurantId) return
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert('Category already exists')
      return
    }

    const { error } = await supabase.from('menu_categories').insert({
      name,
      restaurant_id: restaurantId,
      display_order: categories.length + 1,
      is_active: true,
    })

    if (error) { alert('Error: ' + error.message); return }
    setPickedCat(''); setCustomCat(''); setShowCatForm(false)
    refresh()
  }

  const toggleCategory = async (cat: Category) => {
    await supabase.from('menu_categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    refresh()
  }

  const deleteCategory = async (catId: string) => {
    const hasItems = items.some(i => i.category_id === catId)
    if (hasItems) { alert('Remove all items from this category first.'); return }
    await supabase.from('menu_categories').delete().eq('id', catId)
    refresh()
  }

  // ── Add Item ─────────────────────────────────────────────────────
  const addItem = async () => {
    setItemError('')
    const name = itemMode === 'pick' ? pickedItem : customItem.trim()
    if (!name) { setItemError('Item name is required'); return }
    if (!newItem.price || isNaN(parseFloat(newItem.price))) { setItemError('Valid price is required'); return }
    if (!newItem.category_id) { setItemError('Select a category'); return }
    if (!restaurantId) return

    const { error } = await supabase.from('menu_items').insert({
      name,
      price: parseFloat(newItem.price),
      prep_time_minutes: parseInt(newItem.prep_time) || 10,
      description: newItem.description.trim() || null,
      category_id: newItem.category_id,
      restaurant_id: restaurantId,
      image_url: newItem.image_url.trim() || null,
      is_available: true,
    })

    if (error) { setItemError(error.message); return }
    setPickedItem(''); setCustomItem('')
    setNewItem({ name: '', price: '', prep_time: '10', description: '', category_id: '', image_url: '' })
    setShowItemForm(false)
    refresh()
  }

  const toggleItem = async (item: Item) => {
    await supabase.from('menu_items').update({ is_available: !item.is_available }).eq('id', item.id)
    refresh()
  }

  const deleteItem = async (itemId: string) => {
    await supabase.from('menu_items').delete().eq('id', itemId)
    refresh()
  }

  const filteredItems = activeCategory === 'all' ? items : items.filter(i => i.category_id === activeCategory)

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '—'

  const getCommonItems = () => {
    if (!newItem.category_id) return []
    const catName = categories.find(c => c.id === newItem.category_id)?.name
    return catName && COMMON_ITEMS[catName] ? COMMON_ITEMS[catName] : []
  }

  const inputCls = "w-full px-3 py-2.5 border border-[#EBEBEB] rounded-lg text-sm outline-none focus:border-[#C9A84C] bg-white text-black"

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading menu...</div>
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
            <a href="/dashboard/reports" className="hidden sm:inline text-[11px] sm:text-xs text-[#CCCCCC] hover:text-white no-underline">Reports</a>
            <a href="/dashboard/settings" className="text-[11px] sm:text-xs text-[#CCCCCC] hover:text-white no-underline">Settings</a>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-4 sm:py-6">

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#111]">Menu Management</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {categories.length} categories · {items.length} items
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCatForm(s => !s); setShowItemForm(false); setCatMode('pick'); setPickedCat('') }}
              className="flex-1 sm:flex-none px-4 py-2 bg-white border border-[#EBEBEB] rounded-lg text-xs sm:text-[13px] font-medium text-gray-700"
            >
              + Category
            </button>
            <button
              onClick={() => { setShowItemForm(s => !s); setShowCatForm(false); setItemMode('pick'); setPickedItem('') }}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#C9A84C] text-white rounded-lg text-xs sm:text-[13px] font-semibold"
            >
              + Add Item
            </button>
          </div>
        </div>

        {/* Add Category Form */}
        {showCatForm && (
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] font-semibold text-[#111]">Add Category</div>
              <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg">
                <button onClick={() => setCatMode('pick')} className={`px-3 py-1 text-xs rounded-md font-medium ${catMode === 'pick' ? 'bg-white text-[#111] shadow-sm' : 'text-gray-500'}`}>Pick</button>
                <button onClick={() => setCatMode('new')} className={`px-3 py-1 text-xs rounded-md font-medium ${catMode === 'new' ? 'bg-white text-[#111] shadow-sm' : 'text-gray-500'}`}>New</button>
              </div>
            </div>

            {catMode === 'pick' ? (
              <div>
                <div className="text-xs text-gray-500 mb-2">Choose common category</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_CATEGORIES.filter(c => !categories.some(cat => cat.name.toLowerCase() === c.toLowerCase())).map(c => (
                    <button
                      key={c}
                      onClick={() => setPickedCat(c)}
                      className="px-3.5 py-2 rounded-lg text-xs font-medium border transition"
                      style={{
                        borderColor: pickedCat === c ? '#C9A84C' : '#EBEBEB',
                        background: pickedCat === c ? '#FBF7ED' : '#FFFFFF',
                        color: pickedCat === c ? '#C9A84C' : '#444',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                  {COMMON_CATEGORIES.filter(c => !categories.some(cat => cat.name.toLowerCase() === c.toLowerCase())).length === 0 && (
                    <div className="text-xs text-gray-400 italic">All common categories added</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={addCategory} disabled={!pickedCat} className="px-5 py-2 bg-[#C9A84C] text-white rounded-lg text-[13px] font-semibold disabled:opacity-40">Save</button>
                  <button onClick={() => { setShowCatForm(false); setPickedCat(''); setCustomCat('') }} className="px-5 py-2 bg-white border border-[#EBEBEB] text-gray-600 rounded-lg text-[13px] font-medium">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Enter custom category name"
                  value={customCat}
                  onChange={e => setCustomCat(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCategory()}
                  className={inputCls + ' flex-1'}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={addCategory} className="flex-1 sm:flex-none px-5 py-2 bg-[#C9A84C] text-white rounded-lg text-[13px] font-semibold">Save</button>
                  <button onClick={() => { setShowCatForm(false); setCustomCat('') }} className="flex-1 sm:flex-none px-5 py-2 bg-white border border-[#EBEBEB] text-gray-600 rounded-lg text-[13px] font-medium">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Item Form */}
        {showItemForm && (
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 mb-4">
            <div className="text-[13px] font-semibold text-[#111] mb-4">Add Menu Item</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-600 block mb-1.5">Category *</label>
                <select
                  value={newItem.category_id}
                  onChange={e => { setNewItem({ ...newItem, category_id: e.target.value }); setPickedItem('') }}
                  className={inputCls}
                >
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {newItem.category_id && (
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-gray-600">Item Name *</label>
                    <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg">
                      <button onClick={() => { setItemMode('pick'); setCustomItem('') }} className={`px-2.5 py-0.5 text-[11px] rounded-md font-medium ${itemMode === 'pick' ? 'bg-white text-[#111] shadow-sm' : 'text-gray-500'}`}>Pick</button>
                      <button onClick={() => { setItemMode('new'); setPickedItem('') }} className={`px-2.5 py-0.5 text-[11px] rounded-md font-medium ${itemMode === 'new' ? 'bg-white text-[#111] shadow-sm' : 'text-gray-500'}`}>New</button>
                    </div>
                  </div>

                  {itemMode === 'pick' ? (
                    getCommonItems().length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto p-2 border border-[#EBEBEB] rounded-lg bg-[#FAFAFA]">
                        {getCommonItems().map(name => (
                          <button
                            key={name}
                            onClick={() => setPickedItem(name)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
                            style={{
                              borderColor: pickedItem === name ? '#C9A84C' : '#EBEBEB',
                              background: pickedItem === name ? '#FBF7ED' : '#FFFFFF',
                              color: pickedItem === name ? '#C9A84C' : '#444',
                            }}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic p-3 bg-gray-50 rounded-lg">No common items for this category. Use "New" tab.</div>
                    )
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter custom item name"
                      value={customItem}
                      onChange={e => setCustomItem(e.target.value)}
                      className={inputCls}
                      autoFocus
                    />
                  )}
                </div>
              )}

              <div>
                <label className="text-xs text-gray-600 block mb-1.5">Price (₹) *</label>
                <input type="number" inputMode="numeric" placeholder="60" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })} className={inputCls} />
              </div>

              <div>
                <label className="text-xs text-gray-600 block mb-1.5">Prep time</label>
                <div className="flex gap-1.5 flex-wrap mb-1.5">
                  {COMMON_PREP_TIMES.map(t => (
                    <button
                      key={t}
                      onClick={() => setNewItem({ ...newItem, prep_time: String(t) })}
                      className="px-2.5 py-1 rounded-md text-[11px] font-medium border"
                      style={{
                        borderColor: newItem.prep_time === String(t) ? '#C9A84C' : '#EBEBEB',
                        background: newItem.prep_time === String(t) ? '#FBF7ED' : '#FFFFFF',
                        color: newItem.prep_time === String(t) ? '#C9A84C' : '#666',
                      }}
                    >
                      {t}m
                    </button>
                  ))}
                </div>
                <input type="number" inputMode="numeric" placeholder="or custom mins" value={newItem.prep_time} onChange={e => setNewItem({ ...newItem, prep_time: e.target.value })} className={inputCls} />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-gray-600 block mb-1.5">Description (optional)</label>
                <input type="text" placeholder="Short description of the dish" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className={inputCls} />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-gray-600 block mb-1.5">Image URL (optional)</label>
                <input type="text" placeholder="https://..." value={newItem.image_url} onChange={e => setNewItem({ ...newItem, image_url: e.target.value })} className={inputCls} />
              </div>
            </div>

            {itemError && <div className="mt-3 text-xs text-red-600">{itemError}</div>}

            <div className="flex gap-2 mt-4">
              <button onClick={addItem} className="flex-1 sm:flex-none px-5 py-2 bg-[#C9A84C] text-white rounded-lg text-[13px] font-semibold">Save Item</button>
              <button onClick={() => { setShowItemForm(false); setItemError(''); setPickedItem(''); setCustomItem(''); setNewItem({ name: '', price: '', prep_time: '10', description: '', category_id: '', image_url: '' }) }} className="flex-1 sm:flex-none px-5 py-2 bg-white border border-[#EBEBEB] text-gray-600 rounded-lg text-[13px] font-medium">Cancel</button>
            </div>
          </div>
        )}

        {/* Mobile: category tabs */}
        <div className="sm:hidden flex gap-2 overflow-x-auto pb-3 mb-3 -mx-3 px-3">
          <button
            onClick={() => setActiveCategory('all')}
            className="px-3.5 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap"
            style={{
              borderColor: activeCategory === 'all' ? '#C9A84C' : '#EBEBEB',
              background: activeCategory === 'all' ? '#C9A84C' : '#FFFFFF',
              color: activeCategory === 'all' ? '#FFFFFF' : '#666',
            }}
          >
            All ({items.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-3.5 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap"
              style={{
                borderColor: activeCategory === cat.id ? '#C9A84C' : '#EBEBEB',
                background: activeCategory === cat.id ? '#C9A84C' : '#FFFFFF',
                color: activeCategory === cat.id ? '#FFFFFF' : '#666',
              }}
            >
              {cat.name} ({items.filter(i => i.category_id === cat.id).length})
            </button>
          ))}
        </div>

        {/* Layout */}
        <div className="flex flex-col sm:grid sm:grid-cols-[220px_1fr] sm:gap-5">

          {/* Desktop sidebar */}
          <div className="hidden sm:block">
            <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#F5F5F5]">
                <div className="text-[11px] font-semibold text-gray-500 tracking-wider uppercase">Categories</div>
              </div>
              <button
                onClick={() => setActiveCategory('all')}
                className="w-full px-4 py-3 text-left text-[13px] flex justify-between items-center"
                style={{
                  background: activeCategory === 'all' ? '#FBF7ED' : 'transparent',
                  borderLeft: activeCategory === 'all' ? '3px solid #C9A84C' : '3px solid transparent',
                  color: activeCategory === 'all' ? '#C9A84C' : '#444',
                  fontWeight: activeCategory === 'all' ? 600 : 400,
                }}
              >
                All items
                <span className="text-[11px] text-gray-400">{items.length}</span>
              </button>
              {categories.map(cat => (
                <div key={cat.id} className="relative">
                  <button
                    onClick={() => setActiveCategory(cat.id)}
                    className="w-full px-4 py-3 text-left text-[13px] flex justify-between items-center pr-16"
                    style={{
                      background: activeCategory === cat.id ? '#FBF7ED' : 'transparent',
                      borderLeft: activeCategory === cat.id ? '3px solid #C9A84C' : '3px solid transparent',
                      color: activeCategory === cat.id ? '#C9A84C' : (cat.is_active ? '#444' : '#BBB'),
                      fontWeight: activeCategory === cat.id ? 600 : 400,
                    }}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-[11px] text-gray-400">{items.filter(i => i.category_id === cat.id).length}</span>
                  </button>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button onClick={() => toggleCategory(cat)} className="w-5 h-5 rounded text-[10px] flex items-center justify-center" style={{ background: cat.is_active ? '#F0FDF4' : '#FEF2F2', color: cat.is_active ? '#16A34A' : '#DC2626' }}>
                      {cat.is_active ? '●' : '○'}
                    </button>
                    <button onClick={() => deleteCategory(cat.id)} className="w-5 h-5 rounded bg-red-50 text-red-600 text-[11px] flex items-center justify-center">×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div>
            {filteredItems.length === 0 ? (
              <div className="bg-white border border-[#EBEBEB] rounded-xl p-12 sm:p-16 text-center">
                <div className="text-sm text-gray-400">No items yet</div>
                <div className="text-xs text-gray-300 mt-1.5">Tap "+ Add Item" to add your first dish</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-white border border-[#EBEBEB] rounded-xl p-3 sm:p-4 flex items-center gap-3"
                    style={{ opacity: item.is_available ? 1 : 0.6 }}
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[#F8F8F8] border border-[#EBEBEB] flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🍽</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm sm:text-[15px] font-semibold text-[#111]">{item.name}</span>
                        {!item.is_available && (
                          <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Unavailable</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm sm:text-[15px] font-bold text-[#C9A84C]">₹{item.price}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-[11px] sm:text-xs text-gray-500">{item.prep_time_minutes} min</span>
                        <span className="text-gray-300 hidden sm:inline">·</span>
                        <span className="text-[11px] sm:text-xs text-gray-400 hidden sm:inline">{getCategoryName(item.category_id)}</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => toggleItem(item)}
                        className="px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap"
                        style={{
                          background: item.is_available ? '#F0FDF4' : '#FEF9EC',
                          color: item.is_available ? '#16A34A' : '#92400E',
                        }}
                      >
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-[#EBEBEB] bg-white text-red-600 text-sm flex items-center justify-center">×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}