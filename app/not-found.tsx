import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6" style={{ fontFamily: 'system-ui' }}>
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🍽</div>
        <div className="text-4xl font-black text-[#111] mb-2">404</div>
        <div className="text-lg font-semibold text-[#111] mb-2">Page not found</div>
        <div className="text-sm text-gray-500 mb-6">
          The page you are looking for doesn't exist or has moved.
        </div>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#C9A84C] text-white rounded-lg text-sm font-semibold no-underline"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  )
}