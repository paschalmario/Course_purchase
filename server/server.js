import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'
import coursesRouter from './routes/courses.js'
import ordersRouter from './routes/orders.js'
import { connectDB, getClient } from './db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// lightweight logger middleware (logs all requests)
app.use((req, res, next) => {
  const now = new Date().toISOString()
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  console.log(`[${now}] ${req.method} ${req.originalUrl} from ${ip}`)
  next()
})

app.use(cors())
app.use(express.json())

// serve images from server/public/images via a route that returns 404 JSON if missing
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const imagesDir = path.resolve(__dirname, 'public', 'images')
app.get('/images/:filename', (req, res) => {
  const filename = req.params.filename
  const filePath = path.join(imagesDir, filename)
  res.setHeader('Cache-Control', 'public, max-age=300')
  try {
    if (filePath.indexOf(imagesDir) !== 0) {
      return res.status(400).json({ error: 'Invalid filename' })
    }
    // use sendFile; will throw if not found
    return res.sendFile(filePath)
  } catch (err) {
    return res.status(404).json({ error: 'Image not found' })
  }
})

// mount API routes
app.use('/api', coursesRouter)
app.use('/api', ordersRouter)

// health check
app.get('/health', (req, res) => res.json({ ok: true }))

// start: ensure DB connection first
async function start() {
  try {
    await connectDB() // ensure connection; will throw if MONGODB_URI missing/invalid
    app.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server', err)
    process.exit(1)
  }
}

start()

// graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...')
  try {
    await getClient().close()
  } catch (e) {}
  process.exit(0)
})
