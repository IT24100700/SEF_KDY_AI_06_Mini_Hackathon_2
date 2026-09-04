const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const itemRoutes = require('./routes/items')

const app = express()
const PORT = process.env.PORT || 5000

// ─── Middleware ────────────────────────────────────────────────
app.use(cors())
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

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ HelpSriLanka API running on http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/api/health`)
})

module.exports = app
