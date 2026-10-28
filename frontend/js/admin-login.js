/**
 * ==========================================================================
 * CampusNotice - Centralized College Announcements Portal
 * admin-login.js: Administrator Authentication Controller
 * ==========================================================================
 *
 * MENTOR NOTES FOR STUDENT PRESENTATION:
 * - Security: No credentials or tokens are hardcoded. We submit the login payload
 *   to the backend REST API, receive a cryptographically signed JWT token,
 *   and store it in client storage (sessionStorage by default).
 * - Client Validation: Prevents unnecessary network trips if fields are empty.
 * - UX Feedback: Disables submit button during the request to prevent double submissions.
 */

import { api } from './api.js';
import { AuthStorage } from './utils.js';

const elements = {
  form: document.getElementById('admin-login-form'),
  usernameInput: document.getElementById('username'),
  passwordInput: document.getElementById('password'),
  rememberCheckbox: document.getElementById('remember-me'),
  submitBtn: document.getElementById('submit-btn'),
  loginAlert: document.getElementById('login-alert'),
  usernameError: document.getElementById('username-error'),
  passwordError: document.getElementById('password-error'),
};

function initAdminLogin() {
  // If already authenticated, redirect to Admin Management Dashboard immediately
  if (AuthStorage.isAuthenticated()) {
    window.location.replace('admin.html');
    return;
  }

  elements.form.addEventListener('submit', handleLoginSubmit);

  // Clear validation errors on typing
  elements.usernameInput.addEventListener('input', () => {
    elements.usernameError.style.display = 'none';
    elements.usernameInput.classList.remove('is-invalid');
  });

  elements.passwordInput.addEventListener('input', () => {
    elements.passwordError.style.display = 'none';
    elements.passwordInput.classList.remove('is-invalid');
  });
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  hideAlert();

  const username = elements.usernameInput.value.trim();
  const password = elements.passwordInput.value;
  const remember = elements.rememberCheckbox.checked;

  // 1. Client-side field validation
  let hasError = false;

  if (!username) {
    elements.usernameError.style.display = 'block';
    elements.usernameInput.classList.add('is-invalid');
    hasError = true;
  }

  if (!password) {
    elements.passwordError.style.display = 'block';
    elements.passwordInput.classList.add('is-invalid');
    hasError = true;
  }

  if (hasError) return;

  // 2. Set loading button state
  setSubmitting(true);

  try {
    // 3. Make authentication request to backend
    const authResult = await api.login(username, password);

    // 4. Store token securely in storage
    AuthStorage.setToken(authResult.token, remember);
    if (authResult.user) {
      AuthStorage.setUser(authResult.user, remember);
    }

    // 5. Redirect to admin management panel
    window.location.replace('admin.html');
  } catch (err) {
    console.error('[Login Error]', err);

    let displayMessage = err.message || 'Authentication failed. Please verify credentials.';
    if (err.status === 401 || err.status === 400) {
      displayMessage = 'Invalid username or password. Please try again.';
    }

    showAlert(displayMessage);
    setSubmitting(false);
  }
}

function setSubmitting(isSubmitting) {
  if (isSubmitting) {
    elements.submitBtn.disabled = true;
    elements.submitBtn.textContent = 'Verifying credentials...';
  } else {
    elements.submitBtn.disabled = false;
    elements.submitBtn.textContent = 'Sign In as Administrator';
  }
}

function showAlert(message) {
  elements.loginAlert.textContent = message;
  elements.loginAlert.style.display = 'block';
}

function hideAlert() {
  elements.loginAlert.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', initAdminLogin);
