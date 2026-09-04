import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

// Sri Lanka provinces and their districts
const PROVINCE_DISTRICTS = {
  'Western Province': ['Colombo', 'Gampaha', 'Kalutara'],
  'Central Province': ['Kandy', 'Matale', 'Nuwara Eliya'],
  'Southern Province': ['Galle', 'Matara', 'Hambantota'],
  'Northern Province': ['Jaffna', 'Kilinochchi', 'Mannar', 'Mullaitivu', 'Vavuniya'],
  'Eastern Province': ['Ampara', 'Batticaloa', 'Trincomalee'],
  'North Western Province': ['Kurunegala', 'Puttalam'],
  'North Central Province': ['Anuradhapura', 'Polonnaruwa'],
  'Uva Province': ['Badulla', 'Monaragala'],
  'Sabaragamuwa Province': ['Kegalle', 'Ratnapura'],
}

const PROVINCES = Object.keys(PROVINCE_DISTRICTS)

// ── Reusable field wrapper ──────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-base font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-500 mt-0.5">{error}</p>}
    </div>
  )
}

// ── Input styles ────────────────────────────────────────────────────────────
const inputClass =
  'w-full px-5 py-3.5 rounded-xl border border-slate-300 text-base text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 ' +
  'focus:border-transparent transition-shadow bg-white'

const inputErrorClass =
  'w-full px-5 py-3.5 rounded-xl border border-red-400 text-base text-slate-900 ' +
  'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 ' +
  'focus:border-transparent transition-shadow bg-white'

