# CampusNotice — Centralized College Announcements Portal (Backend API)

Welcome to the backend service for **CampusNotice**, a centralized college announcements management system designed for the Skill Lab project.

This backend provides a clean RESTful API built with **Node.js**, **Express.js**, and **MongoDB** (via Mongoose), allowing students to search, filter, and view college notices while restricting administrative write actions (create, edit, delete, pin) using signed **JWT** authentication.

---

## 📋 Table of Contents
1. [Tech Stack](#-tech-stack)
2. [Project Architecture](#-project-architecture)
3. [Prerequisites & System Setup](#-prerequisites--system-setup)
4. [Installation & Quickstart](#-installation--quickstart)
5. [Environment Configuration (.env)](#-environment-configuration-env)
6. [Database Seeding](#-database-seeding)
7. [REST API Documentation & Contract](#-rest-api-documentation--contract)
8. [Frontend Integration Guide (Vanilla JavaScript)](#-frontend-integration-guide-vanilla-javascript)
9. [Postman & Automated Testing](#-postman--automated-testing)
10. [Demo Authentication & Security Notes](#-demo-authentication--security-notes)

---

## 🛠 Tech Stack

- **Runtime:** Node.js (v18+ recommended, ES Modules enabled via `"type": "module"`)
- **Server Framework:** Express.js 4.x
- **Database:** MongoDB (Local service or MongoDB Atlas cloud cluster)
- **Object Data Modeling (ODM):** Mongoose 8.x
- **Input Validation:** Express-Validator
- **Security & Headers:** Helmet & CORS
- **Authentication & Security:** JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Development Tooling:** Nodemon for hot reloading

---

## 📁 Project Architecture

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js                     # MongoDB connection setup via Mongoose
│   │   └── seed.js                   # Database seeder with sample college notices
│   ├── controllers/
│   │   ├── announcementController.js # CRUD & search/filter/sort/pagination logic
│   │   └── authController.js         # Admin login & JWT token issuance
│   ├── middleware/
│   │   ├── adminAuth.js              # Bearer token verification middleware
│   │   ├── errorHandler.js           # Centralized JSON error handler
│   │   └── notFound.js               # 404 handler for invalid routes
│   ├── models/
│   │   └── Announcement.js           # Mongoose Announcement model & indexes
│   ├── routes/
│   │   ├── announcementRoutes.js     # /api/announcements route bindings
│   │   └── authRoutes.js             # /api/auth route bindings
│   ├── validators/
│   │   └── announcementValidator.js  # express-validator rules for input sanitization
│   ├── app.js                        # Express app configuration & middleware
│   └── server.js                     # Server entrypoint with env validation
├── tests/
│   ├── CampusNotice.postman_collection.json # Ready-to-import Postman test collection
│   ├── runApiTests.js                # Automated 14-scenario API test runner
│   └── generateHash.js               # Utility script to hash new passwords
├── .env.example                      # Template for environment variables
├── .gitignore                        # Git exclusion rules
├── package.json                      # Scripts & dependencies
└── README.md                         # Project documentation
```

---

## 🚀 Prerequisites & System Setup

Ensure you have installed:
1. **Node.js** (v18.0.0 or higher) — check with `node -v`
2. **npm** (v9.0.0 or higher) — check with `npm -v`
3. **MongoDB**:
   - **Option A (Local MongoDB):** Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) and ensure the MongoDB service is running on `mongodb://127.0.0.1:27017`.
   - **Option B (MongoDB Atlas):** Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), create a database user, and obtain your connection string (e.g. `mongodb+srv://<user>:<password>@cluster.mongodb.net/campusnotice?retryWrites=true&w=majority`).

---

## 📦 Installation & Quickstart

### Step 1: Navigate to the backend directory
```bash
cd backend
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env

# On Linux/macOS:
cp .env.example .env
```
Open `.env` and verify the settings. A working default admin account (`admin` / `Admin@123`) is pre-configured for local testing.

### Step 4: Seed Sample Announcements
Populate the database with 8 categorized announcements:
```bash
npm run seed
```

### Step 5: Start the Server

- **Development Mode (with auto-restart on changes):**
  ```bash
  npm run dev
  ```
- **Production Mode:**
  ```bash
  npm start
  ```

The server will start at `http://localhost:5000`. You can test it by opening `http://localhost:5000/api/health` in your browser.

---

## ⚙️ Environment Configuration (.env)

| Variable | Description | Default Example |
| :--- | :--- | :--- |
| `PORT` | Port number the Express API server listens on | `5000` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/campusnotice` |
| `JWT_SECRET` | Secret key used to sign and verify admin JWTs | `campusnotice_skill_lab_jwt_secret_key_2026_super_secure` |
| `ADMIN_USERNAME`| Username required for administrator login | `admin` |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash of the admin password | Precomputed hash for `Admin@123` |
| `CLIENT_ORIGIN` | Allowed origin for frontend requests (CORS) | `http://localhost:5500` |

> 💡 **Tip:** To create a new bcrypt password hash for a custom admin password:
> ```bash
> node tests/generateHash.js myNewPassword
> ```
> Then paste the resulting hash into `ADMIN_PASSWORD_HASH` in `.env`.

---

## 📚 REST API Documentation & Contract

Base URL: **`http://localhost:5000/api`**

### Summary of Endpoints

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` or `/api/health` | Public | System status and health check |
| `GET` | `/api/announcements` | Public | List announcements with search, filter, sort, pagination |
| `GET` | `/api/announcements/:id` | Public | Get single announcement by clean numeric ID (e.g. 1, 2, 3) |
| `POST` | `/api/auth/login` | Public | Admin login (`admin` / `Admin@123`); returns signed JWT token |
| `POST` | `/api/announcements` | **Admin** | Create a new announcement |
| `PUT` | `/api/announcements/:id` | **Admin** | Update an existing announcement |
| `DELETE` | `/api/announcements/:id`| **Admin** | Delete an announcement |

---

### Detailed Endpoint Specifications

#### 1. Health Check
- **Endpoint:** `GET /api/health`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "CampusNotice Backend API is healthy and operational",
  "timestamp": "2026-10-28T06:05:00.000Z",
  "environment": "development"
}
```

---

#### 2. Get All Announcements (Public)
- **Endpoint:** `GET /api/announcements`
- **Query Parameters (All optional):**
  - `search` (string) — Search title or description (e.g. `?search=exam`)
  - `category` (string) — `Academics`, `Examinations`, `Events`, `General`
  - `sort` (string) — `newest` (default) or `oldest` (pinned notices always appear on top)
  - `page` (number) — Current page (default: `1`)
  - `limit` (number) — Number of items per page (default: `10`, max: `50`)
- **Example Request:**
  `GET /api/announcements?category=Examinations&sort=newest&page=1&limit=5`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Announcements retrieved successfully",
  "data": [
    {
      "_id": 1,
      "id": 1,
      "title": "Semester End Examination Schedule — Winter 2026",
      "description": "The timetable for Winter 2026 examinations has been released...",
      "category": "Examinations",
      "pinned": true,
      "publishedAt": "2026-10-28T04:00:00.000Z",
      "deadline": "2026-11-15T18:00:00.000Z",
      "sourceUrl": "https://college.edu/exams/winter2026",
      "attachmentUrl": "https://college.edu/documents/winter_2026_exam_schedule.pdf",
      "createdAt": "2026-10-28T04:00:00.000Z",
      "updatedAt": "2026-10-28T04:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "totalPages": 1
  }
}
```

---

#### 3. Get Single Announcement by ID (Public)
- **Endpoint:** `GET /api/announcements/:id`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Announcement retrieved successfully",
  "data": {
    "_id": 1,
    "id": 1,
    "title": "Semester End Examination Schedule — Winter 2026",
    "description": "The timetable for Winter 2026 examinations has been released...",
    "category": "Examinations",
    "pinned": true,
    "publishedAt": "2026-10-28T04:00:00.000Z",
    "deadline": "2026-11-15T18:00:00.000Z",
    "sourceUrl": "https://college.edu/exams/winter2026",
    "attachmentUrl": "https://college.edu/documents/winter_2026_exam_schedule.pdf"
  }
}
```
- **Response if not found (404 Not Found):**
```json
{
  "success": false,
  "message": "Announcement not found with ID: 99999"
}
```

---

#### 4. Admin Login (Public)
- **Endpoint:** `POST /api/auth/login`
- **Request Body (JSON):**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Admin authenticated successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": "24h",
    "user": {
      "username": "admin",
      "role": "admin"
    }
  }
}
```

---

#### 5. Create Announcement (Protected — Admin Only)
- **Endpoint:** `POST /api/announcements`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt_token>`
- **Request Body (JSON):**
```json
{
  "title": "Annual Sports Meet 2026 Registration",
  "description": "Registration for athletics, football, and cricket is open until Friday.",
  "category": "Events",
  "pinned": false,
  "deadline": "2026-11-10T17:00:00Z",
  "sourceUrl": "https://college.edu/sports",
  "attachmentUrl": "https://college.edu/forms/sports_registration.pdf"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "_id": "671f3b...",
    "title": "Annual Sports Meet 2026 Registration",
    "category": "Events",
    "pinned": false,
    "publishedAt": "2026-10-28T06:10:00.000Z",
    "deadline": "2026-11-10T17:00:00.000Z",
    "sourceUrl": "https://college.edu/sports",
    "attachmentUrl": "https://college.edu/forms/sports_registration.pdf",
    "createdAt": "2026-10-28T06:10:00.000Z",
    "updatedAt": "2026-10-28T06:10:00.000Z"
  }
}
```

---

#### 6. Update Announcement (Protected — Admin Only)
- **Endpoint:** `PUT /api/announcements/:id`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt_token>`
- **Request Body (JSON):**
```json
{
  "title": "[RESCHEDULED] Annual Sports Meet 2026 Registration",
  "pinned": true
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Announcement updated successfully",
  "data": { ... }
}
```

---

#### 7. Delete Announcement (Protected — Admin Only)
- **Endpoint:** `DELETE /api/announcements/:id`
- **Headers:**
  - `Authorization: Bearer <jwt_token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Announcement deleted successfully",
  "data": {
    "id": "671f3b...",
    "title": "Annual Sports Meet 2026 Registration"
  }
}
```

---

## 💻 Frontend Integration Guide (Vanilla JavaScript)

The frontend developer can consume these endpoints directly using the native browser `fetch` API.

### 1. Fetching & Displaying Announcements (Students)
```javascript
const API_BASE_URL = 'http://localhost:5000/api';

// Fetch announcements with optional search, category, sort, and pagination
async function loadAnnouncements({ search = '', category = '', sort = 'newest', page = 1, limit = 10 } = {}) {
  try {
    const params = new URLSearchParams({ page, limit, sort });
    if (search) params.append('search', search);
    if (category) params.append('category', category);

    const response = await fetch(`${API_BASE_URL}/announcements?${params.toString()}`);
    const result = await response.json();

    if (!result.success) {
      alert(`Error: ${result.message}`);
      return;
    }

    const announcements = result.data;
    const pagination = result.pagination;

    console.log(`Page ${pagination.page} of ${pagination.totalPages} (${pagination.total} total notices)`);
    renderAnnouncementsList(announcements);
  } catch (error) {
    console.error('Failed to load notices:', error);
  }
}

function renderAnnouncementsList(notices) {
  const container = document.getElementById('notices-container');
  container.innerHTML = notices.map(notice => `
    <article class="notice-card ${notice.pinned ? 'pinned' : ''}">
      ${notice.pinned ? '<span class="badge-pinned">📌 Pinned</span>' : ''}
      <span class="badge-category">${notice.category}</span>
      <h3>${notice.title}</h3>
      <p>${notice.description}</p>
      <small>Published: ${new Date(notice.publishedAt).toLocaleDateString()}</small>
      ${notice.deadline ? `<small>Deadline: ${new Date(notice.deadline).toLocaleDateString()}</small>` : ''}
      ${notice.attachmentUrl ? `<a href="${notice.attachmentUrl}" target="_blank">📄 Document Link</a>` : ''}
    </article>
  `).join('');
}
```

### 2. Admin Login & Saving Token
```javascript
async function handleAdminLogin(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    if (!result.success) {
      alert(result.message);
      return false;
    }

    // Save token in browser storage
    localStorage.setItem('adminToken', result.data.token);
    alert('Logged in successfully as Administrator!');
    return true;
  } catch (err) {
    console.error('Login request failed:', err);
    return false;
  }
}
```

### 3. Creating an Announcement (Admin Only)
```javascript
async function createNotice(noticeData) {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    alert('You must log in as admin first!');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(noticeData)
    });

    const result = await response.json();
    if (response.status === 201) {
      alert('Announcement created successfully!');
      loadAnnouncements(); // Refresh list
    } else {
      alert(`Validation error: ${result.message}`);
    }
  } catch (err) {
    console.error('Failed to post announcement:', err);
  }
}
```

---

## 🧪 Postman & Automated Testing

### Option 1: Automated Command-Line Test Suite
A built-in test runner tests all 14 project requirements automatically:
```bash
# Make sure the server is running, then in a separate terminal:
cd backend
npm run test:api
```
**Expected Output:**
```text
✅ PASS [Test 1] Health Check (Status: 200)
✅ PASS [Test 2] List Announcements (Count: 8)
✅ PASS [Test 3] Search Announcements (search=exam) (Matches: 2)
✅ PASS [Test 4] Filter Category (Examinations) (Matches: 2)
✅ PASS [Test 5] Sort and Paginate (limit=2, sort=oldest) (Returned: 2)
✅ PASS [Test 7] Admin Login (Token received: true)
✅ PASS [Test 8] Create Announcement (Protected) (Created ID: ...)
✅ PASS [Test 6] Retrieve Single Announcement
✅ PASS [Test 9] Update Announcement (Protected)
✅ PASS [Test 10] Delete Announcement (Protected)
✅ PASS [Test 11] Validation Failure Handling (Expected 400, got 400)
✅ PASS [Test 12] Nonexistent ID (404) (Status: 404)
✅ PASS [Test 13] Write Without Token (401) (Status: 401)
✅ PASS [Test 14] Write With Invalid Token (401) (Status: 401)

===============================================================
Test Suite Complete: 14/14 tests passed!
===============================================================
```

### Option 2: Postman Collection Import
1. Open the **Postman** application.
2. Click **Import** (top left).
3. Select `backend/tests/CampusNotice.postman_collection.json`.
4. Run requests in sequence from `01. Health Check` to `14. Attempt Write With Invalid Token`.
   - The `07. Admin Login` request automatically stores the issued JWT into the collection's `{{adminToken}}` variable!

---

## 🔒 Demo Authentication & Security Notes

- **Classroom Demo Architecture:** For this Skill Lab demonstration, single-admin credentials are stored and checked via environment variables with `bcryptjs` hashing and `jsonwebtoken` signing.
- **Production Enhancements:** Before any public production deployment, upgrade from environment-based admin credentials to:
  1. A dedicated `users` collection in MongoDB with roles and salted bcrypt passwords.
  2. Refresh tokens with HTTP-only secure cookies to protect against XSS token theft.
  3. Rate limiting (e.g. `express-rate-limit`) to protect against brute-force login attempts.
  4. SSL/TLS (HTTPS) encryption for all traffic.
