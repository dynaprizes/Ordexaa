export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center" style={{ fontFamily: 'system-ui' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#EBEBEB] border-t-[#C9A84C] rounded-full animate-spin mx-auto mb-4" />
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    </div>
  )
}