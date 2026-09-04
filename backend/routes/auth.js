const express = require('express')
const { createClient } = require('@supabase/supabase-js')

const router = express.Router()

// ── Supabase client (service-role for server-side auth) ────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_ANON_KEY ?? ''
)

// ── Input sanitiser ────────────────────────────────────────────────────────
function sanitise(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

// ── Validators ─────────────────────────────────────────────────────────────
function validateSignupBody(body) {
  const errors = {}

  const fullName    = sanitise(body.fullName)
  const username    = sanitise(body.username)
  const email       = sanitise(body.email)
  const password    = sanitise(body.password)
  const mobile      = sanitise(body.mobile)
  const addressLine1 = sanitise(body.addressLine1)
  const city        = sanitise(body.city)
  const district    = sanitise(body.district)
  const province    = sanitise(body.province)

  if (!fullName)  errors.fullName = 'Full name is required.'
  if (!username)  errors.username = 'Username is required.'
  else if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
    errors.username = 'Username must be 3–20 characters (letters, numbers, underscores).'

  if (!email)     errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Invalid email address.'

  if (!password)  errors.password = 'Password is required.'
  else if (password.length < 8)
    errors.password = 'Password must be at least 8 characters.'

  if (!mobile)    errors.mobile = 'Mobile number is required.'
  else if (!/^(\+94|0)[0-9]{9}$/.test(mobile.replace(/\s/g, '')))
    errors.mobile = 'Enter a valid Sri Lankan number (e.g. 0771234567).'

  if (!addressLine1) errors.addressLine1 = 'Address line 1 is required.'
  if (!city)         errors.city         = 'City is required.'
  if (!district)     errors.district     = 'District is required.'
  if (!province)     errors.province     = 'Province is required.'

  return {
    errors,
    fields: {
      fullName, username, email, password, mobile,
      addressLine1,
      addressLine2: sanitise(body.addressLine2),
      city, district, province,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// ─────────────────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const { errors, fields } = validateSignupBody(req.body)

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', fields: errors })
  }

  const { email, password, fullName, username, mobile,
          addressLine1, addressLine2, city, district, province } = fields

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name:     fullName,
        username,
        mobile,
        address_line1: addressLine1,
        address_line2: addressLine2,
        city,
        district,
        province,
      },
    },
  })

  if (error) {
    // Surface Supabase error message to the client (e.g. "User already registered")
    const status = error.status ?? 400
    return res.status(status).json({ error: error.message })
  }

  // data.user is null when email confirmation is required — that is still a success
  return res.status(201).json({
    message: 'Account created. Please check your email to confirm your registration.',
    userId: data.user?.id ?? null,
  })
})

// ── Helpers ────────────────────────────────────────────────────────────────
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_RE = /^(\+94|0)[0-9]{9}$/

/**
 * If the identifier looks like a Sri Lankan mobile number, resolve it to the
 * registered email by querying the profiles stored in user_metadata.
 * Requires the service-role key (or an RPC / profiles table) — here we use
 * the admin listUsers call available with the service-role key.
 * Falls back gracefully: if the lookup fails, we return null and let the
 * caller surface a "not found" error.
 */
async function resolveEmailFromMobile(mobile) {
  // Supabase admin API — only works with the service-role key
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error || !data) return null

  const normalised = mobile.replace(/\s/g, '')
  const match = data.users.find((u) => {
    const stored = (u.user_metadata?.mobile ?? '').replace(/\s/g, '')
    return stored === normalised
  })
  return match?.email ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { identifier: string (email OR mobile), password: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const identifier = sanitise(req.body.identifier)
  const password   = sanitise(req.body.password)

  if (!identifier) {
    return res.status(400).json({ error: 'Email or mobile number is required.' })
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' })
  }

  // ── Resolve the email to pass to Supabase ─────────────────────────────
  let email = identifier

  const isMobile = MOBILE_RE.test(identifier.replace(/\s/g, ''))
  const isEmail  = EMAIL_RE.test(identifier)

  if (!isMobile && !isEmail) {
    return res.status(400).json({
      error: 'Enter a valid email address or Sri Lankan mobile number (e.g. 0771234567).',
    })
  }

  if (isMobile) {
    const resolved = await resolveEmailFromMobile(identifier)
    if (!resolved) {
      return res.status(401).json({ error: 'No account found for that mobile number.' })
    }
    email = resolved
  }

  // ── Authenticate with Supabase ─────────────────────────────────────────
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const status = error.status ?? 401
    // Make "Invalid login credentials" friendlier
    const message =
      error.message.toLowerCase().includes('invalid login credentials')
        ? 'Incorrect email/mobile or password. Please try again.'
        : error.message
    return res.status(status).json({ error: message })
  }

  return res.status(200).json({
    message: 'Login successful.',
    accessToken:  data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: {
      id:       data.user.id,
      email:    data.user.email,
      fullName: data.user.user_metadata?.full_name ?? '',
      username: data.user.user_metadata?.username  ?? '',
    },
  })
})

module.exports = router
