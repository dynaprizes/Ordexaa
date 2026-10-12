import { NextResponse } from 'next/server'

type WhatsAppPayload = {
  phone: string
  type: 'bill' | 'ready' | 'home_ready'
  data: {
    serial: string
    customerName?: string
    restaurantName: string
    total?: number
    billUrl?: string
    homeOrderUrl?: string
  }
}

export async function POST(request: Request) {
  try {
    const payload: WhatsAppPayload = await request.json()

    if (!payload.phone || payload.phone.length !== 10) {
      return NextResponse.json(
        { error: 'Valid 10-digit phone required' },
        { status: 400 }
      )
    }

    const message = buildMessage(payload)

    // ── MOCK: Log to console ────────────────────────────────────────
    console.log('\n📱 ═══════════════════════════════════════════')
    console.log('   WHATSAPP MESSAGE (MOCK)')
    console.log('═══════════════════════════════════════════════')
    console.log('   To:      +91', payload.phone)
    console.log('   Type:    ', payload.type)
    console.log('   Message:')
    message.split('\n').forEach(line => console.log('            ' + line))
    console.log('═══════════════════════════════════════════════\n')

    // ── REAL IMPLEMENTATION (commented — for Phase 2) ───────────────
    // const response = await fetch('https://api.interakt.ai/v1/public/message/', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Basic ${process.env.INTERAKT_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     countryCode: '+91',
    //     phoneNumber: payload.phone,
    //     type: 'Template',
    //     template: {
    //       name: payload.type === 'bill' ? 'order_bill' : 'order_ready',
    //       languageCode: 'en',
    //       bodyValues: [...],
    //     },
    //   }),
    // })

    return NextResponse.json({
      success: true,
      message: 'WhatsApp sent (mock)',
      preview: message,
    })

  } catch (error) {
    console.error('WhatsApp error:', error)
    return NextResponse.json(
      { error: 'Failed to send WhatsApp' },
      { status: 500 }
    )
  }
}

// ── Message templates ─────────────────────────────────────────────
function buildMessage(payload: WhatsAppPayload): string {
  const { type, data } = payload

  if (type === 'bill') {
    return `🍽️ ${data.restaurantName}

Order #${data.serial} confirmed.
${data.customerName ? `Thanks, ${data.customerName}!` : ''}

Total: ₹${data.total}

🔗 View Bill: ${data.billUrl}
🏠 Order again: ${data.homeOrderUrl}

Thank you for ordering!`
  }

  if (type === 'ready') {
    return `✅ ${data.restaurantName}

Order #${data.serial} is READY!

${data.customerName ? `${data.customerName}, please` : 'Please'} collect from the counter.

🔗 View Bill: ${data.billUrl}`
  }

  if (type === 'home_ready') {
    return `🏠 ${data.restaurantName}

Hello${data.customerName ? ` ${data.customerName}` : ''}!

Your home order #${data.serial} is READY.

Please come collect your order.

Thank you!`
  }

  return 'Order update from ' + data.restaurantName
}