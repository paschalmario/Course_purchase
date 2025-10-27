import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import coursesRouter from './routes/courses.js'
import { connectDB, getClient } from './db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// mount API routes
app.use('/api', coursesRouter)

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
