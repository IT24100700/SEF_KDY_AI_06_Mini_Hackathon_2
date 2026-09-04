/**
 * Feedback — citizen and relief-team reports on how the response went.
 *
 * Server-side equivalent of what Feedback.jsx currently does directly
 * against Supabase, so the page can be moved onto the API without any
 * change in behaviour.
 *
 * The board is append-only by design: db/schema.sql grants insert and
 * select but deliberately no update or delete, which is what makes the
 * log tamper-evident. There is no PATCH or DELETE here to match.
 */

const express = require('express')
const { supabase } = require('../lib/supabase')

const router = express.Router()
const TABLE = 'feedback'

// Mirrors the ROLES constant in Feedback.jsx.
const ROLES = ['requester', 'donor']

// Feedback.jsx renders the 30 most recent entries.
const DEFAULT_LIMIT = 30
const MAX_LIMIT = 100

function sanitise(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * Validates the submission. The rules match both the client-side checks
 * in Feedback.jsx and the CHECK constraints in db/schema.sql, so a bad
 * payload fails here with a readable message rather than as a Postgres
 * constraint violation.
 */
function validateFeedback(body) {
  const errors = {}

  const name     = sanitise(body.name)
  const role     = sanitise(body.role) || 'requester'
  const location = sanitise(body.location)
  const message  = sanitise(body.message)
  const rating   = Number(body.rating)

  if (!name) errors.name = 'Name is required.'

  if (!ROLES.includes(role)) errors.role = `role must be one of: ${ROLES.join(', ')}`

  if (!location) errors.location = 'District is required.'

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = 'Rating must be a whole number from 1 to 5.'
  }

  if (!message) errors.message = 'Message is required.'
  else if (message.length < 10 || message.length > 1000) {
    errors.message = 'Message must be between 10 and 1000 characters.'
  }

  if (Object.keys(errors).length > 0) return { errors, row: null }

  return { errors, row: { name, role, location, rating, message } }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/feedback
// Query params:
//   ?limit=30   → how many entries (default 30, max 100)
//   ?role=donor → filter to one side of the relief effort
// Newest first.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const role = sanitise(req.query.role).toLowerCase()

  if (role && !ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${ROLES.join(', ')}` })
  }

  const requested = Number(req.query.limit)
  const limit = Number.isInteger(requested) && requested > 0
    ? Math.min(requested, MAX_LIMIT)
    : DEFAULT_LIMIT

  let query = supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (role) query = query.eq('role', role)

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const entries = data ?? []

  // The page shows an average alongside the list, so send it rather than
  // making every client recompute it.
  const averageRating = entries.length > 0
    ? Number((entries.reduce((sum, e) => sum + e.rating, 0) / entries.length).toFixed(1))
    : null

  return res.status(200).json({
    count: entries.length,
    averageRating,
    feedback: entries,
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/feedback
// Body: { name, role, location, rating, message }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { errors, row } = validateFeedback(req.body ?? {})

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      message: Object.values(errors)[0],
      fields: errors,
    })
  }

  const { data, error } = await supabase.from(TABLE).insert([row]).select().single()

  if (error) {
    return res.status(500).json({ error: error.message, message: error.message })
  }

  return res.status(201).json({
    message: 'Thank you — your feedback has been recorded.',
    feedback: data,
  })
})

module.exports = router
