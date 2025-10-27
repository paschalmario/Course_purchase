import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
dotenv.config()

const uri = process.env.MONGODB_URI
if (!uri) {
  throw new Error('MONGODB_URI not set in environment (.env)')
}

const client = new MongoClient(uri)
let dbInstance = null

export async function connectDB(dbName = 'course_app') {
  if (!dbInstance) {
    await client.connect()
    dbInstance = client.db(dbName)
    console.log('Connected to MongoDB:', dbName)
  }
  return dbInstance
}

export function getClient() {
  return client
}
