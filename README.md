# CampusNotice — Centralized College Announcements Portal

**CampusNotice** is a clean, accessible, and responsive web portal built to aggregate and centralize college announcements across academic departments, examination cells, event organizers, and administrative offices.

This project was built for the **Skill Lab Project evaluation** using standard, compliant **HTML5, CSS3, and modern Vanilla JavaScript (ES Modules)** on the frontend, integrating seamlessly with a **Node.js, Express, and MongoDB** backend REST API.

---

## 1. Project Overview & Features

### A. Student Portal (`index.html`)
- **Centralized Announcements Feed**: Browse verified notices categorized into **Academics**, **Examinations**, **Events**, and **General**.
- **Keyword Search**: Instant search with a 300ms debounce to prevent layout thrashing and unnecessary calls.
- **Category Filtering**: Filter notices with a single click across semantic category tabs.
- **Date & Deadline Sorting**: Sort announcements by newest publication date, oldest publication date, or nearest upcoming deadline.
- **Pinned Announcements Section**: Important administrative notices are pinned to the top of the feed with distinct visual emphasis.
- **Deadline Indicators**: Intelligent status pills calculating if a deadline is **Due Today**, **Upcoming**, or **Overdue** (only shown if a valid deadline exists).
- **Accessible Detail Modal & Full Page View**: Click "View Details" to view complete notices, formatted dates, and validated source/attachment links, or open a shareable standalone page (`pages/announcement.html?id=...`).
- **Comprehensive UI States**: Clear **Loading spinner**, **Error message with Retry button**, and **Empty state with filter reset**.

### B. Administrator Dashboard (`pages/admin-login.html` & `pages/admin.html`)
- **Secure Authentication**: Administrators log in via `/api/auth/login`. Received JWT tokens are stored in `sessionStorage` (or `localStorage` if "Remember session" is checked).
- **Protected Management Table**: Lists all notices with status badges, publication dates, and action controls.
- **Add Announcement**: Create new notices with full validation (title, category, description, publication date, optional deadline, and official links).
- **Edit Notice**: Pre-populates existing data in an accessible modal dialog and updates the database via `PUT /api/announcements/:id`.
- **One-Click Pin / Unpin**: Instantly highlights critical notices on the student feed.
- **Safe Deletion with Confirmation**: Accessible modal dialog prevents accidental deletions before dispatching `DELETE /api/announcements/:id`.
- **Database Source of Truth**: The interface never fakes operations locally; all UI updates synchronize directly with backend responses.

---

## 2. Technology Stack & Design Decisions

| Layer | Technology | Justification for Skill Lab Presentation |
| :--- | :--- | :--- |
| **Markup** | HTML5 Semantic Elements | Uses `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<dialog>` for search engine indexing and screen reader accessibility. |
| **Styling** | Vanilla CSS3 (Grid & Flexbox) | Zero framework dependencies (no Bootstrap or Tailwind). Uses CSS custom properties (`--color-primary`, etc.) for an academic design system. |
| **Scripting** | Vanilla JavaScript (ES Modules) | Clean code separation using `import` / `export`. Avoids build tools (Webpack/Vite) while maintaining modular code. |
| **HTTP Client** | Native `fetch()` API | Configurable API base URL, robust error handling, JSON serialization, and Bearer token injection. |
| **Security** | Safe DOM Manipulation | Uses `document.createElement()` and `textContent` rather than `innerHTML` to prevent Cross-Site Scripting (XSS). |

---

## 3. Directory Structure

```text
CCA/
├── frontend/                     # Frontend Application
│   ├── index.html                # Student Announcements Dashboard
│   ├── pages/
│   │   ├── announcement.html     # Dedicated Announcement Detail View
│   │   ├── admin-login.html      # Administrator Login Form
│   │   └── admin.html            # Admin Announcements Management Table
│   ├── css/
│   │   ├── styles.css            # Design System, CSS Variables, Typography & Components
│   │   └── responsive.css        # Responsive Breakpoints (320px mobile to 1024px+ desktop)
│   ├── js/
│   │   ├── api.js                # Centralized REST API client & error handling
│   │   ├── utils.js              # Date formatting, deadline logic, debouncing, DOM helpers
│   │   ├── filters.js            # Search, category filter & sort state management
│   │   ├── announcements.js      # Student dashboard rendering & detail modal
│   │   ├── announcement-detail.js# Controller for standalone detail page
│   │   ├── admin-login.js        # Authentication form handling & token storage
│   │   └── admin.js              # Admin CRUD operations, pin toggles & table rendering
│   └── assets/
│       └── campus-logo.svg       # Brand icon
├── serve.js                      # Zero-dependency local frontend web server
├── test-backend-server.js        # Built-in contract-compliant mock backend for testing
├── .gitignore                    # Git ignore file
└── README.md                     # Project documentation & presentation guide
```

