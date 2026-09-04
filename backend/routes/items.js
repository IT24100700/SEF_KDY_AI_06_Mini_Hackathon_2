const express = require('express')
const router = express.Router()

/**
 * GET /api/items
 * Query params:
 *   ?type=request   → fetch aid requests
 *   ?type=donation  → fetch donations
 * Stub — integrate with Supabase: supabase.from('items').select('*').eq('type', type)
 */
router.get('/', async (req, res) => {
  const { type } = req.query
  const validTypes = ['request', 'donation']

  if (type && !validTypes.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` })
  }

  // TODO: const { data, error } = await supabase.from('items').select('*').eq('type', type ?? 'request')
  res.status(501).json({
    message: 'GET /api/items stub — not yet implemented',
    filter: { type: type ?? 'all' },
  })
})

/**
 * POST /api/items
 * Body: { type: 'request'|'donation', name, contact, location, category, description, ... }
 * Stub — integrate with Supabase: supabase.from('items').insert([body])
 */
router.post('/', async (req, res) => {
  const { type, name, contact, location, category, description } = req.body

  if (!type || !name || !location || !description) {
    return res.status(400).json({ error: 'type, name, location, and description are required' })
  }

  // TODO: const { data, error } = await supabase.from('items').insert([{ type, name, contact, location, category, description }])
  res.status(501).json({
    message: 'POST /api/items stub — not yet implemented',
    received: { type, name, contact, location, category },
  })
})

module.exports = router
