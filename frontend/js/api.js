/**
 * ==========================================================================
 * CampusNotice - Centralized College Announcements Portal
 * api.js: Centralized REST API Service Module
 * ==========================================================================
 *
 * MENTOR NOTES FOR STUDENT PRESENTATION:
 * - Single Source of Truth: All backend communication passes through this module.
 *   If the backend port, host, or endpoint changes, we only edit API_BASE_URL here.
 * - HTTP Best Practices: Uses fetch() with proper headers (Content-Type: application/json).
 * - Authorization: Automatically attaches 'Authorization: Bearer <token>' for protected routes.
 * - Resilient Error Handling: Distinguishes between HTTP errors (404, 401, 500)
 *   and network failures (backend offline / CORS blocks).
 */

import { AuthStorage } from './utils.js';

/**
 * Backend API Base URL
 * Set to match the Node.js/Express backend server: http://localhost:5000/api
 */
export const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Generic HTTP client wrapper around native fetch().
 * 
 * @param {string} endpoint - The relative path (e.g. '/announcements')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<any>} Parsed JSON response
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Automatically attach Bearer token if user is logged in
  const token = AuthStorage.getToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkError) {
    // Thrown when server is unreachable, offline, or CORS preflight fails
    console.error(`[API Network Error] Unable to connect to ${url}:`, networkError);
    throw new Error(
      'Cannot connect to the CampusNotice server. Please verify the backend is running at http://localhost:5000 and CORS is enabled.'
    );
  }

  // Safe JSON extraction
  let responseData = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.warn('[API JSON Parse Error]', parseError);
    }
  } else {
    try {
      const text = await response.text();
      responseData = text ? { message: text } : null;
    } catch {
      // Empty response body
    }
  }

  // Handle Token Expiration or Invalid Authentication
  if (response.status === 401) {
    AuthStorage.clear();
    const errorMsg = (responseData && (responseData.message || responseData.error)) || 'Session expired. Please log in again.';
    const error = new Error(errorMsg);
    error.status = 401;
    throw error;
  }

  // Handle non-2xx HTTP responses
  if (!response.ok) {
    const errorMsg =
      (responseData && (responseData.message || responseData.error || responseData.msg)) ||
      `Request failed with status ${response.status} (${response.statusText})`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = responseData;
    throw error;
  }

  return responseData;
}

/**
 * CampusNotice API Service
 */
export const api = {
  /**
   * Check backend health
   * GET /health
   */
  async checkHealth() {
    return request('/health', { method: 'GET' });
  },

  /**
   * Fetch announcements with optional search, filter, sort and pagination query params
   * GET /announcements?search=...&category=...&sort=...&page=...&limit=...
   *
   * @param {object} params
   * @returns {Promise<{ data: Array, pagination?: object, raw: any }>}
   */
  async getAnnouncements(params = {}) {
    const query = new URLSearchParams();

    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params.category && params.category !== 'All') {
      query.append('category', params.category);
    }
    if (params.sort) {
      query.append('sort', params.sort);
    }
    if (params.page) {
      query.append('page', params.page);
    }
    if (params.limit) {
      query.append('limit', params.limit);
    }

    const queryString = query.toString();
    const endpoint = `/announcements${queryString ? `?${queryString}` : ''}`;
    const result = await request(endpoint, { method: 'GET' });

    // Normalize response: Express/Mongo backends may return:
    // 1) { success: true, data: [...], pagination: {...} }
    // 2) { announcements: [...], total: 10 }
    // 3) Raw array: [...]
    let data = [];
    let pagination = null;

    if (Array.isArray(result)) {
      data = result;
    } else if (result && Array.isArray(result.data)) {
      data = result.data;
      pagination = result.pagination || null;
    } else if (result && Array.isArray(result.announcements)) {
      data = result.announcements;
      pagination = result.pagination || { total: result.total };
    }

    return {
      data,
      pagination,
      raw: result,
    };
  },

  /**
   * Get single announcement by ID
   * GET /announcements/:id
   *
   * @param {string} id
   */
  async getAnnouncementById(id) {
    if (!id) throw new Error('Announcement ID is required');
    const result = await request(`/announcements/${id}`, { method: 'GET' });
    // Normalize if wrapped in { success: true, data: { ... } }
    return (result && result.data) ? result.data : result;
  },

  /**
   * Create announcement (Admin protected)
   * POST /announcements
   *
   * @param {object} announcementData
   */
  async createAnnouncement(announcementData) {
    return request('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementData),
    });
  },

  /**
   * Update announcement (Admin protected)
   * PUT /announcements/:id
   *
   * @param {string} id
   * @param {object} updateData
   */
  async updateAnnouncement(id, updateData) {
    if (!id) throw new Error('Announcement ID is required');
    return request(`/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  /**
   * Delete announcement (Admin protected)
   * DELETE /announcements/:id
   *
   * @param {string} id
   */
  async deleteAnnouncement(id) {
    if (!id) throw new Error('Announcement ID is required');
    return request(`/announcements/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Admin Login
   * Tries POST /auth/login and falls back to POST /admin/login
   *
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ token: string, user?: object }>}
   */
  async login(username, password) {
    const payload = { username, password };
    
    try {
      // First attempt: standard /auth/login
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return this._extractAuthData(res);
    } catch (err) {
      // If 404 (route not found on backend), try fallback /admin/login
      if (err.status === 404) {
        const res = await request('/admin/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        return this._extractAuthData(res);
      }
      throw err;
    }
  },

  /**
   * Normalizes token and user object from backend login response
   */
  _extractAuthData(response) {
    if (!response) {
      throw new Error('Empty response from login server');
    }

    const token =
      response.token ||
      (response.data && response.data.token) ||
      (response.auth && response.auth.token);

    if (!token) {
      throw new Error('Authentication succeeded but no authorization token was returned by the server.');
    }

    const user =
      response.user ||
      (response.data && response.data.user) ||
      { username: 'Admin' };

    return { token, user };
  }
};
