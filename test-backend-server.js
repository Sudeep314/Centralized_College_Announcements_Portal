/**
 * ==========================================================================
 * CampusNotice - Test Integration Server (Native Node.js, Zero Dependencies)
 * ==========================================================================
 * 
 * This server implements the exact API contract agreed upon with the backend developer:
 * - Base URL: http://localhost:5000/api
 * - Endpoints:
 *   - GET    /api/health
 *   - GET    /api/announcements (search, category, sort, page, limit)
 *   - GET    /api/announcements/:id
 *   - POST   /api/announcements (requires Bearer token)
 *   - PUT    /api/announcements/:id (requires Bearer token)
 *   - DELETE /api/announcements/:id (requires Bearer token)
 *   - POST   /api/auth/login (and /api/admin/login)
 * 
 * Usage:
 *   node test-backend-server.js
 * 
 * This allows the student to verify full end-to-end integration (including add, edit,
 * pin, delete, search, filter, and auth) before the backend peer's MongoDB is connected.
 */

const http = require('http');
const url = require('url');

const PORT = 5000;

// In-Memory Database initialized with sample announcements
let announcements = [
  {
    _id: "65f001",
    title: "End-Semester Examination Time Table - Fall 2026",
    category: "Examinations",
    description: "The official timetable for the upcoming end-semester theory and practical examinations has been released by the Examination Branch. Students must verify their course codes and report conflicts to the exam cell by Nov 15.",
    publishedAt: "2026-10-25T09:30:00.000Z",
    deadline: "2026-11-15T17:00:00.000Z",
    sourceUrl: "https://university.edu/examinations/timetable-fall-2026",
    attachmentUrl: "https://university.edu/docs/fall_2026_exam_schedule.pdf",
    pinned: true,
    createdAt: "2026-10-25T09:30:00.000Z",
    updatedAt: "2026-10-25T09:30:00.000Z"
  },
  {
    _id: "65f002",
    title: "Skill Lab Project Evaluation & Presentation Guidelines",
    category: "Academics",
    description: "All third-year engineering students must submit their Skill Lab project source code repository and presentation slides before the faculty review panel. Demonstrations will begin sharp at 10:00 AM in Lab 4.",
    publishedAt: "2026-10-26T11:00:00.000Z",
    deadline: "2026-10-30T10:00:00.000Z",
    sourceUrl: "https://university.edu/academics/skill-lab-guidelines",
    attachmentUrl: "https://university.edu/docs/skill_lab_rubrics.pdf",
    pinned: true,
    createdAt: "2026-10-26T11:00:00.000Z",
    updatedAt: "2026-10-26T11:00:00.000Z"
  },
  {
    _id: "65f003",
    title: "Annual Campus Hackathon & TechSymposium 2026",
    category: "Events",
    description: "Registrations are now open for the 36-hour inter-college hackathon. Tracks include Web3, AI/ML, Cloud Infrastructure, and Accessibility Solutions. Cash prizes and internship interview opportunities with partner firms.",
    publishedAt: "2026-10-27T14:15:00.000Z",
    deadline: "2026-11-20T23:59:00.000Z",
    sourceUrl: "https://techfest.college.edu/hackathon",
    attachmentUrl: "https://techfest.college.edu/brochure.pdf",
    pinned: false,
    createdAt: "2026-10-27T14:15:00.000Z",
    updatedAt: "2026-10-27T14:15:00.000Z"
  },
  {
    _id: "65f004",
    title: "Campus Wi-Fi Maintenance & Certificate Renewal",
    category: "General",
    description: "The Campus Network Operations Center will conduct scheduled server maintenance on Sunday from 02:00 AM to 06:00 AM. Access to campus portal and internal student Wi-Fi will be intermittently unavailable.",
    publishedAt: "2026-10-28T08:00:00.000Z",
    deadline: null,
    sourceUrl: "https://it.college.edu/status",
    attachmentUrl: null,
    pinned: false,
    createdAt: "2026-10-28T08:00:00.000Z",
    updatedAt: "2026-10-28T08:00:00.000Z"
  }
];

// Helper: send JSON with CORS headers
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

