'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  // Check existing session
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) router.push('/dashboard')
    }
    check()
  }, [])

  const sendOTP = async () => {
    setError('')
    setMessage('')

    if (!email || !email.includes('@') || !email.includes('.')) {
      setError('Enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: true },
      })

      if (error) {
        if (error.message.toLowerCase().includes('rate') || error.status === 429) {
          setError('Too many requests. Wait a minute.')
        } else {
          setError(error.message)
        }
      } else {
        setMessage('OTP sent to your email')
        setStep('otp')
        setResendTimer(30)
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async () => {
    setError('')

    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit OTP')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp,
        type: 'email',
      })

      if (error) {
        setError(error.message)
      } else if (data.user) {
        setMessage('Login successful')
        // Check if restaurant exists
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_id', data.user.id)
          .maybeSingle()

        if (restaurant) {
          router.push('/dashboard')
        } else {
          router.push('/dashboard/setup')
        }
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const resendOTP = async () => {
    if (resendTimer > 0) return
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('OTP resent')
        setResendTimer(30)
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/ordexaa-logo.jpeg" alt="Ordexaa" className="w-16 h-16 rounded-xl object-cover mb-3" />
          <h1 className="text-3xl font-bold tracking-wider">ORDEXAA</h1>
          <p className="text-xs text-yellow-600 tracking-widest mt-1">ORDER · MANAGE · GROW</p>
        </div>

        <h2 className="text-xl font-semibold text-center mb-6">
          {step === 'email' ? 'Login to your account' : 'Enter OTP'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>
        )}

        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm">{message}</div>
        )}

        {step === 'email' ? (
          <>
            <label className="block text-sm font-medium mb-2">Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendOTP()}
              className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:border-yellow-600"
              disabled={loading}
            />
            <button
              onClick={sendOTP}
              disabled={loading}
              className="w-full bg-yellow-600 text-white py-3 rounded hover:bg-yellow-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4 text-center">
              OTP sent to <strong>{email}</strong>
            </p>
            <label className="block text-sm font-medium mb-2">Enter 6-digit OTP</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && verifyOTP()}
              className="w-full p-3 border border-gray-300 rounded mb-4 text-center text-2xl tracking-widest focus:outline-none focus:border-yellow-600"
              disabled={loading}
            />
            <button
              onClick={verifyOTP}
              disabled={loading}
              className="w-full bg-yellow-600 text-white py-3 rounded hover:bg-yellow-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              onClick={resendOTP}
              disabled={loading || resendTimer > 0}
              className="w-full text-yellow-600 py-2 text-sm mt-1 disabled:text-gray-400"
            >
              {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
            </button>

            <button
              onClick={() => { setStep('email'); setOtp(''); setError(''); setMessage('') }}
              className="w-full text-gray-500 py-2 text-sm"
              disabled={loading}
            >
              ← Change email
            </button>
          </>
        )}

        <p className="text-xs text-gray-400 text-center mt-6">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-yellow-600 hover:underline">Terms</a>
          {' '}&{' '}
          <a href="/privacy" className="text-yellow-600 hover:underline">Privacy Policy</a>
        </p>
      </div>
    </main>
  )
}