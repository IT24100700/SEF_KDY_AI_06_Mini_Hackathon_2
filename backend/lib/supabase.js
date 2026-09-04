/**
 * Shared server-side Supabase client.
 *
 * Route files should import this rather than calling createClient()
 * themselves, so there is a single place to swap the anon key for a
 * service-role key when this is deployed.
 *
 * SUPABASE_ANON_KEY may hold either key:
 *   - anon key          → every query is subject to the RLS policies in
 *                         db/schema.sql (fine for local development)
 *   - service-role key  → bypasses RLS entirely, and is what makes the
 *                         admin lookup in routes/auth.js work. Never ship
 *                         it to the browser; it belongs in backend/.env
 *                         and nowhere else.
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY

// createClient() throws on an empty URL, which would take the whole
// server down at require time. Fail loudly with an actionable message
// instead of a stack trace from inside node_modules.
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_ANON_KEY. ' +
    'Copy backend/.env.example to backend/.env and fill in your project credentials.'
  )
}

const STATELESS = {
  auth: {
    // This is a stateless API server — it must never try to persist or
    // refresh a session on disk.
    persistSession: false,
    autoRefreshToken: false,
  },
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, STATELESS)

/**
 * Optional admin client, present only when SUPABASE_SERVICE_ROLE_KEY is
 * set in backend/.env.
 *
 * The service-role key bypasses RLS and unlocks auth.admin.*. The one
 * thing it buys us today is registration that works: signUp() asks
 * Supabase to send a confirmation email, and the built-in mailer allows
 * only a few per hour and delivers only to project team members — so
 * signups fail with "email rate limit exceeded", and the ones that do get
 * through cannot log in until someone clicks a link they never received.
 * admin.createUser({ email_confirm: true }) sends no email at all.
 *
 * Null when the key is absent, and routes fall back to the public flow —
 * so the server still boots and behaves exactly as before.
 *
 * NEVER expose this key to the browser. It belongs in backend/.env only.
 */
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = serviceRoleKey
  ? createClient(SUPABASE_URL, serviceRoleKey, STATELESS)
  : null

if (!supabaseAdmin) {
  console.warn(
    '[supabase] SUPABASE_SERVICE_ROLE_KEY not set — falling back to public signUp(), ' +
    'which is subject to the email rate limit and requires email confirmation.'
  )
}

module.exports = { supabase, supabaseAdmin }
