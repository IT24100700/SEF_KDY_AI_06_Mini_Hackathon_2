/**
 * Donations — physical consignment pledges.
 *
 * Consumed by:
 *   frontend/src/pages/DonateForm.jsx    POST   /api/donations
 *   frontend/src/pages/DonationList.jsx  GET    /api/donations
 *                                        PATCH  /api/donations/:id
 *                                        DELETE /api/donations/:id
 *
 * The frontend speaks a nested shape ({ donor: { … }, items: [ … ] })
 * while the table stores the donor flattened into columns. toApi() and
 * the insert below are the only two places that translation happens.
 */

const express = require('express')
const { supabase } = require('../lib/supabase')

const router = express.Router()
const TABLE = 'donations'

// DonationList.jsx renders a badge per status and offers exactly these
// three in its dropdown.
const STATUSES = ['Pending', 'Dispatched', 'Delivered']

// ─── Shape translation ──────────────────────────────────────────────────────

/** Database row → the JSON shape DonationList.jsx destructures. */
function toApi(row) {
  return {
    id: row.id,
    donor: {
      name:      row.donor_name,
      phone:     row.donor_phone,
      email:     row.donor_email,
      anonymous: row.donor_anonymous,
      dropOff:   row.donor_drop_off,
      notes:     row.donor_notes,
    },
    items:           row.items ?? [],
    additionalItems: row.additional_items,
    totalUnits:      row.total_units,
    status:          row.status,
    createdAt:       row.created_at,
  }
}

// ─── Validation ─────────────────────────────────────────────────────────────

function sanitise(value) {
  return typeof value === 'string' ? value.trim() : ''
}

const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// DonateForm.jsx prefills '+94' and validates against the same rule.
const MOBILE_RE = /^(\+94|0)[0-9]{9}$/

/**
 * Validates the POST body from DonateForm.jsx.
 * @returns {{ errors: Record<string,string>, row: object|null }}
 */
function validateDonation(body) {
  const errors = {}
  const donor = body.donor ?? {}

  const name  = sanitise(donor.name)
  const phone = sanitise(donor.phone)
  const email = sanitise(donor.email)

  if (!name) errors.name = 'Donor name is required.'

  if (!phone) errors.phone = 'Contact number is required.'
  else if (!MOBILE_RE.test(phone.replace(/\s/g, '')))
    errors.phone = 'Enter a valid Sri Lankan number (e.g. 0771234567).'

  if (!email) errors.email = 'Email is required.'
  else if (!EMAIL_RE.test(email)) errors.email = 'Invalid email address.'

  // The catalogue builder guarantees this, but a direct API caller could
  // still post an empty consignment.
  const items = Array.isArray(body.items)
    ? body.items
        .filter((it) => it && typeof it.itemId === 'string' && Number(it.quantity) > 0)
        .map((it) => ({ itemId: it.itemId, quantity: Number(it.quantity) }))
    : []

  if (items.length === 0) errors.items = 'Pledge at least one item.'

  if (Object.keys(errors).length > 0) return { errors, row: null }

  // Trust the client's totalUnits only as a hint — recompute it so the
  // dashboard totals in DonationList.jsx cannot be skewed by a bad caller.
  const totalUnits = items.reduce((sum, it) => sum + it.quantity, 0)

  return {
    errors,
    row: {
      donor_name:      donor.anonymous ? 'Anonymous' : name,
      donor_phone:     phone,
      donor_email:     email,
      donor_anonymous: Boolean(donor.anonymous),
      donor_drop_off:  sanitise(donor.dropOff) || null,
      donor_notes:     sanitise(donor.notes)   || null,
      items,
      additional_items: sanitise(body.additionalItems) || null,
      total_units:      totalUnits,
      status:           'Pending',
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/donations
// Newest first — DonationList.jsx renders them in the order received.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message, message: error.message })
  }

  return res.status(200).json({ donations: (data ?? []).map(toApi) })
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/donations/:id
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: error.message, message: error.message })
  }
  if (!data) {
    return res.status(404).json({ error: 'Donation not found.', message: 'Donation not found.' })
  }

  return res.status(200).json({ donation: toApi(data) })
})

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/donations
// Body: { donor: { name, phone, email, anonymous, dropOff, notes },
//         items: [{ itemId, quantity }], additionalItems, totalUnits }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { errors, row } = validateDonation(req.body ?? {})

  if (Object.keys(errors).length > 0) {
    // DonateForm.jsx surfaces `message`; `fields` is there for whoever
    // wires up per-field errors later.
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
    message: 'Donation pledged. Thank you.',
    donation: toApi(data),
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/donations/:id
// Body: { status: 'Pending' | 'Dispatched' | 'Delivered' }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  const status = sanitise(req.body?.status)

  if (!status) {
    return res.status(400).json({ error: 'status is required.' })
  }
  if (!STATUSES.includes(status)) {
    return res.status(400).json({
      error: `status must be one of: ${STATUSES.join(', ')}`,
    })
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({ status })
    .eq('id', req.params.id)
    .select()
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: error.message })
  }
  // Also the path taken when RLS silently filters the row out, which is
  // why the message mentions both possibilities.
  if (!data) {
    return res.status(404).json({ error: 'Donation not found, or not updatable with this key.' })
  }

  return res.status(200).json({ donation: toApi(data) })
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/donations/:id
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq('id', req.params.id)
    .select()
    .maybeSingle()

  if (error) {
    return res.status(500).json({ error: error.message })
  }
  if (!data) {
    return res.status(404).json({ error: 'Donation not found, or not deletable with this key.' })
  }

  return res.status(200).json({
    message: 'Donation cancelled.',
    donation: toApi(data),
  })
})

module.exports = router
