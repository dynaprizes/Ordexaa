'use client'
import { useEffect, useState } from 'react'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Ordexaa',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: 'QR-based restaurant ordering system with AI kitchen batching, Bluetooth voice alerts, and direct UPI payments for Indian restaurants.',
  url: 'https://ordexaa.site',
  offers: {
    '@type': 'Offer',
    price: '999',
    priceCurrency: 'INR',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: '999',
      priceCurrency: 'INR',
      unitText: 'MONTH',
    },
  },
  provider: {
    '@type': 'Organization',
    name: 'Ordexaa',
    url: 'https://ordexaa.site',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-8433242149',
      contactType: 'customer support',
      areaServed: 'IN',
      availableLanguage: ['en', 'hi'],
    },
  },
}

const ORDERS = [
  { serial: '4521', items: 'Cheese Maggi ×2, Cutting Chai ×1' },
  { serial: '4522', items: 'Cold Coffee ×1, Samosa ×2' },
  { serial: '4523', items: 'Veg Thali ×1, Lassi ×1' },
  { serial: '4524', items: 'Paneer Tikka ×1, Roti ×3' },
]
const STATUSES = [
  { label: 'Confirmed',  dot: '#C9A84C', bg: '#FFFBEB', color: '#92400E',  note: '📱 Paid via UPI · ₹0 commission'       , noteBg: '#1A1A12', noteBorder: '#3A3A20', noteColor: '#D4C070' },
  { label: 'Preparing',  dot: '#3B82F6', bg: '#EFF6FF', color: '#1E40AF',  note: '🔊 Kitchen speaker announced this order' , noteBg: '#1A1A2E', noteBorder: '#2A2A4A', noteColor: '#A0A0DD' },
  { label: 'Ready ✓',   dot: '#16A34A', bg: '#F0FDF4', color: '#15803D',  note: '✅ WhatsApp bill sent to customer'       , noteBg: '#0D1F12', noteBorder: '#1A3A20', noteColor: '#7ACC8A' },
]
const ALL_FEATURES = [
  { title: 'QR Ordering',         desc: 'Customer scans, browses your live menu, pays directly to your UPI. No app download. No hardware. Works on any Android phone.' },
  { title: 'AI Kitchen Batching', desc: 'Same dish from multiple orders grouped automatically. Kitchen makes one batch instead of three. Less gas. Consistent quality.' },
  { title: 'Bluetooth Voice Alert',desc: 'Every new order announced on your kitchen Bluetooth speaker by dish name and customer name. Cook never looks away from the stove.' },
  { title: 'Home Ordering',       desc: 'Customer saves their number on first visit. Next time they order from home, arrive when food is ready. WhatsApp notification sent.' },
  { title: 'WhatsApp Bill',       desc: 'Bill automatically sent to customer WhatsApp after payment. Includes serial number, bill link, and home ordering link.' },
  { title: 'Direct UPI Payments', desc: 'Customer pays directly to your UPI account. Zero commission. Zero gateway fee. Money arrives instantly. We never touch your money.' },
  { title: 'Cash Management',     desc: '4-digit serial number confirms every cash payment. No bill unless you choose. Clean record of every cash and digital order.' },
  { title: 'AI Revenue Reports',  desc: 'Weekly report on WhatsApp every Sunday. Top selling items, slowest hours, combo suggestions, revenue trends. Plain language. No dashboards.' },
]
const STEPS = [
  { n: '01', title: 'Set up your menu',      desc: 'Add categories, items, photos, and prices. Takes 10 minutes. No technical knowledge needed.' },
  { n: '02', title: 'Print your QR',          desc: 'We generate your QR code automatically. Print and paste on tables, walls, and counter.' },
  { n: '03', title: 'Start taking orders',   desc: 'Customers scan, order, and pay. You see everything live on your phone or any screen.' },
]
const PAYMENTS = [
  { icon: '💵', title: 'Cash',         desc: '4-digit serial confirms payment. No bill unless you choose. No tax unless you want it.' },
  { icon: '📱', title: 'Direct UPI',   desc: 'Paid to your account instantly. Zero commission. Zero gateway fee. We never touch your money.' },
  { icon: '📩', title: 'WhatsApp Bill',desc: 'Bill sent to customer WhatsApp after payment. Includes home ordering link for next visit.' },
]
const STARTER = [
  'QR ordering with serial numbers',
  'AI kitchen batching',
  'Bluetooth voice alerts',
  'One click ready to serve',
  'Cash and UPI payments',
  'WhatsApp bill delivery',
  'Home ordering system',
  'Live order tracking',
  'Revenue reports',
  'Best selling analysis',
  'Kitchen QR for cooks',
  'Works on any device',
  '14 days free trial',
]

