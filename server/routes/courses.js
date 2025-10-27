import express from 'express'
import { connectDB } from '../db.js'

const router = express.Router()

// helper to escape regex special chars
function escapeRegex(text = '') {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// GET /api/courses
router.get('/courses', async (req, res) => {
  try {
    console.log(
      '[API] GET /api/courses - incoming request from',
      req.ip || req.connection.remoteAddress,
    )
    const db = await connectDB()
    const courses = await db.collection('courses').find({}).toArray()
    console.log(
      `[API] GET /api/courses - found ${Array.isArray(courses) ? courses.length : 0} documents`,
    )
    res.json(courses)
  } catch (err) {
    console.error('GET /api/courses error', err)
    res.status(500).json({ error: 'Failed to fetch courses' })
  }
})

// NEW: GET /api/lessons  (alias for courses) — returns all lessons
router.get('/lessons', async (req, res) => {
  try {
    console.log('[API] GET /api/lessons - incoming request')
    const db = await connectDB()
    const lessons = await db.collection('courses').find({}).toArray()
    res.json(lessons)
  } catch (err) {
    console.error('GET /api/lessons error', err)
    res.status(500).json({ error: 'Failed to fetch lessons' })
  }
})

// GET /api/search?q=...
// Returns courses where subject or location contains q (case-insensitive).
// If q is numeric, also match price or spaces equal to that number.
router.get('/search', async (req, res) => {
  try {
    const qRaw = (req.query.q || '').toString().trim()
    console.log(`[API] GET /api/search - q="${qRaw}" from`, req.ip || req.connection.remoteAddress)

    if (!qRaw) {
      // empty query -> return empty array (frontend triggers search-as-you-type only on input)
      return res.json([])
    }

    const db = await connectDB()
    const q = qRaw
    const regex = new RegExp(escapeRegex(q), 'i')
    const num = Number(q)
    const orClauses = [{ subject: { $regex: regex } }, { location: { $regex: regex } }]
    if (!Number.isNaN(num)) {
      orClauses.push({ price: num }, { spaces: num })
    }
    const query = { $or: orClauses }

    const results = await db.collection('courses').find(query).toArray()
    console.log(`[API] GET /api/search - found ${results.length} results for q="${q}"`)
    res.json(results)
  } catch (err) {
    console.error('GET /api/search error', err)
    res.status(500).json({ error: 'Search failed' })
  }
})

// NEW: PUT /api/lessons/:id  — update any attribute(s) of a lesson (body applied with $set)
router.put('/lessons/:id', async (req, res) => {
  try {
    const idRaw = req.params.id
    const id = Number(idRaw)
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid lesson id' })
    const updates = req.body && typeof req.body === 'object' ? req.body : {}
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No updates provided' })

    const db = await connectDB()
    // allow arbitrary fields update via $set (caller must validate fields as needed)
    const result = await db
      .collection('courses')
      .findOneAndUpdate({ id: id }, { $set: updates }, { returnDocument: 'after' })

    if (!result.value) return res.status(404).json({ error: 'Lesson not found' })
    res.json({ ok: true, lesson: result.value })
  } catch (err) {
    console.error('PUT /api/lessons/:id error', err)
    res.status(500).json({ error: 'Failed to update lesson' })
  }
})

// Dev-only: POST /api/courses/seed  --> expects an array in body to replace collection
router.post('/courses/seed', async (req, res) => {
  try {
    console.log('[API] POST /api/courses/seed - seeding request received')
    const db = await connectDB()
    const data = Array.isArray(req.body) ? req.body : []
    if (!data.length) return res.status(400).json({ error: 'No data provided' })
    await db.collection('courses').deleteMany({})
    await db.collection('courses').insertMany(data)
    const inserted = await db.collection('courses').find({}).toArray()
    console.log(`[API] POST /api/courses/seed - inserted ${inserted.length} documents`)
    res.json({ ok: true, count: inserted.length })
  } catch (err) {
    console.error('POST /api/courses/seed error', err)
    res.status(500).json({ error: 'Seed failed' })
  }
})

export default router
