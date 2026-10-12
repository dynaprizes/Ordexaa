'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type OrderRow = {
  id: string
  total_amount: number
  payment_method: string
  status: string
  created_at: string
  order_items: { name: string; quantity: number; unit_price: number }[]
}

export default function ReportsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week')
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [restaurantName, setRestaurantName] = useState('')

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

      const days = period === 'week' ? 7 : period === 'month' ? 30 : 365
      const since = new Date()
      since.setDate(since.getDate() - days)

      const { data } = await supabase
        .from('orders')
        .select(`
          id, total_amount, payment_method, status, created_at,
          order_items ( name, quantity, unit_price )
        `)
        .eq('restaurant_id', rest.id)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })

      setOrders((data as any) || [])
      setLoading(false)
    }
    load()
  }, [period])

  // ── Compute aggregates ───────────────────────────────────
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0)
  const totalOrders = orders.length
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Top items
  const itemMap: Record<string, { count: number; revenue: number }> = {}
  orders.forEach(o => {
    o.order_items.forEach(i => {
      if (!itemMap[i.name]) itemMap[i.name] = { count: 0, revenue: 0 }
      itemMap[i.name].count += i.quantity
      itemMap[i.name].revenue += i.unit_price * i.quantity
    })
  })
  const topItems = Object.entries(itemMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const slowItems = Object.entries(itemMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => a.count - b.count)
    .slice(0, 3)

  const maxCount = topItems[0]?.count || 1

  // Daily revenue (last 7 days for week, 14 for month, last 12 months for year)
  const daysBack = period === 'week' ? 7 : period === 'month' ? 14 : 12
  const buckets: { label: string; revenue: number }[] = []

  if (period === 'year') {
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const label = d.toLocaleString('en-IN', { month: 'short' })
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const revenue = orders
        .filter(o => {
          const od = new Date(o.created_at)
          return od >= monthStart && od <= monthEnd
        })
        .reduce((s, o) => s + Number(o.total_amount), 0)
      buckets.push({ label, revenue })
    }
  } else {
    for (let i = daysBack - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const label = d.toLocaleString('en-IN', { weekday: 'short' })
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
      const revenue = orders
        .filter(o => {
          const od = new Date(o.created_at)
          return od >= dayStart && od <= dayEnd
        })
        .reduce((s, o) => s + Number(o.total_amount), 0)
      buckets.push({ label, revenue })
    }
  }

  const maxDaily = Math.max(...buckets.map(b => b.revenue), 1)

  // Peak hours
  const hourBuckets: { hour: string; orders: number }[] = []
  const hourRanges = ['8-10', '10-12', '12-2', '2-4', '4-6', '6-8', '8-10']
  const hourMap: Record<string, number> = {}
  hourRanges.forEach(h => hourMap[h] = 0)
  orders.forEach(o => {
    const h = new Date(o.created_at).getHours()
    if (h >= 8 && h < 10) hourMap['8-10']++
    else if (h >= 10 && h < 12) hourMap['10-12']++
    else if (h >= 12 && h < 14) hourMap['12-2']++
    else if (h >= 14 && h < 16) hourMap['2-4']++
    else if (h >= 16 && h < 18) hourMap['4-6']++
    else if (h >= 18 && h < 20) hourMap['6-8']++
    else if (h >= 20 && h < 22) hourMap['8-10']++
  })
  hourRanges.forEach(h => hourBuckets.push({ hour: h, orders: hourMap[h] }))
  const maxHourly = Math.max(...hourBuckets.map(h => h.orders), 1)

  // Top item name for KPI
  const topItemName = topItems[0]?.name || '—'
  const topItemCount = topItems[0]?.count || 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading report...</div>
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
            <a href="/dashboard/settings" className="hidden sm:inline text-[11px] sm:text-xs text-[#CCCCCC] hover:text-white no-underline">Settings</a>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-3 sm:px-6 py-4 sm:py-6">

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-bold text-[#111]">Revenue Report</h1>
            <span className="text-[9px] font-bold text-[#C9A84C] bg-[#FBF7ED] border border-[#F5D98B] px-2 py-0.5 rounded-full tracking-widest">
              LIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            {restaurantName} · {totalOrders} order{totalOrders !== 1 ? 's' : ''} in this period
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg mb-5 w-fit">
          {(['week', 'month', 'year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs rounded-md font-medium capitalize ${period === p ? 'bg-white text-[#111] shadow-sm' : 'text-gray-500'}`}
            >
              This {p}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-3 sm:p-4">
            <div className="text-[9px] sm:text-[10px] text-gray-400 tracking-widest uppercase mb-1">Revenue</div>
            <div className="text-lg sm:text-2xl font-black text-[#111]">₹{totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-3 sm:p-4">
            <div className="text-[9px] sm:text-[10px] text-gray-400 tracking-widest uppercase mb-1">Orders</div>
            <div className="text-lg sm:text-2xl font-black text-[#111]">{totalOrders}</div>
          </div>
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-3 sm:p-4">
            <div className="text-[9px] sm:text-[10px] text-gray-400 tracking-widest uppercase mb-1">Avg Order</div>
            <div className="text-lg sm:text-2xl font-black text-[#111]">₹{avgOrder.toFixed(0)}</div>
          </div>
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-3 sm:p-4">
            <div className="text-[9px] sm:text-[10px] text-gray-400 tracking-widest uppercase mb-1">Top Item</div>
            <div className="text-xs sm:text-base font-black text-[#111] truncate">{topItemName}</div>
            <div className="text-[10px] sm:text-[11px] text-gray-500 mt-1">{topItemCount} orders</div>
          </div>
        </div>

        {totalOrders === 0 ? (
          <div className="bg-white border border-[#EBEBEB] rounded-xl p-12 text-center">
            <div className="text-3xl mb-3 text-gray-300">—</div>
            <div className="text-sm text-gray-400">No orders yet in this period</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">

            {/* Best Selling */}
            <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 sm:p-5">
              <div className="text-[10px] sm:text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-4">
                🔥 Best Selling Items
              </div>
              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#FBF7ED] border border-[#F5D98B] flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-[#C9A84C] flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1 gap-2">
                        <span className="text-[12px] sm:text-[13px] font-semibold text-[#111] truncate">{item.name}</span>
                        <span className="text-[10px] sm:text-[11px] text-gray-400 flex-shrink-0">{item.count} orders</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#C9A84C] to-[#D4B76A] rounded-full"
                          style={{ width: `${(item.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-[11px] sm:text-[12px] font-bold text-[#111] flex-shrink-0">
                      ₹{item.revenue.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slow Moving */}
            <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 sm:p-5">
              <div className="text-[10px] sm:text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-4">
                ⚠️ Slow Moving Items
              </div>
              <div className="space-y-3">
                {slowItems.map(item => (
                  <div key={item.name} className="flex justify-between items-center p-3 bg-[#FEF9EC] border border-[#FDE68A] rounded-lg gap-2">
                    <div className="min-w-0">
                      <div className="text-[12px] sm:text-[13px] font-semibold text-[#92400E] truncate">{item.name}</div>
                      <div className="text-[10px] sm:text-[11px] text-[#B45309] mt-0.5">{item.count} orders only</div>
                    </div>
                    <div className="text-[11px] sm:text-[12px] font-bold text-[#92400E] flex-shrink-0">₹{item.revenue.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Trend */}
            <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 sm:p-5">
              <div className="text-[10px] sm:text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-4">
                📈 Revenue Trend
              </div>
              <div className="flex items-end justify-between gap-1 sm:gap-2 h-28 sm:h-32">
                {buckets.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="text-[8px] sm:text-[9px] font-semibold text-gray-600 truncate">
                      {d.revenue > 0 ? `₹${(d.revenue / 1000).toFixed(1)}k` : ''}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-[#C9A84C] to-[#D4B76A] rounded-t-md min-h-[3px]"
                      style={{ height: `${(d.revenue / maxDaily) * 100}%` }}
                    />
                    <div className="text-[8px] sm:text-[9px] text-gray-400 truncate">{d.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Hours */}
            <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 sm:p-5">
              <div className="text-[10px] sm:text-[11px] font-semibold text-gray-500 tracking-wider uppercase mb-4">
                ⏰ Peak Hours
              </div>
              <div className="space-y-2.5">
                {hourBuckets.map(h => {
                  const isPeak = h.orders === maxHourly && maxHourly > 0
                  return (
                    <div key={h.hour} className="flex items-center gap-2 sm:gap-3">
                      <div className="text-[10px] sm:text-[11px] text-gray-500 w-12 sm:w-16 flex-shrink-0 font-mono">
                        {h.hour}
                      </div>
                      <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden">
                        <div
                          className="h-full rounded-md flex items-center justify-end pr-2"
                          style={{
                            width: `${(h.orders / maxHourly) * 100}%`,
                            background: isPeak
                              ? 'linear-gradient(90deg, #C9A84C, #D4B76A)'
                              : '#E8E4D8',
                          }}
                        >
                          <span
                            className="text-[9px] sm:text-[10px] font-bold"
                            style={{ color: isPeak ? '#FFFFFF' : '#999' }}
                          >
                            {h.orders}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 text-center text-[10px] sm:text-[11px] text-gray-400">
          Report based on real orders
        </div>
      </div>
    </div>
  )
}