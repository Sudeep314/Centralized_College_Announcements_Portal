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
  fileLink: document.getElementById('detail-file-link'),
  attachmentLink: document.getElementById('detail-attachment-link'),
  sourceLink: document.getElementById('detail-source-link'),
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

  // Image preview if an image is attached
  let detailImageEl = document.getElementById('detail-image-preview');
  if (!detailImageEl && elements.desc && elements.desc.parentNode) {
    detailImageEl = document.createElement('img');
    detailImageEl.id = 'detail-image-preview';
    detailImageEl.style.width = '100%';
    detailImageEl.style.maxHeight = '400px';
    detailImageEl.style.objectFit = 'contain';
    detailImageEl.style.borderRadius = 'var(--radius-md, 8px)';
    detailImageEl.style.marginBottom = 'var(--space-6)';
    detailImageEl.style.background = '#f8fafc';
    detailImageEl.style.border = '1px solid var(--color-border)';
    elements.desc.parentNode.insertBefore(detailImageEl, elements.desc);
  }

  const isImg = (url) => url && (/\.(jpe?g|png|gif|webp|svg)($|\?)/i.test(url) || url.startsWith('data:image/'));
  const isPdf = (url) => url && (/\.pdf($|\?)/i.test(url) || url.startsWith('data:application/pdf'));

  const detailImgCandidate = isImg(item.fileUrl) ? item.fileUrl : (isImg(item.attachmentUrl) ? item.attachmentUrl : null);
  if (detailImageEl) {
    if (detailImgCandidate) {
      detailImageEl.src = detailImgCandidate;
      detailImageEl.style.display = 'block';
    } else {
      detailImageEl.style.display = 'none';
    }
  }

  // Description
  elements.desc.textContent = item.description || 'No description provided.';

  // Links (Uploaded File, Pasted Link, Official Source)
  const safeFile = sanitizeUrl(item.fileUrl);
  const safeAttachment = sanitizeUrl(item.attachmentUrl);
  const safeSource = sanitizeUrl(item.sourceUrl);
  let hasLinks = false;

  // 1. Uploaded File
  if (safeFile && elements.fileLink) {
    elements.fileLink.href = safeFile;
    elements.fileLink.style.display = 'inline-flex';
    elements.fileLink.textContent = isPdf(safeFile) ? '📄 View Uploaded PDF' : '🖼️ View Uploaded Image';
    hasLinks = true;
  } else if (elements.fileLink) {
    elements.fileLink.style.display = 'none';
  }

  // 2. Pasted Link
  if (safeAttachment && safeAttachment !== safeFile && elements.attachmentLink) {
    elements.attachmentLink.href = safeAttachment;
    elements.attachmentLink.style.display = 'inline-flex';
    elements.attachmentLink.textContent = isImg(safeAttachment) ? '🖼️ Open Image Link' : '🔗 Open PDF / Document Link';
    hasLinks = true;
  } else if (elements.attachmentLink) {
    elements.attachmentLink.style.display = 'none';
  }

  // 3. Official Source
  if (safeSource && elements.sourceLink) {
    elements.sourceLink.href = safeSource;
    elements.sourceLink.style.display = 'inline-flex';
    elements.sourceLink.textContent = '🌐 Open Official Source Link';
    hasLinks = true;
  } else if (elements.sourceLink) {
    elements.sourceLink.style.display = 'none';
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
