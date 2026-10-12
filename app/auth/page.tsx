'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendOTP = async () => {
    if (!email || !email.includes('@')) {
      setError('Enter valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
      } else {
        setStep('otp')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError('Enter 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token: otp })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid OTP')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Suddhbhooj</h1>
        <h2 className="text-xl text-center mb-6">
          {step === 'email' ? 'Login with Email' : 'Enter OTP'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded mb-4"
            />
            <button
              onClick={sendOTP}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded mb-4"
            />
            <button
              onClick={verifyOTP}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              onClick={() => setStep('email')}
              className="w-full text-blue-600 py-2 text-sm mt-2"
            >
              Go back
            </button>
          </>
        )}
      </div>
    </main>
  )
}