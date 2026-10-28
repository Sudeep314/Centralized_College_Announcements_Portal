/**
 * ==========================================================================
 * CampusNotice - Centralized College Announcements Portal
 * announcement-detail.js: Standalone Announcement Detail Page Controller
 * ==========================================================================
 */

import { api } from './api.js';
import { formatDate, getDeadlineStatus, createElement, sanitizeUrl } from './utils.js';

const elements = {
  loadingState: document.getElementById('loading-state'),
  errorState: document.getElementById('error-state'),
  errorMessage: document.getElementById('error-message'),
  detailCard: document.getElementById('detail-card'),
  badges: document.getElementById('detail-badges'),
  published: document.getElementById('detail-published'),
  title: document.getElementById('detail-title'),
  deadline: document.getElementById('detail-deadline'),
  desc: document.getElementById('detail-desc'),
  linksBox: document.getElementById('detail-links-box'),
  sourceLink: document.getElementById('detail-source-link'),
  attachmentLink: document.getElementById('detail-attachment-link'),
};

async function initDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    showError('No announcement ID was specified in the page address.');
    return;
  }

  try {
    const item = await api.getAnnouncementById(id);
    if (!item) {
      showError('Announcement not found.');
      return;
    }
    renderDetail(item);
  } catch (err) {
    console.error('[Detail Page Error]', err);
    showError(err.message || 'Unable to retrieve announcement from backend server.');
  }
}

function renderDetail(item) {
  // Badges
  elements.badges.innerHTML = '';
  const category = item.category || 'General';
  const catBadge = createElement('span', ['badge', `badge-${category.toLowerCase()}`], category);
  elements.badges.appendChild(catBadge);

  if (item.pinned) {
    const pinnedBadge = createElement('span', ['badge', 'badge-pinned'], 'PINNED NOTICE');
    elements.badges.appendChild(pinnedBadge);
  }

  // Publication Date
  elements.published.textContent = `Published on ${formatDate(item.publishedAt || item.createdAt, true)}`;

  // Title
  elements.title.textContent = item.title || 'Untitled Announcement';

  // Deadline
  const deadlineInfo = getDeadlineStatus(item.deadline);
  if (deadlineInfo) {
    elements.deadline.textContent = deadlineInfo.label;
    elements.deadline.className = `deadline-indicator ${deadlineInfo.status}`;
    elements.deadline.style.display = 'inline-flex';
  } else {
    elements.deadline.style.display = 'none';
  }

  // Description
  elements.desc.textContent = item.description || 'No description provided.';

  // Links
  const safeSource = sanitizeUrl(item.sourceUrl);
  const safeAttachment = sanitizeUrl(item.attachmentUrl);
  let hasLinks = false;

  if (safeSource) {
    elements.sourceLink.href = safeSource;
    elements.sourceLink.style.display = 'inline-flex';
    hasLinks = true;
  } else {
    elements.sourceLink.style.display = 'none';
  }

  if (safeAttachment) {
    elements.attachmentLink.href = safeAttachment;
    elements.attachmentLink.style.display = 'inline-flex';
    hasLinks = true;
  } else {
    elements.attachmentLink.style.display = 'none';
  }

  elements.linksBox.style.display = hasLinks ? 'block' : 'none';

  // Toggle UI visibility
  elements.loadingState.style.display = 'none';
  elements.errorState.style.display = 'none';
  elements.detailCard.style.display = 'block';

  // Update document title for browser tab
  document.title = `${item.title} - CampusNotice`;
}

function showError(msg) {
  elements.loadingState.style.display = 'none';
  elements.detailCard.style.display = 'none';
  elements.errorMessage.textContent = msg;
  elements.errorState.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', initDetailPage);