---

## 4. Backend API Contract

The frontend is configured to communicate with the Node.js/Express backend at:
`http://localhost:5000/api`

### Endpoints Implemented

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status and connectivity check |
| `GET` | `/api/announcements` | Public | List notices. Supports `search`, `category`, `sort`, `page`, `limit` |
| `GET` | `/api/announcements/:id` | Public | Retrieve single announcement details |
| `POST` | `/api/auth/login` | Public | Administrator login returning JWT `{ token, user }` |
| `POST` | `/api/announcements` | `Bearer <token>` | Create new announcement |
| `PUT` | `/api/announcements/:id` | `Bearer <token>` | Update existing announcement or toggle `pinned` |
| `DELETE` | `/api/announcements/:id` | `Bearer <token>` | Permanently remove announcement |

### Announcement Data Schema

```json
{
  "_id": "65f001",
  "title": "End-Semester Examination Time Table - Fall 2026",
  "category": "Examinations",
  "description": "The official timetable for upcoming examinations...",
  "publishedAt": "2026-10-25T09:30:00.000Z",
  "deadline": "2026-11-15T17:00:00.000Z",
  "sourceUrl": "https://university.edu/examinations",
  "attachmentUrl": "https://university.edu/docs/timetable.pdf",
  "pinned": true,
  "createdAt": "2026-10-25T09:30:00.000Z",
  "updatedAt": "2026-10-25T09:30:00.000Z"
}
```

---

## 5. How to Run and Verify Locally

### Option 1: Quick Start (Using Included Native Node Servers)

1. **Start the API Backend Server**:
   ```bash
   node test-backend-server.js
   ```
   *Runs at `http://localhost:5000`. Includes demo credentials: `username: admin`, `password: admin123`.*

2. **Start the Frontend Server** (in a separate terminal window):
   ```bash
   node serve.js
   ```
   *Serves the frontend at `http://localhost:3000`.*

3. Open your browser to:
   - **Student Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **Admin Login**: [http://localhost:3000/pages/admin-login.html](http://localhost:3000/pages/admin-login.html)
   - **Admin Management**: [http://localhost:3000/pages/admin.html](http://localhost:3000/pages/admin.html)

### Option 2: Using VS Code Live Server Extension

1. Open the project folder in VS Code.
2. Ensure your backend is running at `http://localhost:5000`.
3. Right-click `frontend/index.html` and select **"Open with Live Server"**.

---

## 6. Configuring the Backend URL & CORS

### Changing the Backend Port/Host
If your peer backend developer runs their Express server on a different port or host (e.g. `http://localhost:8000/api`), edit `frontend/js/api.js`:

```javascript
// frontend/js/api.js
export const API_BASE_URL = 'http://localhost:5000/api'; // Update if needed
```

### Backend CORS Configuration
Because the frontend (running on port `3000` or `5500`) and the backend (port `5000`) run on different origins, the Express backend must enable CORS. Provide this snippet to the backend developer:

```javascript
// In backend server.js (Express):
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 7. Faculty Viva & Evaluation Q&A Guide

When presenting this project to faculty, use these technical talking points:

1. **Why Vanilla JavaScript instead of React or Vue?**
   - *Answer:* Demonstrates mastery of core web fundamentals: DOM manipulation, event listeners, ES Modules, asynchronous programming (`async/await`, Promises), and browser security without hiding behind abstraction layers.
2. **How is Cross-Site Scripting (XSS) prevented?**
   - *Answer:* We strictly avoid `innerHTML` for dynamic content coming from the API. We create nodes with `document.createElement()` and bind text using `element.textContent`, which automatically encodes any special characters.
3. **How does search debouncing work?**
   - *Answer:* Our custom `debounce()` utility in `utils.js` uses a timer (`setTimeout`). If a user types multiple characters rapidly, previous timers are cancelled (`clearTimeout`), firing the filter callback only once 300ms after the user pauses typing.
4. **How are dates and deadlines safely handled?**
   - *Answer:* All date strings are validated using `Date.parse()` and `isNaN()`. If a notice lacks a deadline, the UI safely omits the deadline indicator rather than rendering `"undefined"` or `"Invalid Date"`.
5. **How does authentication state work?**
   - *Answer:* JWT tokens returned from the login endpoint are stored in `sessionStorage` and attached via `Authorization: Bearer <token>` on all mutation requests (`POST`, `PUT`, `DELETE`). If a 401 error is received, the session is cleared and the admin is redirected.
