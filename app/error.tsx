'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6" style={{ fontFamily: 'system-ui' }}>
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <div className="text-lg font-semibold text-[#111] mb-2">Something went wrong</div>
        <div className="text-sm text-gray-500 mb-6">
          An unexpected error occurred. Please try again.
        </div>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#C9A84C] text-white rounded-lg text-sm font-semibold"
        >
          Try again
        </button>
      </div>
    </div>
  )
}