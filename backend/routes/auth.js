const express = require('express')
const { supabase, supabaseAdmin } = require('../lib/supabase')

const router = express.Router()

// ── Input sanitiser ────────────────────────────────────────────────────────
function sanitise(value) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

/**
 * Pick a safe HTTP status out of a Supabase error.
 *
 * supabase-js reports network-level failures (DNS, timeout, connection
 * reset) with `status: 0`. `error.status ?? fallback` does NOT catch
 * that — `??` only substitutes for null and undefined — so the 0 reached
 * res.status() and Express threw "RangeError: Invalid status code: 0",
 * returning an HTML error page. The browser then showed "Could not reach
 * the server" on what was really a transient upstream blip.
 *
 * Anything outside the valid HTTP range falls back.
 */
function httpStatus(error, fallback) {
  const status = Number(error?.status)
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : fallback
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

  // public.profiles has unique constraints on username and mobile. Check
  // them up front so a clash comes back as a per-field message Signup.jsx
  // can pin to the right input, rather than as the opaque "Database error
  // saving new user" that a constraint violation inside the trigger
  // produces.
  const { data: availability, error: availabilityError } = await supabase.rpc(
    'signup_availability',
    { p_username: username, p_mobile: mobile }
  )

  if (availabilityError) {
    console.error('[auth] signup_availability failed:', availabilityError.message)
  } else if (availability) {
    const taken = {}
    if (availability.usernameTaken) taken.username = 'That username is already taken.'
    if (availability.mobileTaken)   taken.mobile   = 'That mobile number is already registered.'

    if (Object.keys(taken).length > 0) {
      return res.status(409).json({ error: 'Validation failed', fields: taken })
    }
  }

  const metadata = {
    full_name:     fullName,
    username,
    mobile,
    address_line1: addressLine1,
    address_line2: addressLine2,
    city,
    district,
    province,
  }

  // Two ways to create the account.
  //
  // With a service-role key we create it directly and mark the address
  // confirmed. No email is sent, so the built-in mailer's rate limit is
  // irrelevant and the account is usable the moment it exists.
  //
  // Without one we fall back to the public signUp(), which emails a
  // confirmation link — subject to that rate limit, and only deliverable
  // to project team members.
  const { data, error } = supabaseAdmin
    ? await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      })
    : await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      })

  if (error) {
    // Surface Supabase error message to the client (e.g. "User already registered")
    const raw = error.message.toLowerCase()

    // Supabase's built-in SMTP allows only a handful of messages per hour
    // and delivers only to project team members. Once it is exhausted,
    // signUp() fails with "Email rate limit exceeded" — which reads to the
    // person registering as though they did something wrong. The account
    // was never created, so tell them to retry, and point the operator at
    // the actual fix.
    if (raw.includes('rate limit') || raw.includes('too many requests')) {
      console.error(
        '[auth] Supabase email rate limit hit. Turn off Authentication → ' +
        'Providers → Email → "Confirm email", or configure custom SMTP.'
      )
      return res.status(429).json({
        error: 'Too many sign-ups from this project right now. Please try again in a few minutes.',
      })
    }

    return res.status(httpStatus(error, 400)).json({ error: error.message })
  }

  // Signup.jsx shows this message on the login page, so it has to match
  // reality. Whether a confirmation email was sent depends on the project's
  // "Confirm email" setting, not on which client created the account — so
  // read it off the account itself rather than assuming either way.
  const confirmed = Boolean(data.user?.email_confirmed_at)

  return res.status(201).json({
    message: confirmed
      ? 'Account created. You can log in now.'
      : 'Account created. Please check your email to confirm your registration.',
    userId: data.user?.id ?? null,
  })
})

// ── Helpers ────────────────────────────────────────────────────────────────
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_RE = /^(\+94|0)[0-9]{9}$/

/**
 * Resolve a login identifier (mobile number or username) to the email
 * address Supabase Auth expects.
 *
 * This used to call auth.admin.listUsers(), which only works with the
 * service-role key — with the anon key it returned nothing and every
 * mobile login failed with "No account found". It now goes through the
 * email_for_identifier() function in db/auth.sql, which reads
 * public.profiles and works with either key.
 *
 * Returns null when nothing matches, and the caller surfaces that as a
 * "not found" error.
 */
async function resolveEmailFromIdentifier(identifier) {
  const { data, error } = await supabase.rpc('email_for_identifier', { identifier })
  if (error) {
    console.error('[auth] email_for_identifier failed:', error.message)
    return null
  }
  return data ?? null
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
    const resolved = await resolveEmailFromIdentifier(identifier)
    if (!resolved) {
      return res.status(401).json({ error: 'No account found for that mobile number.' })
    }
    email = resolved
  }

  // ── Authenticate with Supabase ─────────────────────────────────────────
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // A status of 0 means we never reached Supabase at all. Reporting that
    // as 401 would tell the user their password was wrong, which is both
    // wrong and unactionable — say the service is unreachable instead.
    if (httpStatus(error, 0) === 0) {
      console.error('[auth] login could not reach Supabase:', error.message)
      return res.status(503).json({
        error: 'Could not reach the authentication service. Please try again in a moment.',
      })
    }

    // Make "Invalid login credentials" friendlier
    const message =
      error.message.toLowerCase().includes('invalid login credentials')
        ? 'Incorrect email/mobile or password. Please try again.'
        : error.message
    return res.status(httpStatus(error, 401)).json({ error: message })
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
