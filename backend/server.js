const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const itemRoutes = require('./routes/items')
const donationRoutes = require('./routes/donations')
const feedbackRoutes = require('./routes/feedback')
const statsRoutes = require('./routes/stats')

const app = express()
// Railway injects its own PORT variable. Fallback to 8080 or 5000 if running locally.
const PORT = process.env.PORT || 8080 

// ─── Middleware ────────────────────────────────────────────────
// Updated CORS to allow your Netlify frontend to fetch data without being blocked
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}))
app.use(express.json())

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'HelpSriLanka API',
    timestamp: new Date().toISOString(),
  })
})

// ─── Route Mounts ─────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/items', itemRoutes)
app.use('/api/donations', donationRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/stats', statsRoutes)

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── Start ────────────────────────────────────────────────────
// CRITICAL FIX: Bound to '0.0.0.0' so Railway can route external internet traffic
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ HelpSriLanka API running on port ${PORT}`)
  console.log(`   Health: http://0.0.0.0:${PORT}/api/health`)
})

module.exports = app