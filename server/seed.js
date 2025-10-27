import fs from 'fs'
import path from 'path'
import { connectDB } from './db.js'
import dotenv from 'dotenv'
dotenv.config()

async function seed() {
  const file = path.resolve(process.cwd(), 'src', 'info.json')
  if (!fs.existsSync(file)) {
    console.error('Seed file not found:', file)
    process.exit(1)
  }

  const raw = fs.readFileSync(file, 'utf8')
  let data
  try {
    data = JSON.parse(raw)
  } catch (e) {
    console.error('Failed to parse info.json', e)
    process.exit(1)
  }

  const docs = Array.isArray(data.Courses) ? data.Courses : []
  if (!docs.length) {
    console.error('No courses found in info.json')
    process.exit(1)
  }

  try {
    const db = await connectDB()
    const col = db.collection('courses')
    await col.deleteMany({})
    await col.insertMany(docs)
    const count = await col.countDocuments()
    console.log('Seed complete, documents:', count)
    process.exit(0)
  } catch (err) {
    console.error('Seeding failed', err)
    process.exit(1)
  }
}

seed()
