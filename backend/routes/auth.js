/**
 * backend/routes/auth.js
 *
 * Auth & profile routes for HelpSriLanka.
 *
 * POST /api/auth/signup  — register + insert into profiles table
 * POST /api/auth/login   — sign in with email OR mobile number + return profile
 *
 * Environment variables required in backend/.env:
 *   SUPABASE_URL          — your Supabase project URL
 *   SUPABASE_SERVICE_KEY  — service-role key (Settings → API → service_role)
 *                           KEEP THIS SECRET — never expose to the browser
 *   SUPABASE_ANON_KEY     — anon/public key  (used for signInWithPassword)
 *
 * Supabase SQL — run once to create the profiles table:
 *
 *   create table public.profiles (
 *     id             uuid primary key references auth.users(id) on delete cascade,
 *     full_name      text not null,
 *     username       text not null unique,
 *     mobile_number  text not null,
 *     address_line1  text not null,
 *     address_line2  text,
 *     city           text not null,
 *     district       text not null,
 *     province       text not null,
 *     created_at     timestamptz default now()
 *   );
 *
 *   alter table public.profiles enable row level security;
 *   create policy "service role full access" on public.profiles
 *     using (true) with check (true);
 */

'use strict'

const express = require('express')
const { createClient } = require('@supabase/supabase-js')

const router = express.Router()

// ─────────────────────────────────────────────────────────────────────────────
// Supabase clients
//
//  adminClient  — service-role key
//                 • auth.admin.createUser  (creates user, skips email confirm)
//                 • auth.admin.deleteUser  (rollback on profile insert failure)
//                 • auth.admin.listUsers   (mobile → email resolution)
//                 • profiles INSERT / SELECT (bypasses RLS)
//
//  anonClient   — anon/public key
//                 • auth.signInWithPassword (must use anon key, not service key)
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL         = process.env.SUPABASE_URL         ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''
const SUPABASE_ANON_KEY    = process.env.SUPABASE_ANON_KEY    ?? ''

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─────────────────────────────────────────────────────────────────────────────
// Regex patterns
// ─────────────────────────────────────────────────────────────────────────────
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_RE = /^(\+94|0)[0-9]{9}$/

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const trim = (v) => (typeof v === 'string' ? v.trim() : '')

/**
 * Validate all signup fields.
 * Returns { valid: true, fields } or { valid: false, errors }.
 */
function validateSignup(body) {
  const f = {
    fullName:     trim(body.fullName),
    username:     trim(body.username),
    email:        trim(body.email),
    password:     trim(body.password),
    mobile:       trim(body.mobile),
    addressLine1: trim(body.addressLine1),
    addressLine2: trim(body.addressLine2), // optional
    city:         trim(body.city),
    district:     trim(body.district),
    province:     trim(body.province),
  }

  const errors = {}

  if (!f.fullName)
    errors.fullName = 'Full name is required.'

  if (!f.username)
    errors.username = 'Username is required.'
  else if (!/^[a-zA-Z0-9_]{3,20}$/.test(f.username))
    errors.username = 'Username must be 3–20 characters (letters, numbers, underscores).'

  if (!f.email)
    errors.email = 'Email address is required.'
  else if (!EMAIL_RE.test(f.email))
    errors.email = 'Enter a valid email address.'

  if (!f.password)
    errors.password = 'Password is required.'
  else if (f.password.length < 8)
    errors.password = 'Password must be at least 8 characters.'

  if (!f.mobile)
    errors.mobile = 'Mobile number is required.'
  else if (!MOBILE_RE.test(f.mobile.replace(/\s/g, '')))
    errors.mobile = 'Enter a valid Sri Lankan number (e.g. 0771234567 or +94771234567).'

  if (!f.addressLine1) errors.addressLine1 = 'Address line 1 is required.'
  if (!f.city)         errors.city         = 'City is required.'
  if (!f.district)     errors.district     = 'District is required.'
  if (!f.province)     errors.province     = 'Province is required.'

  if (Object.keys(errors).length > 0) return { valid: false, errors }
  return { valid: true, fields: f }
}

/**
 * Resolve a Sri Lankan mobile number to the registered email address.
 * Scans user_metadata via the admin API.
 */
async function mobileToEmail(mobile) {
  const normalised = mobile.replace(/\s/g, '')
  const { data, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 })
  if (error || !data?.users) return null
  const match = data.users.find(
    (u) => (u.user_metadata?.mobile ?? '').replace(/\s/g, '') === normalised
  )
  return match?.email ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
