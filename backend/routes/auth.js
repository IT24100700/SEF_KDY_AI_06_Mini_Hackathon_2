const express = require('express')
const router = express.Router()

/**
 * POST /api/auth/signup
 * Stub — integrate with Supabase Auth: supabase.auth.signUp({ email, password })
 */
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }
  // TODO: const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } })
  res.status(501).json({ message: 'Signup stub — not yet implemented', received: { email, name } })
})

/**
 * POST /api/auth/login
 * Stub — integrate with Supabase Auth: supabase.auth.signInWithPassword({ email, password })
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' })
  }
  // TODO: const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  res.status(501).json({ message: 'Login stub — not yet implemented', received: { email } })
})

module.exports = router
