import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

// ── Shared input styles ─────────────────────────────────────────────────────
const baseInput =
  'w-full px-5 py-3.5 rounded-xl border text-base text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 ' +
  'focus:border-transparent transition-shadow bg-white'

const inputClass      = baseInput + ' border-slate-300 focus:ring-red-400'
const inputErrorClass = baseInput + ' border-red-400 focus:ring-red-400'

// ── Detect whether the string looks like a mobile number ───────────────────
const MOBILE_RE = /^(\+94|0)[0-9]{9}$/
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function identifierType(value) {
  const v = value.replace(/\s/g, '')
  if (MOBILE_RE.test(v)) return 'mobile'
  if (EMAIL_RE.test(v))  return 'email'
  return 'unknown'
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  const [identifier, setIdentifier]   = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [errors, setErrors]           = useState({})
  const [submitError, setSubmitError] = useState('')

  // Pull confirmation message passed from Signup redirect
  const successMsg = location.state?.message ?? ''

  // ── Live field-level validation ──────────────────────────────────────────
  const validateIdentifier = (val) => {
    if (!val.trim()) return 'Email or mobile number is required.'
    const type = identifierType(val)
    if (type === 'unknown')
      return 'Enter a valid email address or Sri Lankan mobile number.'
    return ''
  }

  const validatePassword = (val) => {
    if (!val) return 'Password is required.'
    return ''
  }

  const handleIdentifierChange = (e) => {
    setIdentifier(e.target.value)
    setSubmitError('')
    if (errors.identifier)
      setErrors((prev) => ({ ...prev, identifier: '' }))
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    setSubmitError('')
    if (errors.password)
      setErrors((prev) => ({ ...prev, password: '' }))
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    // Validate both fields before sending
    const idErr  = validateIdentifier(identifier)
    const pwErr  = validatePassword(password)
    if (idErr || pwErr) {
      setErrors({ identifier: idErr, password: pwErr })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      })

      const payload = await res.json()

      if (!res.ok) {
        setSubmitError(payload.error ?? 'Login failed. Please try again.')
        return
      }

      // Persist session tokens (lightweight — swap for a context/store if needed)
      sessionStorage.setItem('accessToken',  payload.accessToken)
      sessionStorage.setItem('refreshToken', payload.refreshToken)
      sessionStorage.setItem('user',         JSON.stringify(payload.user))

      // Redirect to home (or wherever the user was trying to go)
      navigate('/', { replace: true })
    } catch (_err) {
      setSubmitError('Could not reach the server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // ── Derived UI state ─────────────────────────────────────────────────────
  const idType = identifierType(identifier)
  const idIcon = identifier === ''
    ? '✉️'
    : idType === 'mobile'
    ? '📱'
    : idType === 'email'
    ? '✉️'
    : '⚠️'

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-red-50 to-slate-100 flex items-start justify-center py-14 px-4">
      <div className="w-full max-w-xl">

        {/* ── Brand header ── */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <span className="text-4xl">🇱🇰</span>
            <span className="font-bold text-slate-900 text-3xl">
              Help<span className="text-red-500">SriLanka</span>
            </span>
          </Link>
          <h1 className="text-4xl font-extrabold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 text-base mt-2">
            Sign in to manage aid requests and donations.
          </p>
        </div>

        {/* ── Success banner (from signup redirect) ── */}
        {successMsg && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-5 py-4 text-base"
          >
            <span className="text-lg leading-none mt-0.5">✅</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── Card ── */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10">
          <form onSubmit={handleSubmit} noValidate aria-label="Login form">

            <div className="flex flex-col gap-6">

              {/* ── Identifier field ── */}
              <div className="flex flex-col gap-1.5">
                <label className="text-base font-semibold text-slate-700">
                  Email or Mobile Number
                  <span className="text-red-500 ml-0.5">*</span>
                </label>

                <div className="relative">
                  {/* Dynamic icon */}
                  <span className="absolute inset-y-0 left-4 flex items-center text-xl select-none pointer-events-none">
                    {idIcon}
                  </span>
                  <input
                    type="text"
                    name="identifier"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    onBlur={() => {
                      const err = validateIdentifier(identifier)
                      setErrors((prev) => ({ ...prev, identifier: err }))
                    }}
                    placeholder="e.g. kamal@email.com or 0771234567"
                    autoComplete="username"
                    inputMode="email"
                    className={`${errors.identifier ? inputErrorClass : inputClass} pl-12`}
                    aria-describedby={errors.identifier ? 'identifier-error' : undefined}
                    aria-invalid={!!errors.identifier}
                  />
                </div>

                {/* Inline type hint */}
                {!errors.identifier && identifier && (
                  <p className="text-sm text-slate-400">
                    {idType === 'mobile' && '📱 Signing in with mobile number'}
                    {idType === 'email'  && '✉️ Signing in with email address'}
                    {idType === 'unknown' && 'Keep typing…'}
                  </p>
                )}
                {errors.identifier && (
                  <p id="identifier-error" className="text-sm text-red-500" role="alert">
                    {errors.identifier}
                  </p>
                )}
              </div>

              {/* ── Password field ── */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-base font-semibold text-slate-700">
                    Password
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm text-red-500 hover:underline focus:outline-none"
                    onClick={() => {/* TODO: forgot password flow */}}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => {
                      const err = validatePassword(password)
                      setErrors((prev) => ({ ...prev, password: err }))
                    }}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`${errors.password ? inputErrorClass : inputClass} pr-12`}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    aria-invalid={!!errors.password}
                  />
                  {/* Show / hide toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.06 0 2.08.175 3.03.495M15 12a3 3 0 11-5.196-2.998M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p id="password-error" className="text-sm text-red-500" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* ── Submit error banner ── */}
            {submitError && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-base"
              >
                <span className="text-lg leading-none mt-0.5">⚠️</span>
                <span>{submitError}</span>
              </div>
            )}

            {/* ── Submit button ── */}
            <button
              type="submit"
              disabled={loading}
              className="mt-8 w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-base shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-5 h-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>

          </form>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-base text-slate-500 mt-7">
          Don't have an account?{' '}
          <Link to="/signup" className="text-red-500 font-semibold hover:underline">
            Create one free
          </Link>
        </p>

        {/* ── Emergency strip ── */}
        <div className="mt-6 bg-red-600 text-white rounded-xl px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-medium">Need emergency help right now?</span>
          <div className="flex gap-2 flex-wrap">
            <a href="tel:117"  className="text-sm font-bold bg-white text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50">117 DMC</a>
            <a href="tel:119"  className="text-sm font-bold bg-white text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50">119 Police</a>
            <a href="tel:110"  className="text-sm font-bold bg-white text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50">110 Fire</a>
            <a href="tel:1990" className="text-sm font-bold bg-white text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50">1990 Ambulance</a>
          </div>
        </div>

      </div>
    </div>
  )
}
