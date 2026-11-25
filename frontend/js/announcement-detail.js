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
  galleryContainer: document.getElementById('detail-gallery-container'),
  desc: document.getElementById('detail-desc'),
  linksBox: document.getElementById('detail-links-box'),
  resourcesList: document.getElementById('detail-resources-list'),
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

  const isImg = (url) => url && (/\.(jpe?g|png|gif|webp|svg)($|\?)/i.test(url) || url.startsWith('data:image/'));
  const isPdf = (url) => url && (/\.pdf($|\?)/i.test(url) || url.startsWith('data:application/pdf'));

  const allFiles = Array.isArray(item.files) && item.files.length > 0
    ? item.files
    : (item.fileUrl ? [{ url: item.fileUrl, name: 'Attached Document' }] : []);
  const allLinks = Array.isArray(item.links) && item.links.length > 0
    ? item.links
    : (item.attachmentUrl && item.attachmentUrl !== item.fileUrl ? [{ url: item.attachmentUrl, label: 'Document Link' }] : []);

  // PDF badge counter
  const pdfCount = allFiles.filter((f) => isPdf(f.url)).length + allLinks.filter((l) => isPdf(l.url)).length;
  if (pdfCount > 0) {
    const docBadge = createElement('span', ['badge'], pdfCount > 1 ? `📄 ${pdfCount} PDFs Attached` : '📄 PDF Attached');
    docBadge.style.background = '#fef2f2';
    docBadge.style.color = '#dc2626';
    docBadge.style.border = '1px solid #fecaca';
    elements.badges.appendChild(docBadge);
  }

  // 1. Image Gallery Handling
  const allImages = allFiles.filter((f) => f.isImage || isImg(f.url)).map((f) => f.url);
  if (allImages.length === 0 && isImg(item.fileUrl)) allImages.push(item.fileUrl);
  if (allImages.length === 0 && isImg(item.attachmentUrl)) allImages.push(item.attachmentUrl);

  const gallery = elements.galleryContainer;
  if (gallery) {
    gallery.innerHTML = '';
    if (allImages.length === 1) {
      const img = createElement('img');
      img.src = allImages[0];
      img.alt = item.title || 'Announcement Image';
      img.style.cssText = 'width: 100%; max-height: 450px; object-fit: contain; border-radius: var(--radius-md, 8px); background: #f8fafc; border: 1px solid var(--color-border);';
      gallery.appendChild(img);
      gallery.style.display = 'block';
    } else if (allImages.length > 1) {
      const mainImg = createElement('img');
      mainImg.src = allImages[0];
      mainImg.alt = item.title || 'Announcement Image';
      mainImg.style.cssText = 'width: 100%; max-height: 420px; object-fit: contain; border-radius: var(--radius-md, 8px); background: #f8fafc; border: 1px solid var(--color-border); margin-bottom: 10px;';
      gallery.appendChild(mainImg);

      const thumbsRow = createElement('div');
      thumbsRow.style.cssText = 'display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px;';
      allImages.forEach((imgUrl, idx) => {
        const thumb = createElement('img');
        thumb.src = imgUrl;
        thumb.alt = `Thumbnail ${idx + 1}`;
        thumb.style.cssText = `width: 64px; height: 64px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid ${idx === 0 ? 'var(--color-primary)' : 'transparent'}; flex-shrink: 0;`;
        thumb.addEventListener('click', () => {
          mainImg.src = imgUrl;
          Array.from(thumbsRow.children).forEach((t) => (t.style.border = '2px solid transparent'));
          thumb.style.border = '2px solid var(--color-primary)';
        });
        thumbsRow.appendChild(thumb);
      });
      gallery.appendChild(thumbsRow);
      gallery.style.display = 'block';
    } else {
      gallery.style.display = 'none';
    }
  }

  // 2. Full Description
  elements.desc.textContent = item.description || 'No description provided.';

  // 3. Resources List
  const resList = elements.resourcesList;
  if (resList) {
    resList.innerHTML = '';
    let hasResources = false;

    // A) Uploaded PDFs & non-image files
    const nonImageFiles = allFiles.filter((f) => !f.isImage && !isImg(f.url));
    nonImageFiles.forEach((f) => {
      const safeUrl = sanitizeUrl(f.url);
      if (!safeUrl) return;
      hasResources = true;
      const rawName = f.name || safeUrl.split('/').pop().split('?')[0];

      const linkEl = createElement('a', ['btn', 'btn-secondary', 'btn-sm']);
      linkEl.href = safeUrl;
      linkEl.target = '_blank';
      linkEl.rel = 'noopener noreferrer';
      linkEl.style.cssText = 'display: flex; align-items: center; justify-content: space-between; text-align: left; padding: 10px 14px; gap: 10px; width: 100%;';

      const left = createElement('span');
      left.style.cssText = 'display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
      left.innerHTML = `<span style="background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">PDF</span> <strong>${rawName}</strong>`;
      linkEl.appendChild(left);

      const action = createElement('span', [], 'View / Download ↗');
      action.style.cssText = 'font-size: 12px; color: var(--color-primary); flex-shrink: 0;';
      linkEl.appendChild(action);

      resList.appendChild(linkEl);
    });

    // B) External Links
    allLinks.forEach((l) => {
      const safeUrl = sanitizeUrl(l.url);
      if (!safeUrl) return;
      hasResources = true;
      const label = l.label ? l.label.trim() : 'External Resource';

      const linkEl = createElement('a', ['btn', 'btn-secondary', 'btn-sm']);
      linkEl.href = safeUrl;
      linkEl.target = '_blank';
      linkEl.rel = 'noopener noreferrer';
      linkEl.style.cssText = 'display: flex; align-items: center; justify-content: space-between; text-align: left; padding: 10px 14px; gap: 10px; width: 100%;';

      const left = createElement('span');
      left.style.cssText = 'display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
      left.innerHTML = `<span style="background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">LINK</span> <strong>${label}</strong>`;
      linkEl.appendChild(left);

      const action = createElement('span', [], 'Open Link ↗');
      action.style.cssText = 'font-size: 12px; color: var(--color-primary); flex-shrink: 0;';
      linkEl.appendChild(action);

      resList.appendChild(linkEl);
    });

    // C) Official Source URL
    const safeSource = sanitizeUrl(item.sourceUrl);
    if (safeSource) {
      hasResources = true;
      const sourceEl = createElement('a', ['btn', 'btn-secondary', 'btn-sm']);
      sourceEl.href = safeSource;
      sourceEl.target = '_blank';
      sourceEl.rel = 'noopener noreferrer';
      sourceEl.style.cssText = 'display: flex; align-items: center; justify-content: space-between; text-align: left; padding: 10px 14px; gap: 10px; width: 100%;';

      const left = createElement('span');
      left.style.cssText = 'display: flex; align-items: center; gap: 8px;';
      left.innerHTML = `<span style="background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">PORTAL</span> <strong>Official Website / Notice Source</strong>`;
      sourceEl.appendChild(left);

      const action = createElement('span', [], 'Visit Website ↗');
      action.style.cssText = 'font-size: 12px; color: var(--color-primary); flex-shrink: 0;';
      sourceEl.appendChild(action);

      resList.appendChild(sourceEl);
    }

    elements.linksBox.style.display = hasResources ? 'block' : 'none';
  }

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