const F: Record<string, React.CSSProperties> = {
  page:    { fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", background: '#F5F3EF', color: '#111111' },
  wrap:    { maxWidth: 1100, margin: '0 auto', padding: '0 20px' },
  lbl:     { fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#B8923A', display: 'block', marginBottom: 12 },
  h2:      { fontSize: 34, fontWeight: 800, color: '#111111', lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 12px' },
  body:    { fontSize: 15, color: '#444', lineHeight: 1.75 },
  card:    { background: '#FFFFFF', border: '1px solid #E5E1D8', borderRadius: 12 },
  gold:    { background: '#C9A84C', color: '#fff', border: 'none', borderRadius: 8, padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', display: 'inline-block', letterSpacing: '0.01em' },
  ghost:   { background: 'transparent', color: '#333', border: '1.5px solid #D0CCC2', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
}

export default function Home() {
  const [oi, setOi] = useState(0)
  const [si, setSi] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setSi(s => { if (s >= 2) { setOi(i => (i+1) % ORDERS.length); return 0 } return s+1 })
    }, 1800)
    return () => clearInterval(t)
  }, [])

  const order  = ORDERS[oi]
  const status = STATUSES[si]

  return (
  <div style={F.page}>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />

      {/* ── NAVBAR ──────────────────────────────────────── */}
      <nav style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E1D8', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <img src="/ordexaa-logo.jpeg" alt="Ordexaa" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: '0.14em', color: '#111', lineHeight: 1.1 }}>ORDEXAA</div>
              <div className="hidden sm:block" style={{ fontSize: 8, color: '#B8923A', letterSpacing: '0.2em', marginTop: -1 }}>ORDER · MANAGE · GROW</div>
            </div>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: 28, marginRight: 12 }}>
              {['Features','Payments','Pricing'].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} style={{ fontSize: 13.5, color: '#333', textDecoration: 'none', fontWeight: 500 }}>{l}</a>
              ))}
            </div>
            <a href="/auth/login" style={{ ...F.ghost, padding: '7px 14px', fontSize: 12 }}>Login</a>
            <a href="/auth/login" style={{ ...F.gold, padding: '7px 14px', fontSize: 12 }}>Get Started</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #0F0F0F 0%, #1A1A14 60%, #14140F 100%)', padding: '60px 0 72px' }}>
        <div style={{ ...F.wrap, display: 'grid', gridTemplateColumns: '1fr', gap: 40, alignItems: 'center' }} className="lg:grid-cols-[1fr_400px] lg:!gap-16 lg:!py-24 lg:!pb-28">

          {/* Left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.28)', borderRadius: 6, padding: '6px 12px', marginBottom: 22 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9A84C' }} />
              <span style={{ fontSize: 11, color: '#D4B76A', fontWeight: 600, letterSpacing: '0.04em' }}>
                From <strong>₹33/day</strong> · No hardware · No commission
              </span>
            </div>

            <h1 className="text-[32px] leading-[1.1] sm:text-[42px] lg:text-[50px]" style={{ fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.025em', marginBottom: 18 }}>
              Stop losing orders.<br />
              <span style={{ color: '#C9A84C' }}>Start running your kitchen.</span>
            </h1>

            <p className="text-[15px] sm:text-[16.5px]" style={{ color: '#A8A8A0', lineHeight: 1.7, marginBottom: 30, maxWidth: 460 }}>
              QR ordering, AI batching, and Bluetooth voice alerts — all on the device already in your pocket. No hardware. No commission. Cancel anytime.
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 26, flexWrap: 'wrap' as const }}>
              <a href="/auth/login" style={{ ...F.gold, fontSize: 14, padding: '12px 24px' }}>Start 14-Day Free Trial</a>
              <a href="#features" style={{ ...F.ghost, fontSize: 14, padding: '11px 20px', color: '#CCCCCC', borderColor: '#3A3A30' }}>See Features →</a>
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' as const }}>
              {['₹0 setup cost', '₹0 commission on UPI', 'Setup in 30 min'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888880' }}>
                  <span style={{ color: '#C9A84C', fontWeight: 700 }}>✓</span>{t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — live card */}
          <div style={{ background: '#181818', border: '1px solid #2A2A24', borderRadius: 16, padding: 20, boxShadow: '0 40px 90px rgba(0,0,0,0.55)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #2A2A24' }}>
              <div>
                <div style={{ fontSize: 10, color: '#888880', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Sharma Cafe · Live</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 3 }}>Active Orders</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#0D1F0D', border: '1px solid #1C3A1C', borderRadius: 20, padding: '3px 10px' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E' }} />
                <span style={{ fontSize: 10, color: '#4ADE80', fontWeight: 600 }}>Live</span>
              </div>
            </div>

            <div style={{ background: '#212121', border: `1px solid ${status.dot}45`, borderRadius: 11, padding: 14, marginBottom: 12, transition: 'border-color 0.4s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 19, fontWeight: 900, color: '#D4B76A', fontFamily: 'monospace', letterSpacing: '0.04em' }}>#{order.serial}</div>
                  <div style={{ fontSize: 11.5, color: '#A8A8A0', marginTop: 3 }}>{order.items}</div>
                </div>
                <div style={{ background: status.bg, color: status.color, border: `1px solid ${status.dot}45`, borderRadius: 20, padding: '3px 10px', fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' as const, flexShrink: 0 }}>{status.label}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: status.noteBg, border: `1px solid ${status.noteBorder}`, borderRadius: 7, padding: '6px 10px', fontSize: 11, color: status.noteColor }}>
                {status.note}
              </div>
            </div>

            {[1,2].map(i => (
              <div key={i} style={{ background: '#181818', border: '1px solid #2A2A24', borderRadius: 9, padding: '10px 12px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#888880', fontFamily: 'monospace' }}>#{452 + oi + i}</div>
                  <div style={{ fontSize: 10, color: '#666660', marginTop: 2 }}>Waiting in queue</div>
                </div>
                <div style={{ fontSize: 10, color: '#888880', background: '#212121', border: '1px solid #2A2A24', borderRadius: 20, padding: '3px 9px' }}>Confirmed</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E1D8' }}>
        <div style={{ ...F.wrap, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)' }} className="md:!grid-cols-4">
          {[
            { val: '₹33/day',  sub: 'Starting cost per outlet' },
            { val: '₹0',       sub: 'Commission on UPI ever' },
            { val: '30 min',   sub: 'Average setup time' },
            { val: '14 days',  sub: 'Free trial, no card' },
          ].map((s,i) => (
            <div key={i} className="border-b border-r md:!border-b-0" style={{ textAlign: 'center', padding: '20px 12px', borderColor: '#EDEAE3', borderRightWidth: (i+1) % 2 === 0 ? 0 : 1 }}>
              <div className="text-[20px] sm:text-[28px]" style={{ fontWeight: 900, color: '#111', letterSpacing: '-0.025em' }}>{s.val}</div>
              <div className="text-[11px] sm:text-[12.5px]" style={{ color: '#666', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────── */}
      <section id="features" style={{ background: '#F5F3EF', padding: '56px 0' }} className="lg:!py-20">
        <div style={F.wrap}>
          <span style={F.lbl}>Platform</span>
          <h2 className="text-[26px] sm:text-[34px]" style={{ fontWeight: 800, color: '#111111', lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Everything your restaurant needs</h2>
          <p className="text-[14px] sm:text-[15.5px]" style={{ color: '#555', marginBottom: 36 }}>One login. No integrations. No per-transaction fees.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 1, background: '#E5E1D8', borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E1D8' }}>
            {ALL_FEATURES.map((f,i) => (
              <div key={i} style={{ background: '#FFFFFF', padding: '22px 20px' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #FBF7ED 0%, #F0EBD9 100%)', border: '1px solid #E8DFC4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#C9A84C' }} />
                </div>
                <h3 className="text-[14px] sm:text-[14.5px]" style={{ fontWeight: 700, color: '#111', marginBottom: 6, lineHeight: 1.3 }}>{f.title}</h3>
                <p className="text-[12px] sm:text-[13px]" style={{ color: '#666', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section style={{ background: '#FFFFFF', padding: '56px 0', borderTop: '1px solid #E5E1D8', borderBottom: '1px solid #E5E1D8' }} className="lg:!py-20">
        <div style={F.wrap}>
          <span style={F.lbl}>Setup</span>
          <h2 className="text-[26px] sm:text-[34px]" style={{ fontWeight: 800, color: '#111111', lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 36px' }}>Live in 30 minutes. Three steps.</h2>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 0 }}>
            {STEPS.map((s,i) => (
              <div key={i} className="border-b md:border-b-0 md:border-r last:border-0" style={{ padding: '22px 20px', borderColor: '#EDEAE3' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#E5DFD0', fontFamily: 'monospace', lineHeight: 1, marginBottom: 12, letterSpacing: '-0.02em' }}>{s.n}</div>
                <h3 className="text-[15px] sm:text-[17px]" style={{ fontWeight: 700, color: '#111', marginBottom: 8 }}>{s.title}</h3>
                <p className="text-[13px] sm:text-[14px]" style={{ color: '#555', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PAYMENTS ─────────────────────────────────────── */}
      <section id="payments" style={{ background: '#F5F3EF', padding: '56px 0' }} className="lg:!py-20">
        <div style={F.wrap}>
          <span style={F.lbl}>Payments</span>
          <h2 className="text-[26px] sm:text-[34px]" style={{ fontWeight: 800, color: '#111111', lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Zero commission. Money straight to your account.</h2>
          <p className="text-[14px] sm:text-[15.5px]" style={{ color: '#555', marginBottom: 36 }}>Ordexa never touches your money. Customer pays directly to your UPI ID.</p>

          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 14, marginBottom: 24 }}>
            {PAYMENTS.map((p,i) => (
              <div key={i} style={{ ...F.card, padding: 22 }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{p.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 }}>{p.title}</h3>
                <p className="text-[13px] sm:text-[13.5px]" style={{ color: '#555', lineHeight: 1.65, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section id="pricing" style={{ background: '#FFFFFF', padding: '56px 0', borderTop: '1px solid #E5E1D8' }} className="lg:!py-20">
  <div style={F.wrap}>
    <span style={F.lbl}>Pricing</span>
    <h2 className="text-[26px] sm:text-[34px]" style={{ fontWeight: 800, color: '#111111', lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Simple pricing. Everything included.</h2>
    <p className="text-[14px] sm:text-[15.5px]" style={{ color: '#555', marginBottom: 36 }}>14 days free. No card required. Cancel anytime.</p>

    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 18, maxWidth: 760, margin: '0 auto' }}>
      {/* Monthly */}
      <div style={{ ...F.card, padding: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: '#888', textTransform: 'uppercase' as const, marginBottom: 12 }}>Monthly</div>
        <div style={{ marginBottom: 4 }}>
          <span className="text-[32px] sm:text-[40px]" style={{ fontWeight: 900, color: '#111', letterSpacing: '-0.03em' }}>₹999</span>
          <span style={{ fontSize: 13, color: '#888', marginLeft: 6 }}>/month</span>
        </div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 22 }}>Cancel anytime</div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 9, marginBottom: 22 }}>
          {STARTER.map((f,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ color: '#C9A84C', fontSize: 12, flexShrink: 0, fontWeight: 700 }}>✓</span>
              <span className="text-[12.5px] sm:text-[13.5px]" style={{ color: '#333' }}>{f}</span>
            </div>
          ))}
        </div>
        <a href="/auth/login" style={{ display: 'block', textAlign: 'center' as const, border: '2px solid #111', color: '#111', borderRadius: 8, padding: '12px', fontSize: 13.5, fontWeight: 700, textDecoration: 'none' }}>
          Start Free Trial
        </a>
      </div>

      {/* Yearly */}
      <div style={{ ...F.card, padding: 24, border: '2px solid #C9A84C', position: 'relative' as const, background: 'linear-gradient(180deg, #FFFDF7 0%, #FFFFFF 100%)' }}>
        <div style={{ position: 'absolute' as const, top: -11, left: 20, background: '#C9A84C', color: '#FFF', fontSize: 10, fontWeight: 700, padding: '3px 11px', borderRadius: 20, letterSpacing: '0.08em' }}>SAVE ₹1,989</div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: '#B8923A', textTransform: 'uppercase' as const, marginBottom: 12 }}>Yearly</div>
        <div style={{ marginBottom: 4 }}>
          <span className="text-[32px] sm:text-[40px]" style={{ fontWeight: 900, color: '#111', letterSpacing: '-0.03em' }}>₹9,999</span>
          <span style={{ fontSize: 13, color: '#888', marginLeft: 6 }}>/year</span>
        </div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 22 }}>₹833/month · Save ₹1,989</div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 9, marginBottom: 22 }}>
          {STARTER.map((f,i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ color: '#C9A84C', fontSize: 12, flexShrink: 0, fontWeight: 700 }}>✓</span>
              <span className="text-[12.5px] sm:text-[13.5px]" style={{ color: '#333' }}>{f}</span>
            </div>
          ))}
        </div>
        <a href="/auth/login" style={{ display: 'block', textAlign: 'center' as const, background: '#C9A84C', color: '#FFF', border: 'none', borderRadius: 8, padding: '12px', fontSize: 13.5, fontWeight: 700, textDecoration: 'none' }}>
          Start Free Trial
        </a>
      </div>
    </div>
  </div>
</section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #0F0F0F 0%, #1A1A14 60%, #14140F 100%)', padding: '56px 0' }} className="lg:!py-20">
        <div style={{ ...F.wrap, textAlign: 'center' as const }}>
          <span style={{ ...F.lbl, display: 'block', textAlign: 'center' as const, color: '#D4B76A' }}>Get started today</span>
          <h2 className="text-[26px] sm:text-[38px]" style={{ fontWeight: 900, color: '#FFFFFF', marginBottom: 12, lineHeight: 1.12, letterSpacing: '-0.025em' }}>Your kitchen is ready for this.</h2>
          <p className="text-[14px] sm:text-[16px]" style={{ color: '#A8A8A0', marginBottom: 30, maxWidth: 440, margin: '0 auto 30px' }}>Join restaurants in Greater Noida already using Ordexaa. Free for 14 days — no card required.</p>
          <a href="/auth/login" style={{ ...F.gold, fontSize: 14, padding: '13px 32px', marginBottom: 20, display: 'inline-block' }}>Get Started — No Card Needed</a>
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap' as const, marginTop: 16 }}>
            {['Setup in 30 minutes','Cancel anytime','Support on WhatsApp'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888880' }}>
                <span style={{ color: '#C9A84C', fontWeight: 700 }}>✓</span>{t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{ background: '#0A0A08', borderTop: '1px solid #1E1E18', padding: '40px 0 22px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-3" style={{ ...F.wrap, gap: 32, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: '0.16em', color: '#FFF', marginBottom: 4 }}>ORDEXAA</div>
            <div style={{ fontSize: 8.5, color: '#C9A84C', letterSpacing: '0.2em', marginBottom: 12 }}>ORDER · MANAGE · GROW</div>
            <p style={{ fontSize: 12.5, color: '#777770', lineHeight: 1.7, margin: 0 }}>Restaurant Ordering Intelligence.<br />Made in Delhi, India 🇮🇳</p>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Product</div>
            <a href="/auth/login" style={{ display: 'block', fontSize: 13, color: '#999990', textDecoration: 'none', marginBottom: 8 }}>Login</a>
            {['Features','Payments','Pricing'].map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{ display: 'block', fontSize: 13, color: '#999990', textDecoration: 'none', marginBottom: 8 }}>{l}</a>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#666660', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Contact</div>
            <div style={{ fontSize: 13, color: '#999990', marginBottom: 6 }}>Bhuvnesh Sharma</div>
            <a href="tel:8433242149" style={{ display: 'block', fontSize: 13, color: '#999990', textDecoration: 'none', marginBottom: 6 }}>📞 8433242149</a>
            <a href="https://wa.me/918750083831" style={{ display: 'block', fontSize: 13, color: '#25D366', textDecoration: 'none' }}>💬 8750083831</a>
          </div>
        </div>
        <div style={{ ...F.wrap, paddingTop: 18, borderTop: '1px solid #1E1E18', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 10 }}>
          <div style={{ fontSize: 11.5, color: '#666660' }}>© 2026 Ordexaa. All rights reserved.</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' as const }}>
            <a href="/privacy" style={{ fontSize: 11.5, color: '#666660', textDecoration: 'none' }}>Privacy</a>
            <a href="/terms" style={{ fontSize: 11.5, color: '#666660', textDecoration: 'none' }}>Terms</a>
            <a href="/refund" style={{ fontSize: 11.5, color: '#666660', textDecoration: 'none' }}>Refund</a>
          </div>
        </div>
      </footer>
    </div>
  )
}