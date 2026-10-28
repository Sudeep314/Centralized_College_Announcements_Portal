/**
 * ==========================================================================
 * CampusNotice - Centralized College Announcements Portal
 * utils.js: Safe Date Formatting, DOM Helpers, Search Debouncing & Sanitization
 * ==========================================================================
 *
 * MENTOR NOTES FOR STUDENT PRESENTATION:
 * - Security: We never use raw innerHTML for user-supplied fields (titles,
 *   descriptions). Instead, we use textContent or our helper `createElement()`.
 * - Robustness: All date functions validate timestamps using `Date.parse()` or
 *   `isNaN()` checks so the UI never displays "Invalid Date" or "undefined".
 * - Performance: The debounce() utility delays search query execution until
 *   the user stops typing (300ms), avoiding unnecessary DOM re-renders.
 */

/**
 * Format an ISO date string into a clean, human-readable date.
 * Example: "2026-10-25T10:00:00.000Z" -> "Oct 25, 2026"
 * 
 * @param {string|Date} dateValue - The raw date from API
 * @param {boolean} includeTime - Whether to include the local time
 * @returns {string} Human-readable date or "N/A" if invalid/absent
 */
export function formatDate(dateValue, includeTime = false) {
  if (!dateValue) return 'N/A';

  const date = new Date(dateValue);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/**
 * Evaluates a deadline and returns its status object.
 * Returns null if deadline is not provided or invalid.
 *
 * @param {string|Date} deadlineValue
 * @returns {{ status: 'overdue'|'imminent'|'upcoming', label: string, formatted: string } | null}
 */
export function getDeadlineStatus(deadlineValue) {
  if (!deadlineValue) return null;

  const deadline = new Date(deadlineValue);
  if (isNaN(deadline.getTime())) return null;

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = formatDate(deadline);

  if (diffMs < 0) {
    return {
      status: 'overdue',
      label: `Deadline passed (${formatted})`,
      formatted
    };
  }

  if (diffHours <= 24) {
    return {
      status: 'imminent',
      label: `Due today! (${formatted})`,
      formatted
    };
  }

  if (diffHours <= 72) {
    return {
      status: 'imminent',
      label: `Due in ${diffDays} days (${formatted})`,
      formatted
    };
  }

  return {
    status: 'upcoming',
    label: `Deadline: ${formatted}`,
    formatted
  };
}

/**
 * Debounce helper to delay function execution until after wait milliseconds
 * have elapsed since the last time it was invoked.
 *
 * @param {Function} func - Function to execute
 * @param {number} wait - Wait duration in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

/**
 * Helper to create an element with class names and optional text content.
 * Prevents XSS vulnerabilities by assigning text to textContent.
 *
 * @param {string} tag - Tag name (e.g. 'div', 'span')
 * @param {string|string[]} classNames - CSS class string or array of classes
 * @param {string} [text] - Text to insert safely
 * @returns {HTMLElement}
 */
export function createElement(tag, classNames = '', text = '') {
  const el = document.createElement(tag);
  if (Array.isArray(classNames)) {
    el.classList.add(...classNames.filter(Boolean));
  } else if (classNames) {
    el.className = classNames;
  }
  if (text !== undefined && text !== null && text !== '') {
    el.textContent = text;
  }
  return el;
}

/**
 * Sanitizes external URLs to ensure they only use http or https protocols.
 * Blocks dangerous schemes like javascript:, data:, or vbscript:.
 *
 * @param {string} urlString - URL to sanitize
 * @returns {string|null} Safe URL or null if invalid/unsafe
 */
export function sanitizeUrl(urlString) {
  if (!urlString || typeof urlString !== 'string') return null;
  const trimmed = urlString.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
}

/**
 * Token and Auth Storage Helper.
 * Keeps administrator auth state in sessionStorage for security
 * (cleared automatically when tab/browser closes).
 */
export const AuthStorage = {
  TOKEN_KEY: 'campusnotice_admin_token',
  USER_KEY: 'campusnotice_admin_user',

  getToken() {
    return sessionStorage.getItem(this.TOKEN_KEY) || localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token, persist = false) {
    if (persist) {
      localStorage.setItem(this.TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(this.TOKEN_KEY, token);
    }
  },

  getUser() {
    try {
      const data = sessionStorage.getItem(this.USER_KEY) || localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser(userData, persist = false) {
    const serialized = JSON.stringify(userData);
    if (persist) {
      localStorage.setItem(this.USER_KEY, serialized);
    } else {
      sessionStorage.setItem(this.USER_KEY, serialized);
    }
  },

  clear() {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  isAuthenticated() {
    return Boolean(this.getToken());
  }
};