//
// Request body (JSON):
//   fullName, username, email, password, mobile,
//   addressLine1, addressLine2 (optional), city, district, province
//
// Steps:
//   1. Server-side validation of all required fields
//   2. Create user in Supabase Auth (admin.createUser — immediately active)
//   3. Insert personal info + location into public.profiles
//   4. On profile insert failure, delete the orphaned auth user (rollback)
//   5. Return 201 with success message and user payload
// ─────────────────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {

  // ── Step 1: Validate ────────────────────────────────────────────────────
  const validation = validateSignup(req.body)
  if (!validation.valid) {
    return res.status(400).json({
      error:  'Validation failed.',
      fields: validation.errors,
    })
  }

  const {
    fullName, username, email, password, mobile,
    addressLine1, addressLine2, city, district, province,
  } = validation.fields

  // ── Step 2: Create Supabase Auth user ───────────────────────────────────
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,       // user is active immediately, no email confirmation needed
    user_metadata: {
      full_name: fullName,
      username,
      mobile,
    },
  })

  if (authError) {
    const isDuplicate =
      authError.message?.toLowerCase().includes('already registered') ||
      authError.message?.toLowerCase().includes('already been registered')

    return res.status(isDuplicate ? 409 : (authError.status ?? 400)).json({
      error: isDuplicate
        ? 'An account with that email already exists.'
        : authError.message,
    })
  }

  const userId = authData.user.id

  // ── Step 3: Insert into public.profiles ─────────────────────────────────
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id:            userId,
      full_name:     fullName,
      username,
      mobile_number: mobile,
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
      city,
      district,
      province,
    })

  // ── Step 4: Rollback on profile failure ─────────────────────────────────
  if (profileError) {
    // Delete the orphaned auth user so the data stays consistent
    await adminClient.auth.admin.deleteUser(userId)

    // PostgreSQL error code 23505 = unique_violation (duplicate username)
    if (profileError.code === '23505') {
      return res.status(409).json({ error: 'That username is already taken. Please choose another.' })
    }

    return res.status(500).json({
      error: 'Profile could not be saved. Please try again.',
    })
  }

  // ── Step 5: Success ──────────────────────────────────────────────────────
  return res.status(201).json({
    message: 'Account created successfully. You can now log in.',
    user: {
      id:       userId,
      email,
      fullName,
      username,
    },
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
//
// Request body (JSON):
//   identifier  — email address OR Sri Lankan mobile number (0771234567 / +94771234567)
//   password
//
// Steps:
//   1. Validate identifier format and password presence
//   2. If mobile number, resolve it to the registered email via admin API
//   3. signInWithPassword with the resolved email
//   4. Fetch the full profile row from public.profiles
//   5. Return 200 with session tokens + complete user profile
// ─────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {

  const identifier = trim(req.body.identifier)
  const password   = trim(req.body.password)

  // ── Step 1: Validate ────────────────────────────────────────────────────
  if (!identifier) {
    return res.status(400).json({ error: 'Email or mobile number is required.' })
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' })
  }

  const isMobile = MOBILE_RE.test(identifier.replace(/\s/g, ''))
  const isEmail  = EMAIL_RE.test(identifier)

  if (!isMobile && !isEmail) {
    return res.status(400).json({
      error: 'Enter a valid email address or Sri Lankan mobile number (e.g. 0771234567).',
    })
  }

  // ── Step 2: Resolve mobile → email ──────────────────────────────────────
  let email = identifier
  if (isMobile) {
    const resolved = await mobileToEmail(identifier)
    if (!resolved) {
      return res.status(401).json({ error: 'No account found for that mobile number.' })
    }
    email = resolved
  }

  // ── Step 3: Authenticate ────────────────────────────────────────────────
  const { data, error: authError } = await anonClient.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    const message = authError.message?.toLowerCase().includes('invalid login credentials')
      ? 'Incorrect email/mobile or password. Please try again.'
      : authError.message
    return res.status(authError.status ?? 401).json({ error: message })
  }

  // ── Step 4: Fetch full profile from database ─────────────────────────────
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('full_name, username, mobile_number, address_line1, address_line2, city, district, province')
    .eq('id', data.user.id)
    .single()

  if (profileError) {
    // Authentication succeeded — log the error but don't fail the request
    console.error('[login] profile fetch error:', profileError.message)
  }

  // ── Step 5: Return session + profile ────────────────────────────────────
  return res.status(200).json({
    message:      'Login successful.',
    accessToken:  data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn:    data.session.expires_in,
    user: {
      id:       data.user.id,
      email:    data.user.email,
      fullName: data.user.user_metadata?.full_name ?? '',
      username: data.user.user_metadata?.username  ?? '',
      // Complete profile from the profiles table (null if fetch failed)
      profile:  profile ?? null,
    },
  })
})

module.exports = router
