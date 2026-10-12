import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Ordexaa — QR Ordering System for Restaurants India | ₹999/month',
    template: '%s | Ordexaa',
  },
  description: 'QR-based restaurant ordering with AI kitchen batching, Bluetooth voice alerts, and direct UPI payments. No hardware. No commission. Setup in 30 minutes. Trusted by restaurants in Greater Noida.',
  keywords: [
    'QR ordering system India',
    'restaurant management software',
    'PetPooja alternative',
    'QR menu system',
    'restaurant ordering app India',
    'kitchen display system',
    'restaurant POS India',
    'digital menu India',
    'UPI restaurant payments',
    'restaurant automation',
  ],
  authors: [{ name: 'Ordexaa' }],
  creator: 'Ordexaa',
  publisher: 'Ordexaa',
  metadataBase: new URL('https://ordexaa.site'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Ordexaa — Restaurant Ordering Intelligence',
    description: 'QR ordering, AI kitchen batching, Bluetooth voice alerts. ₹999/month. No hardware. No commission.',
    url: 'https://ordexaa.site',
    siteName: 'Ordexaa',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ordexaa — Restaurant Ordering Intelligence',
    description: 'QR ordering, AI kitchen batching, Bluetooth voice alerts. ₹999/month.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification code here after setup
    // google: 'your-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
      </head>
      <body>{children}</body>
    </html>
  )
}