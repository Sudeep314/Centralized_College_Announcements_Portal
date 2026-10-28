# CampusNotice — Centralized College Announcements Portal

**CampusNotice** is a full-stack college announcement aggregation and management portal built for the **Skill Lab Project evaluation**. It centralizes scattered notices from academic departments, examination cells, event organizers, and administrative offices into a single, searchable portal.

- **Frontend Client (`frontend/`):** Built with semantic HTML5, custom responsive CSS3, and modern modular Vanilla JavaScript (ES Modules).
- **Backend API (`backend/`):** Built with Node.js, Express.js, MongoDB (via Mongoose), express-validator, and JWT admin authentication.

---

## 📋 Full-Stack Architecture

```text
CCA/
├── frontend/                     # Frontend Application (Vanilla JS / HTML / CSS)
│   ├── index.html                # Student Announcements Dashboard
│   ├── pages/
│   │   ├── announcement.html     # Dedicated Announcement Detail View
│   │   ├── admin-login.html      # Administrator Login Form (admin / Admin@123)
│   │   └── admin.html            # Admin Announcements Management Table
│   ├── css/                      # Responsive design & components
│   └── js/                       # Modular ES Modules (api.js, filters.js, announcements.js)
├── backend/                      # REST API Server (Node.js / Express / MongoDB)
│   ├── src/
│   │   ├── config/ (db.js, seed.js)
│   │   ├── controllers/ (announcementController.js, authController.js)
│   │   ├── middleware/ (adminAuth.js, errorHandler.js, notFound.js)
│   │   ├── models/ (Announcement.js, Counter.js)
│   │   ├── routes/ (announcementRoutes.js, authRoutes.js)
│   │   ├── validators/ (announcementValidator.js)
│   │   ├── app.js & server.js
│   ├── tests/
│   │   ├── CampusNotice.postman_collection.json # 14 Postman requests
│   │   ├── runApiTests.js                      # Automated CLI test suite
│   │   └── generateHash.js                     # Password hash utility
│   ├── .env.example
│   └── package.json
├── start.bat                     # One-click launcher for Windows
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Set Up and Run the Backend API Server
```powershell
# Open terminal and enter backend directory
cd backend

# Install dependencies
npm install

# (Optional) Seed the database with clean IDs 1..8
npm run seed

# Start development API server (runs at http://localhost:5000)
npm run dev

# Run automated 14-point API verification
npm run test:api
```

### 2. Run the Frontend Client
In a separate terminal:
```powershell
# Option A: Using the included node static server
node serve.js

# Option B: Or right-click frontend/index.html in VS Code -> "Open with Live Server"
```
Then visit:
- **Student Dashboard:** [http://localhost:3000](http://localhost:3000) or [http://localhost:5500/frontend/index.html](http://localhost:5500/frontend/index.html)
- **Admin Login:** [http://localhost:3000/pages/admin-login.html](http://localhost:3000/pages/admin-login.html)
- **Admin Dashboard:** [http://localhost:3000/pages/admin.html](http://localhost:3000/pages/admin.html)

---

## 🔐 Demo Administrator Credentials
- **Username:** `admin`
- **Password:** `Admin@123`

---

## 📚 REST API Overview

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | System status and connectivity check |
| `GET` | `/announcements` | Public | List notices (`search`, `category`, `sort`, `page`, `limit`) |
| `GET` | `/announcements/:id` | Public | Retrieve single announcement by clean numeric ID (e.g. `1`, `2`) |
| `POST` | `/auth/login` | Public | Admin login (`admin` / `Admin@123`) returning JWT token |
| `POST` | `/announcements` | `Bearer <token>` | Create new announcement with auto-increment ID |
| `PUT` | `/announcements/:id` | `Bearer <token>` | Update existing announcement or toggle `pinned` |
| `DELETE` | `/announcements/:id` | `Bearer <token>` | Permanently remove announcement |

For detailed API docs, view [Backend README](file:///c:/Users/Vicky/OneDrive/Desktop/CCA/backend/README.md).
