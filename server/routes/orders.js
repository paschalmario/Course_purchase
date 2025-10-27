import express from 'express'
import { connectDB } from '../db.js'

const router = express.Router()

// GET /api/orders - list orders (for testing)
router.get('/orders', async (req, res) => {
  try {
    const db = await connectDB()
    const orders = await db.collection('orders').find({}).toArray()
    res.json(orders)
  } catch (err) {
    console.error('GET /api/orders error', err)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// POST /api/orders
// body: { name: string, phone: string, items: [{ id: number, quantity: number }] }
router.post('/orders', async (req, res) => {
  try {
    const { name, phone, items } = req.body || {}

    if (!name || !/^[A-Za-z\s]{2,}$/.test(name.trim())) {
      return res.status(400).json({ error: 'Invalid name' })
    }
    if (!phone || !/^\d{7,15}$/.test(String(phone).trim())) {
      return res.status(400).json({ error: 'Invalid phone' })
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'No items provided' })
    }

    const db = await connectDB()
    const coursesCol = db.collection('courses')
    const reserved = [] // track successful reservations for rollback

    // try to reserve each item (decrement spaces)
    for (const it of items) {
      const id = Number(it.id)
      const qty = Number(it.quantity) || 0
      if (!id || qty <= 0) {
        // invalid item
        // rollback previous
        for (const r of reserved) {
          await coursesCol.updateOne({ id: r.id }, { $inc: { spaces: r.qty } })
        }
        return res.status(400).json({ error: 'Invalid item data' })
      }

      // atomic decrement if enough spaces
      const result = await coursesCol.findOneAndUpdate(
        { id: id, spaces: { $gte: qty } },
        { $inc: { spaces: -qty } },
        { returnDocument: 'after' },
      )

      if (!result.value) {
        // not enough spaces -> rollback previous
        for (const r of reserved) {
          await coursesCol.updateOne({ id: r.id }, { $inc: { spaces: r.qty } })
        }
        return res.status(400).json({ error: `Not enough spaces for lesson id ${id}` })
      }

      reserved.push({ id, qty })
    }

    // all reserved -> insert order
    const ordersCol = db.collection('orders')
    const orderDoc = {
      name: String(name).trim(),
      phone: String(phone).trim(),
      items: items.map((it) => ({ id: Number(it.id), quantity: Number(it.quantity) })),
      createdAt: new Date(),
    }
    const insert = await ordersCol.insertOne(orderDoc)

    return res.json({ ok: true, orderId: insert.insertedId })
  } catch (err) {
    console.error('POST /api/orders error', err)
    res.status(500).json({ error: 'Order creation failed' })
  }
})

export default router
