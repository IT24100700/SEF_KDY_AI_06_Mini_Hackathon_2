/**
 * Items — aid requests and donation pledges.
 *
 * The browser currently reads and writes public.items directly through
 * the Supabase client (RequestForm.jsx, RequestList.jsx, Home.jsx), so
 * these endpoints are the server-side equivalent: same table, same
 * columns, available to anything that cannot hold a Supabase key.
 */

const express = require('express')
const { supabase } = require('../lib/supabase')

const router = express.Router()
const TABLE = 'items'

const VALID_TYPES = ['request', 'donation']

function sanitise(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * GET /api/items
 * Query params:
 *   ?type=request   → fetch aid requests
 *   ?type=donation  → fetch donations
 *   (omitted)       → fetch everything
 *
 * Newest first, matching the order RequestList.jsx expects.
 */
router.get('/', async (req, res) => {
  const type = sanitise(req.query.type).toLowerCase()

  if (type && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` })
  }

  let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false })

  // RequestForm.jsx writes lowercase, but seeded and hand-entered rows
  // may be capitalised, so match both rather than a bare .eq().
  if (type) {
    query = query.or(`type.eq.${type},type.eq.${type.toUpperCase()}`)
  }

  const { data, error } = await query

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({
    count: data?.length ?? 0,
    filter: { type: type || 'all' },
    items: data ?? [],
  })
})

/**
 * POST /api/items
 * Body: { type: 'request'|'donation', name, contact, location, category, description, ... }
 *
 * The six base columns are required-ish (as before); every optional
 * dispatch column from db/schema.sql is accepted and passed through when
 * present, so a coordinator can file a fully detailed record.
 */
router.post('/', async (req, res) => {
  const body = req.body ?? {}

  const type        = sanitise(body.type).toLowerCase()
  const name        = sanitise(body.name)
  const location    = sanitise(body.location)
  const description = sanitise(body.description)

  if (!type || !name || !location || !description) {
    return res.status(400).json({ error: 'type, name, location, and description are required' })
  }
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` })
  }

  const row = {
    type,
    name,
    location,
    description,
    contact:  sanitise(body.contact)  || null,
    category: sanitise(body.category) || null,
  }

  // Optional dispatch columns — only forwarded when the caller sent them,
  // so we never overwrite a default with null.
  const OPTIONAL = [
    'token', 'title', 'district', 'ds_division', 'shelter_name', 'landmark',
    'contact_name', 'contact_phone', 'supplies_needed', 'urgency',
    'dispatch_tag', 'notes', 'status',
  ]
  for (const column of OPTIONAL) {
    const value = sanitise(body[column])
    if (value) row[column] = value
  }

  if (body.quantity_or_people != null && Number.isFinite(Number(body.quantity_or_people))) {
    row.quantity_or_people = Number(body.quantity_or_people)
  }

  const { data, error } = await supabase.from(TABLE).insert([row]).select().single()

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(201).json({
    message: type === 'request' ? 'Aid request filed.' : 'Donation pledged.',
    item: data,
  })
})

module.exports = router
