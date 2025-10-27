# 📘 Full Stack Software Application Development

## Module Details

- **Module**: CST3144 – Full Stack Development
- **Programme**: BSc Computer Science
- **Department**: School of Science and Technology
- **University**: Middlesex University London
- **Module Leader**: Dr. Luca Piras
- **Semester**: 1, Academic Year 2024–2025

## 🧩 Overview

This project implements a Full Stack Web Application for browsing and purchasing after-school classes and activities. It demonstrates modern web development practices using Vue.js, Express.js, and MongoDB Atlas.

## 🚀 Project Features

### 🎨 Front-End (Vue.js)

- Browse and sort lessons by subject, location, price, or spaces
- Add/remove lessons from shopping cart
- Checkout with name/phone validation
- Real-time search functionality with search-as-you-type
- Responsive design using Tailwind CSS

### ⚙️ Back-End (Express.js + Node.js)

- RESTful API endpoints for lessons and orders
- MongoDB Atlas integration using native driver
- Request logging middleware
- Static file serving for lesson images
- Search functionality with MongoDB queries

### 💾 Database Collections

- **Lessons**: Subject, location, price, spaces, image
- **Orders**: Customer details, lesson IDs, quantities

## 📂 Project Structure

```
my-vue-app/
├── src/
│   ├── components/
│   │   ├── Main.vue        (Main app logic + fetch calls)
│   │   ├── Hero.vue        (Lessons display + sorting + search)
│   │   ├── CartPage.vue    (Cart and checkout)
│   │   └── Product.vue     (Individual lesson card)
├── server/
│   ├── routes/
│   │   ├── courses.js      (Lesson/search routes)
│   │   └── orders.js       (Order handling)
│   ├── db.js              (MongoDB connection)
│   ├── server.js          (Express setup + middleware)
│   └── seed.js            (Database seeding)
```

## 🔗 Important Links

### 🖥️ Front-End

- **GitHub Repository**: [Your Vue.js Front-End Repository URL]
- **Live Demo**: [Your GitHub Pages URL]

### ⚙️ Back-End

- **GitHub Repository**: [Your Express.js Back-End Repository URL]
- **API Endpoint**: [Your Render.com API URL]

## 🧰 Technology Stack

- **Front-End**: Vue.js, Tailwind CSS
- **Back-End**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Deployment**: GitHub Pages (front-end), Render.com (back-end)
- **Version Control**: Git + GitHub
- **API Testing**: Postman

## 🛠️ Setup & Installation

### Backend Setup

```bash
# Install dependencies
npm install

# Start the server
node server/server.js

# Server runs on http://localhost:3000
```

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# App runs on http://localhost:5173
```

## 📡 API Routes

| Method | Route            | Description     |
| ------ | ---------------- | --------------- |
| GET    | /api/lessons     | Get all lessons |
| GET    | /api/search      | Search lessons  |
| POST   | /api/orders      | Create order    |
| PUT    | /api/lessons/:id | Update lesson   |

## 🧪 Testing

1. **API Testing (Postman)**:
   - GET http://localhost:3000/api/lessons
   - POST http://localhost:3000/api/orders
   - PUT http://localhost:3000/api/lessons/:id
   - GET http://localhost:3000/api/search?q=query

2. **Frontend Features**:
   - Lesson sorting
   - Cart operations
   - Checkout validation
   - Search-as-you-type

## 👤 Author

- **Name**: [Your Name]
- **Student ID**: [Your ID]
- **Email**: [Your Email]

## 📅 Important Dates

- **Submission**: 2nd December, 2PM
- **Demo Weeks**: Week 11-12
