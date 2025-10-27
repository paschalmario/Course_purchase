import express from 'express'
import { connectDB } from '../db.js'

const router = express.Router()

// GET /api/courses
router.get('/courses', async (req, res) => {
  try {
    const db = await connectDB()
    const courses = await db.collection('courses').find({}).toArray()
    res.json(courses)
  } catch (err) {
    console.error('GET /api/courses error', err)
    res.status(500).json({ error: 'Failed to fetch courses' })
  }
})

// Dev-only: POST /api/courses/seed  --> expects an array in body to replace collection
router.post('/courses/seed', async (req, res) => {
  try {
    const db = await connectDB()
    const data = Array.isArray(req.body) ? req.body : []
    if (!data.length) return res.status(400).json({ error: 'No data provided' })
    await db.collection('courses').deleteMany({})
    await db.collection('courses').insertMany(data)
    const inserted = await db.collection('courses').find({}).toArray()
    res.json({ ok: true, count: inserted.length })
  } catch (err) {
    console.error('POST /api/courses/seed error', err)
    res.status(500).json({ error: 'Seed failed' })
  }
})

export default router
