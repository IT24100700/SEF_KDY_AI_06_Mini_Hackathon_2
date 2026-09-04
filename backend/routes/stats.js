/**
 * Relief statistics for the landing page.
 *
 * Home.jsx currently pulls every row of `items` into the browser just to
 * count them, then recomputes the same three numbers every 30 seconds.
 * That works while the dataset is small and gets steadily worse as it
 * grows. This endpoint returns the counts directly.
 *
 * The three figures match useReliefStats() in Home.jsx exactly:
 *   pledges   → items with type='donation'
 *   pending   → items with type='request'
 *   districts → distinct request locations
 */

const express = require('express')
const { supabase } = require('../lib/supabase')

const router = express.Router()

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/stats
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  // `location` is still fetched because distinct-district counting has no
  // equivalent through PostgREST without a database view or RPC. It is one
  // short text column, which is a great deal less than the select('*') the
  // requests board pulls.
  const itemsQuery = supabase.from('items').select('type, location')

  // head:true asks for the count only and returns no rows at all.
  const donationsQuery = supabase
    .from('donations')
    .select('total_units, status', { count: 'exact' })

  const feedbackQuery = supabase
    .from('feedback')
    .select('rating', { count: 'exact' })

  const [items, donations, feedback] = await Promise.all([
    itemsQuery,
    donationsQuery,
    feedbackQuery,
  ])

  const firstError = items.error ?? donations.error ?? feedback.error
  if (firstError) {
    return res.status(500).json({ error: firstError.message })
  }

  const rows = items.data ?? []
  const requests = rows.filter((r) => r.type?.toLowerCase() === 'request')

  const districts = new Set(
    requests.map((r) => (r.location ?? '').trim().toLowerCase()).filter(Boolean)
  ).size

  const pledgeRows = donations.data ?? []
  const ratings = (feedback.data ?? []).map((f) => f.rating)

  return res.status(200).json({
    // ── What Home.jsx renders ────────────────────────────────
    pledges: rows.filter((r) => r.type?.toLowerCase() === 'donation').length,
    pending: requests.length,
    districts,

    // ── Consignment totals, as shown on the donations board ──
    donations: {
      total:      pledgeRows.length,
      pending:    pledgeRows.filter((d) => d.status === 'Pending').length,
      dispatched: pledgeRows.filter((d) => d.status === 'Dispatched').length,
      delivered:  pledgeRows.filter((d) => d.status === 'Delivered').length,
      totalUnits: pledgeRows.reduce((sum, d) => sum + (d.total_units ?? 0), 0),
    },

    feedback: {
      count: ratings.length,
      averageRating: ratings.length > 0
        ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
        : null,
    },

    generatedAt: new Date().toISOString(),
  })
})

module.exports = router