// ── Step indicator ──────────────────────────────────────────────────────────
function StepIndicator({ step }) {
  return (
    <div className="flex items-center justify-center gap-4 mb-10">
      {[1, 2].map((n) => (
        <div key={n} className="flex items-center gap-4">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold border-2 transition-all ${
              step === n
                ? 'bg-red-600 border-red-600 text-white shadow-md'
                : step > n
                ? 'bg-green-500 border-green-500 text-white'
                : 'bg-white border-slate-300 text-slate-400'
            }`}
          >
            {step > n ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              n
            )}
          </div>
          {n < 2 && (
            <div
              className={`h-0.5 w-20 rounded transition-all ${
                step > n ? 'bg-green-400' : 'bg-slate-200'
              }`}
            />
          )}
        </div>
      ))}
      <div className="sr-only">Step {step} of 2</div>
    </div>
  )
}

// ── Step labels ─────────────────────────────────────────────────────────────
function StepLabel({ step }) {
  const labels = [
    { title: 'Personal Information', sub: 'Tell us about yourself' },
    { title: 'Location Details', sub: 'Where are you based?' },
  ]
  const current = labels[step - 1]
  return (
    <div className="mb-7">
      <h2 className="text-2xl font-bold text-slate-900">{current.title}</h2>
      <p className="text-base text-slate-500 mt-1">{current.sub}</p>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // ── Form state ─────────────────────────────────────────────────────────
  const [personal, setPersonal] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
  })

  const [location, setLocation] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: '',
    province: '',
  })

  // ── Validation errors ──────────────────────────────────────────────────
  const [personalErrors, setPersonalErrors] = useState({})
  const [locationErrors, setLocationErrors] = useState({})

  // ── Handlers ───────────────────────────────────────────────────────────
  const handlePersonalChange = (e) => {
    const { name, value } = e.target
    setPersonal((prev) => ({ ...prev, [name]: value }))
    if (personalErrors[name]) {
      setPersonalErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleLocationChange = (e) => {
    const { name, value } = e.target
    setLocation((prev) => {
      const updated = { ...prev, [name]: value }
      // Reset district when province changes
      if (name === 'province') updated.district = ''
      return updated
    })
    if (locationErrors[name]) {
      setLocationErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // ── Step 1 validation ──────────────────────────────────────────────────
  const validatePersonal = () => {
    const errors = {}
    if (!personal.fullName.trim()) errors.fullName = 'Full name is required.'
    if (!personal.username.trim()) {
      errors.username = 'Username is required.'
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(personal.username)) {
      errors.username = 'Username must be 3–20 characters (letters, numbers, underscores).'
    }
    if (!personal.email.trim()) {
      errors.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email)) {
      errors.email = 'Please enter a valid email address.'
    }
    if (!personal.password) {
      errors.password = 'Password is required.'
    } else if (personal.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.'
    }
    if (!personal.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.'
    } else if (personal.password !== personal.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.'
    }
    if (!personal.mobile.trim()) {
      errors.mobile = 'Mobile number is required.'
    } else if (!/^(\+94|0)[0-9]{9}$/.test(personal.mobile.replace(/\s/g, ''))) {
      errors.mobile = 'Enter a valid Sri Lankan number (e.g. 0771234567).'
    }
    return errors
  }

  // ── Step 2 validation ──────────────────────────────────────────────────
  const validateLocation = () => {
    const errors = {}
    if (!location.addressLine1.trim()) errors.addressLine1 = 'Address line 1 is required.'
    if (!location.city.trim()) errors.city = 'City is required.'
    if (!location.district) errors.district = 'Please select a district.'
    if (!location.province) errors.province = 'Please select a province.'
    return errors
  }

  // ── Next step ──────────────────────────────────────────────────────────
  const handleNextStep = () => {
    const errors = validatePersonal()
    if (Object.keys(errors).length > 0) {
      setPersonalErrors(errors)
      return
    }
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Back step ──────────────────────────────────────────────────────────
  const handleBack = () => {
    setStep(1)
    setSubmitError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Final submit ───────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    const locErrors = validateLocation()
    if (Object.keys(locErrors).length > 0) {
      setLocationErrors(locErrors)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName:     personal.fullName,
          username:     personal.username,
          email:        personal.email,
          password:     personal.password,
          mobile:       personal.mobile,
          addressLine1: location.addressLine1,
          addressLine2: location.addressLine2,
          city:         location.city,
          district:     location.district,
          province:     location.province,
        }),
      })

      const payload = await res.json()

      if (!res.ok) {
        // If the backend returned per-field validation errors, surface them
        if (payload.fields) {
          const step1Fields = ['fullName', 'username', 'email', 'password', 'mobile']
          const step2Fields = ['addressLine1', 'addressLine2', 'city', 'district', 'province']

          const newPersonalErrors = {}
          const newLocationErrors = {}

          for (const [field, msg] of Object.entries(payload.fields)) {
            if (step1Fields.includes(field)) newPersonalErrors[field] = msg
            if (step2Fields.includes(field)) newLocationErrors[field] = msg
          }

          // If step 1 has errors, go back to it
          if (Object.keys(newPersonalErrors).length > 0) {
            setPersonalErrors(newPersonalErrors)
            setStep(1)
          } else {
            setLocationErrors(newLocationErrors)
          }
          return
        }
        // Generic backend error
        setSubmitError(payload.error ?? 'Signup failed. Please try again.')
        return
      }

      // Success — redirect to login with confirmation message
      navigate('/login', {
        state: { message: payload.message ?? 'Account created! Check your email to confirm before logging in.' },
      })
    } catch (_err) {
      setSubmitError('Could not reach the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Password strength ──────────────────────────────────────────────────
  const getPasswordStrength = (pw) => {
    if (!pw) return null
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^a-zA-Z0-9]/.test(pw)) score++
    if (score <= 1) return { label: 'Weak', color: 'bg-red-400', width: 'w-1/4' }
    if (score === 2) return { label: 'Fair', color: 'bg-yellow-400', width: 'w-2/4' }
    if (score === 3) return { label: 'Good', color: 'bg-blue-400', width: 'w-3/4' }
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' }
  }
  const strength = getPasswordStrength(personal.password)

  const availableDistricts = location.province ? PROVINCE_DISTRICTS[location.province] : []

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-red-50 to-slate-100 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-5">
            <span className="text-4xl">🇱🇰</span>
            <span className="font-bold text-slate-900 text-3xl">
              Help<span className="text-red-500">SriLanka</span>
            </span>
          </Link>
          <h1 className="text-4xl font-extrabold text-slate-900">Create an account</h1>
          <p className="text-slate-500 text-base mt-2">
            Join the emergency response network — it only takes a minute.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10">
          <StepIndicator step={step} />

          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <form
              onSubmit={(e) => { e.preventDefault(); handleNextStep() }}
              noValidate
              aria-label="Personal information form"
            >
              <StepLabel step={1} />

              <div className="flex flex-col gap-6">
                {/* Full Name */}
                <Field label="Full Name" required error={personalErrors.fullName}>
                  <input
                    type="text"
                    name="fullName"
                    value={personal.fullName}
                    onChange={handlePersonalChange}
                    placeholder="e.g. Kamal Perera"
                    autoComplete="name"
                    className={personalErrors.fullName ? inputErrorClass : inputClass}
                    aria-describedby={personalErrors.fullName ? 'fullName-error' : undefined}
                  />
                </Field>

                {/* Username */}
                <Field label="Username" required error={personalErrors.username}>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 text-base select-none">
                      @
                    </span>
                    <input
                      type="text"
                      name="username"
                      value={personal.username}
                      onChange={handlePersonalChange}
                      placeholder="e.g. kamal_perera"
                      autoComplete="username"
                      className={`${personalErrors.username ? inputErrorClass : inputClass} pl-9`}
                    />
                  </div>
                </Field>

                {/* Email */}
                <Field label="Email Address" required error={personalErrors.email}>
                  <input
                    type="email"
                    name="email"
                    value={personal.email}
                    onChange={handlePersonalChange}
                    placeholder="e.g. kamal@email.com"
                    autoComplete="email"
                    className={personalErrors.email ? inputErrorClass : inputClass}
                  />
                </Field>

                {/* Mobile */}
                <Field label="Mobile Number" required error={personalErrors.mobile}>
                  <input
                    type="tel"
                    name="mobile"
                    value={personal.mobile}
                    onChange={handlePersonalChange}
                    placeholder="e.g. 0771234567 or +94771234567"
                    autoComplete="tel"
                    className={personalErrors.mobile ? inputErrorClass : inputClass}
                  />
                </Field>

                {/* Password */}
                <Field label="Password" required error={personalErrors.password}>
                  <input
                    type="password"
                    name="password"
                    value={personal.password}
                    onChange={handlePersonalChange}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className={personalErrors.password ? inputErrorClass : inputClass}
                  />
                  {/* Strength bar */}
                  {strength && (
                    <div className="mt-2">
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`}
                        />
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        Password strength:{' '}
                        <span className="font-semibold text-slate-600">{strength.label}</span>
                      </p>
                    </div>
                  )}
                </Field>

                {/* Confirm Password */}
                <Field label="Confirm Password" required error={personalErrors.confirmPassword}>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={personal.confirmPassword}
                    onChange={handlePersonalChange}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    className={personalErrors.confirmPassword ? inputErrorClass : inputClass}
                  />
                </Field>
              </div>

              <button
                type="submit"
                className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors text-base shadow-sm"
              >
                Continue to Location Details →
              </button>
            </form>
          )}

          {/* ── STEP 2: Location Details ── */}
          {step === 2 && (
            <form
              onSubmit={handleSubmit}
              noValidate
              aria-label="Location details form"
            >
              <StepLabel step={2} />

              <div className="flex flex-col gap-6">
                {/* Address Line 1 */}
                <Field label="Address Line 1" required error={locationErrors.addressLine1}>
                  <input
                    type="text"
                    name="addressLine1"
                    value={location.addressLine1}
                    onChange={handleLocationChange}
                    placeholder="e.g. 45, Galle Road"
                    autoComplete="address-line1"
                    className={locationErrors.addressLine1 ? inputErrorClass : inputClass}
                  />
                </Field>

                {/* Address Line 2 */}
                <Field label="Address Line 2" error={locationErrors.addressLine2}>
                  <input
                    type="text"
                    name="addressLine2"
                    value={location.addressLine2}
                    onChange={handleLocationChange}
                    placeholder="e.g. Apartment 3B, Wellawatte"
                    autoComplete="address-line2"
                    className={inputClass}
                  />
                  <p className="text-sm text-slate-400 mt-0.5">Optional — apartment, suite, building name, etc.</p>
                </Field>

                {/* City */}
                <Field label="City" required error={locationErrors.city}>
                  <input
                    type="text"
                    name="city"
                    value={location.city}
                    onChange={handleLocationChange}
                    placeholder="e.g. Colombo"
                    autoComplete="address-level2"
                    className={locationErrors.city ? inputErrorClass : inputClass}
                  />
                </Field>

                {/* Province */}
                <Field label="Province" required error={locationErrors.province}>
                  <select
                    name="province"
                    value={location.province}
                    onChange={handleLocationChange}
                    className={`${locationErrors.province ? inputErrorClass : inputClass} cursor-pointer`}
                    aria-label="Select province"
                  >
                    <option value="" disabled>— Select your province —</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </Field>

                {/* District — cascades from province */}
                <Field label="District" required error={locationErrors.district}>
                  <select
                    name="district"
                    value={location.district}
                    onChange={handleLocationChange}
                    disabled={!location.province}
                    className={`${locationErrors.district ? inputErrorClass : inputClass} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label="Select district"
                  >
                    <option value="" disabled>
                      {location.province ? '— Select your district —' : '— Select a province first —'}
                    </option>
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Global error banner */}
              {submitError && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-base"
                >
                  <span className="text-lg leading-none mt-0.5">⚠️</span>
                  <span>{submitError}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors text-base shadow-sm flex items-center justify-center gap-2"
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
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Creating your account…
                    </>
                  ) : (
                    '✅ Create Account'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold py-3.5 rounded-xl transition-colors text-base"
                >
                  ← Back to Personal Info
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-base text-slate-500 mt-7">
          Already have an account?{' '}
          <Link to="/login" className="text-red-500 font-semibold hover:underline">
            Log in
          </Link>
        </p>

        {/* Emergency strip */}
        <div className="mt-6 bg-red-600 text-white rounded-xl px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-medium">Need emergency help right now?</span>
          <div className="flex gap-2 flex-wrap justify-end">
            <a href="tel:117" className="text-sm font-bold bg-white text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50">
              117 DMC
            </a>
            <a href="tel:119" className="text-sm font-bold bg-white text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50">
              119 Police
            </a>
            <a href="tel:1990" className="text-sm font-bold bg-white text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50">
              1990 Ambulance
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