// Parse JSON request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  console.log(`[API] ${method} ${path}`);

  // 1. GET /api/health
  if (method === 'GET' && path === '/api/health') {
    return sendJson(res, 200, {
      status: 'ok',
      uptime: process.uptime(),
      message: 'CampusNotice Backend API is operational.'
    });
  }

  // 2. POST /api/auth/login or /api/admin/login
  if (method === 'POST' && (path === '/api/auth/login' || path === '/api/admin/login')) {
    try {
      const body = await parseBody(req);
      const { username, password } = body;

      // Acceptance: username 'admin' and password 'admin123' (or any non-empty username/password for demo)
      if (username === 'admin' && (password === 'Admin@123' || password === 'admin123')) {
        return sendJson(res, 200, {
          success: true,
          token: 'cn-test-jwt-token-' + Date.now(),
          user: { username: 'admin', role: 'administrator' }
        });
      } else {
        return sendJson(res, 401, {
          success: false,
          message: 'Invalid username or password. Default demo credentials: admin / Admin@123'
        });
      }
    } catch {
      return sendJson(res, 400, { success: false, message: 'Malformed JSON payload.' });
    }
  }

  // 3. GET /api/announcements
  if (method === 'GET' && path === '/api/announcements') {
    const { search, category, sort } = parsedUrl.query;
    let results = [...announcements];

    // Category filter
    if (category && category !== 'All') {
      results = results.filter(item => (item.category || '').toLowerCase() === category.toLowerCase());
    }

    // Search filter
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter(item => {
        return (item.title || '').toLowerCase().includes(q) ||
               (item.description || '').toLowerCase().includes(q);
      });
    }

    // Sort order
    if (sort === 'oldest') {
      results.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
    } else {
      // Default: newest
      results.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }

    return sendJson(res, 200, {
      success: true,
      count: results.length,
      data: results
    });
  }

  // 4. GET /api/announcements/:id
  const getByIdMatch = path.match(/^\/api\/announcements\/([a-zA-Z0-9_-]+)$/);
  if (method === 'GET' && getByIdMatch) {
    const id = getByIdMatch[1];
    const found = announcements.find(item => item._id === id || item.id === id);
    if (!found) {
      return sendJson(res, 404, { success: false, message: `Announcement with ID '${id}' not found.` });
    }
    return sendJson(res, 200, { success: true, data: found });
  }

  // 5. POST /api/announcements (Create)
  if (method === 'POST' && path === '/api/announcements') {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendJson(res, 401, { success: false, message: 'Unauthorized. Bearer token required.' });
    }

    try {
      const body = await parseBody(req);
      if (!body.title || !body.description) {
        return sendJson(res, 400, { success: false, message: 'Title and description are required.' });
      }

      const newNotice = {
        _id: 'notice_' + Date.now(),
        title: body.title,
        description: body.description,
        category: body.category || 'General',
        publishedAt: body.publishedAt || new Date().toISOString(),
        deadline: body.deadline || null,
        sourceUrl: body.sourceUrl || null,
        attachmentUrl: body.attachmentUrl || null,
        pinned: Boolean(body.pinned),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      announcements.unshift(newNotice);
      return sendJson(res, 201, { success: true, data: newNotice });
    } catch {
      return sendJson(res, 400, { success: false, message: 'Invalid JSON request body.' });
    }
  }

  // 6. PUT /api/announcements/:id (Update)
  if (method === 'PUT' && getByIdMatch) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendJson(res, 401, { success: false, message: 'Unauthorized. Bearer token required.' });
    }

    const id = getByIdMatch[1];
    const index = announcements.findIndex(item => item._id === id || item.id === id);
    if (index === -1) {
      return sendJson(res, 404, { success: false, message: `Announcement with ID '${id}' not found.` });
    }

    try {
      const updates = await parseBody(req);
      announcements[index] = {
        ...announcements[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return sendJson(res, 200, { success: true, data: announcements[index] });
    } catch {
      return sendJson(res, 400, { success: false, message: 'Invalid JSON update body.' });
    }
  }

  // 7. DELETE /api/announcements/:id (Delete)
  if (method === 'DELETE' && getByIdMatch) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendJson(res, 401, { success: false, message: 'Unauthorized. Bearer token required.' });
    }

    const id = getByIdMatch[1];
    const initialLen = announcements.length;
    announcements = announcements.filter(item => item._id !== id && item.id !== id);

    if (announcements.length === initialLen) {
      return sendJson(res, 404, { success: false, message: `Announcement with ID '${id}' not found.` });
    }

    return sendJson(res, 200, { success: true, message: 'Announcement deleted successfully.' });
  }

  // 404 Fallback for unknown routes
  sendJson(res, 404, {
    success: false,
    message: `Endpoint ${method} ${path} not found on CampusNotice API.`
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`CampusNotice Test API Server running on port ${PORT}`);
  console.log(`Base URL: http://localhost:${PORT}/api`);
  console.log(`Health:   http://localhost:${PORT}/api/health`);
  console.log(`Demo credentials: admin / Admin@123`);
  console.log(`====================================================`);
});
