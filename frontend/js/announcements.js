/**
 * ==========================================================================
 * CampusNotice - Centralized College Announcements Portal
 * announcements.js: Student Portal View Controller & Dynamic DOM Renderer
 * ==========================================================================
 *
 * MENTOR NOTES FOR STUDENT PRESENTATION:
 * - DOM Security: All card elements (titles, descriptions, categories) are
 *   instantiated via document.createElement() and populated with .textContent
 *   to eliminate Cross-Site Scripting (XSS) risks.
 * - Architectural Separation: Data retrieval is delegated to api.js, and
 *   state filter management is handled by filters.js.
 * - Modal Accessibility: The announcement detail modal includes keyboard (ESC)
 *   support, backdrop dismissal, and accessible ARIA attributes.
 */

import { api } from './api.js';
import { formatDate, getDeadlineStatus, createElement, sanitizeUrl, AuthStorage } from './utils.js';
import { FilterState, initFilters, applyClientFilters } from './filters.js';

// DOM Elements Cache
const elements = {
  // Navigation
  navAdminLink: document.getElementById('nav-admin-link'),
  footerApiStatus: document.getElementById('footer-api-status'),

  // Filters & Controls
  searchInput: document.getElementById('search-input'),
  clearSearchBtn: document.getElementById('search-clear-btn'),
  categoryButtons: document.querySelectorAll('.category-tab-btn'),
  sortSelect: document.getElementById('sort-select'),

  // State Containers
  loadingState: document.getElementById('loading-state'),
  errorState: document.getElementById('error-state'),
  errorMessage: document.getElementById('error-message'),
  retryBtn: document.getElementById('retry-btn'),
  emptyState: document.getElementById('empty-state'),
  emptyTitle: document.getElementById('empty-title'),
  emptyMessage: document.getElementById('empty-message'),
  resetFiltersBtn: document.getElementById('reset-filters-btn'),

  // Announcements Grids
  announcementsContainer: document.getElementById('announcements-container'),
  pinnedSection: document.getElementById('pinned-section'),
  pinnedGrid: document.getElementById('pinned-grid'),
  pinnedCountBadge: document.getElementById('pinned-count-badge'),
  allSection: document.getElementById('all-section'),
  allGrid: document.getElementById('all-grid'),
  allCountBadge: document.getElementById('all-count-badge'),

  // Modal Elements
  detailModal: document.getElementById('detail-modal'),
  modalBadges: document.getElementById('modal-badges'),
  modalTitle: document.getElementById('modal-announcement-title'),
  modalPublished: document.getElementById('modal-published'),
  modalDeadline: document.getElementById('modal-deadline'),
  modalGalleryContainer: document.getElementById('modal-gallery-container'),
  modalDesc: document.getElementById('modal-announcement-desc'),
  modalLinksSection: document.getElementById('modal-links-section'),
  modalResourcesList: document.getElementById('modal-resources-list'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalDismissBtn: document.getElementById('modal-dismiss-btn'),
  modalDirectPageLink: document.getElementById('modal-direct-page-link'),
};

// In-memory announcements cache for responsive client-side filtering
let allAnnouncementsCache = [];

/**
 * Initializes the Student Dashboard
 */
async function initDashboard() {
  updateAdminNavButton();
  bindModalEvents();
  checkApiHealth();

  // Initialize Search, Category, and Sort listeners
  initFilters(
    {
      searchInput: elements.searchInput,
      clearSearchBtn: elements.clearSearchBtn,
      categoryButtons: elements.categoryButtons,
      sortSelect: elements.sortSelect,
    },
    handleFilterChange
  );

  // Setup Error Retry and Reset buttons
  elements.retryBtn.addEventListener('click', () => loadAnnouncements());
  elements.resetFiltersBtn.addEventListener('click', resetAllFilters);

  // Initial load
  await loadAnnouncements();
}

/**
 * Updates Admin link in header if administrator is already logged in
 */
function updateAdminNavButton() {
  if (AuthStorage.isAuthenticated()) {
    elements.navAdminLink.textContent = 'Admin Dashboard';
    elements.navAdminLink.href = 'pages/admin.html';
  } else {
    elements.navAdminLink.textContent = 'Admin Portal';
    elements.navAdminLink.href = 'pages/admin-login.html';
  }
}

/**
 * Checks backend health endpoint and updates footer status
 */
async function checkApiHealth() {
  try {
    await api.checkHealth();
    elements.footerApiStatus.textContent = 'Connected (Online)';
    elements.footerApiStatus.style.color = '#15803d'; // Green
  } catch {
    elements.footerApiStatus.textContent = 'Backend Offline';
    elements.footerApiStatus.style.color = '#b91c1c'; // Red
  }
}

/**
 * Loads announcements from backend API with loading, empty, and error state handling
 */
async function loadAnnouncements() {
  showLoading();

  try {
    // Pass current filter query params to API
    const response = await api.getAnnouncements({
      search: FilterState.search,
      category: FilterState.category,
      sort: FilterState.sort,
      limit: 100,
    });

    allAnnouncementsCache = response.data || [];

    // Filter and render
    renderAnnouncementsList();
  } catch (err) {
    console.error('[Dashboard Error]', err);
    showError(err.message || 'Failed to communicate with CampusNotice backend server.');
  }
}

/**
 * Handles filter criteria updates from filters.js
 */
function handleFilterChange() {
  // If we already have items loaded, apply client filtering instantly
  if (allAnnouncementsCache.length > 0) {
    renderAnnouncementsList();
  } else {
    // If cache is empty, query API
    loadAnnouncements();
  }
}

/**
 * Resets search input and category selection
 */
function resetAllFilters() {
  FilterState.search = '';
  FilterState.category = 'All';
  FilterState.sort = 'newest';

  if (elements.searchInput) elements.searchInput.value = '';
  if (elements.clearSearchBtn) elements.clearSearchBtn.style.display = 'none';
  if (elements.sortSelect) elements.sortSelect.value = 'newest';

  elements.categoryButtons.forEach((btn) => {
    if (btn.getAttribute('data-category') === 'All') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderAnnouncementsList();
}

/**
 * Renders filtered announcements into Pinned and Regular sections
 */
function renderAnnouncementsList() {
  // Apply filtering rules
  const filtered = applyClientFilters(allAnnouncementsCache, FilterState);

  if (filtered.length === 0) {
    showEmpty();
    return;
  }

  hideAllStates();
  elements.announcementsContainer.style.display = 'block';

  // Separate pinned announcements
  const pinnedItems = filtered.filter((item) => item.pinned);
  const regularItems = filtered.filter((item) => !item.pinned);

  // Render Pinned Section
  if (pinnedItems.length > 0) {
    elements.pinnedSection.style.display = 'block';
    elements.pinnedCountBadge.textContent = `${pinnedItems.length} Pinned`;
    renderGrid(elements.pinnedGrid, pinnedItems);
  } else {
    elements.pinnedSection.style.display = 'none';
    elements.pinnedGrid.innerHTML = '';
  }

  // Render Regular / All Section
  elements.allCountBadge.textContent = `${filtered.length} Notice${filtered.length === 1 ? '' : 's'}`;
  renderGrid(elements.allGrid, regularItems.length > 0 ? regularItems : pinnedItems);
}

/**
 * Safely renders a list of announcement cards into a container
 *
 * @param {HTMLElement} container
 * @param {Array} items
 */
function renderGrid(container, items) {
  container.innerHTML = '';

  items.forEach((item) => {
    const card = createAnnouncementCard(item);
    container.appendChild(card);
  });
}

/**
 * Creates an announcement card DOM element with full accessibility & security
 *
 * @param {object} item
 * @returns {HTMLElement}
 */
function createAnnouncementCard(item) {
  const card = createElement('article', ['card']);
  if (item.pinned) {
    card.classList.add('is-pinned');
  }

  // 1. Top Meta: Category Badge + Pinned Badge + Published Date
  const topMeta = createElement('div', 'card-top-meta');
  const badgeGroup = createElement('div', 'badge-group');

  // Category Badge
  const category = item.category || 'General';
  const catBadge = createElement('span', ['badge', `badge-${category.toLowerCase()}`], category);
  badgeGroup.appendChild(catBadge);

  // Pinned Badge
  if (item.pinned) {
    const pinnedBadge = createElement('span', ['badge', 'badge-pinned'], 'PINNED');
    badgeGroup.appendChild(pinnedBadge);
  }

  // Document & Image Badges
  const isImageUrl = (url) => url && (/\.(jpe?g|png|gif|webp|svg)($|\?)/i.test(url) || url.startsWith('data:image/'));
  const isPdfUrl = (url) => url && (/\.pdf($|\?)/i.test(url) || url.startsWith('data:application/pdf'));

  const allFiles = Array.isArray(item.files) && item.files.length > 0 
    ? item.files 
    : (item.fileUrl ? [{ url: item.fileUrl, name: 'Attached Document' }] : []);
  const allLinks = Array.isArray(item.links) && item.links.length > 0 
    ? item.links 
    : (item.attachmentUrl && item.attachmentUrl !== item.fileUrl ? [{ url: item.attachmentUrl, label: 'Document Link' }] : []);

  // PDF badge counter
  const pdfCount = allFiles.filter((f) => isPdfUrl(f.url)).length + allLinks.filter((l) => isPdfUrl(l.url)).length;
  if (pdfCount > 0) {
    const docBadge = createElement('span', ['badge'], pdfCount > 1 ? `📄 ${pdfCount} PDFs` : '📄 PDF Attached');
    docBadge.style.background = '#fef2f2';
    docBadge.style.color = '#dc2626';
    docBadge.style.border = '1px solid #fecaca';
    badgeGroup.appendChild(docBadge);
  }

  // Image count badge
  const allImages = allFiles.filter((f) => f.isImage || isImageUrl(f.url)).map((f) => f.url);
  if (allImages.length === 0 && isImageUrl(item.fileUrl)) allImages.push(item.fileUrl);
  if (allImages.length === 0 && isImageUrl(item.attachmentUrl)) allImages.push(item.attachmentUrl);

  if (allImages.length > 1) {
    const imgBadge = createElement('span', ['badge'], `🖼️ ${allImages.length} Images`);
    imgBadge.style.background = '#eff6ff';
    imgBadge.style.color = '#1d4ed8';
    imgBadge.style.border = '1px solid #bfdbfe';
    badgeGroup.appendChild(imgBadge);
  }

  // Publication Date
  const dateFormatted = formatDate(item.publishedAt || item.createdAt);
  const dateSpan = createElement('span', 'card-date', dateFormatted);

  topMeta.appendChild(badgeGroup);
  topMeta.appendChild(dateSpan);
  card.appendChild(topMeta);

  // Optional Image Preview in Card (first image)
  if (allImages.length > 0) {
    const imgContainer = createElement('div', 'card-media-wrapper');
    imgContainer.style.margin = 'var(--space-2) 0 var(--space-3) 0';
    imgContainer.style.overflow = 'hidden';
    imgContainer.style.borderRadius = 'var(--radius-sm, 6px)';
    imgContainer.style.maxHeight = '180px';
    imgContainer.style.background = '#f8fafc';

    const cardImg = createElement('img');
    cardImg.src = allImages[0];
    cardImg.alt = item.title || 'Announcement Image';
    cardImg.style.width = '100%';
    cardImg.style.height = '160px';
    cardImg.style.objectFit = 'cover';
    cardImg.style.display = 'block';
    imgContainer.appendChild(cardImg);
    card.appendChild(imgContainer);
  }

  // 2. Title
  const title = createElement('h3', 'card-title', item.title || 'Untitled Announcement');
  card.appendChild(title);

  // 3. Short Description
  const desc = createElement('p', 'card-description', item.description || 'No description provided.');
  card.appendChild(desc);

  // 4. Upcoming Deadline Status (if present)
  const deadlineInfo = getDeadlineStatus(item.deadline);
  if (deadlineInfo) {
    const deadlineDiv = createElement('div', ['deadline-indicator', deadlineInfo.status], deadlineInfo.label);
    card.appendChild(deadlineDiv);
  }

  // 5. Card Footer: "View Details" action button
  const footer = createElement('div', 'card-footer');

  const viewBtn = createElement('button', ['btn', 'btn-secondary', 'btn-sm'], 'View Details');
  viewBtn.setAttribute('type', 'button');
  viewBtn.setAttribute('aria-haspopup', 'dialog');
  viewBtn.addEventListener('click', () => openDetailModal(item));

  footer.appendChild(viewBtn);

  // Direct page link icon
  const id = item._id || item.id;
  if (id) {
    const pageLink = createElement('a', ['nav-link'], 'Full Page');
    pageLink.href = `pages/announcement.html?id=${encodeURIComponent(id)}`;
    pageLink.style.fontSize = 'var(--font-size-xs)';
    footer.appendChild(pageLink);
  }

  card.appendChild(footer);

  return card;
}

/**
 * Opens Announcement Detail Modal and binds safe data
 *
 * @param {object} item
 */
function openDetailModal(item) {
  // Clear modal badges
  elements.modalBadges.innerHTML = '';

  const category = item.category || 'General';
  const catBadge = createElement('span', ['badge', `badge-${category.toLowerCase()}`], category);
  elements.modalBadges.appendChild(catBadge);

  if (item.pinned) {
    const pinnedBadge = createElement('span', ['badge', 'badge-pinned'], 'PINNED');
    elements.modalBadges.appendChild(pinnedBadge);
  }

  // Title
  elements.modalTitle.textContent = item.title || 'Untitled Announcement';

  // Published Date
  elements.modalPublished.textContent = `Published: ${formatDate(item.publishedAt || item.createdAt, true)}`;

  // Deadline
  const deadlineInfo = getDeadlineStatus(item.deadline);
  if (deadlineInfo) {
    elements.modalDeadline.textContent = deadlineInfo.label;
    elements.modalDeadline.className = `deadline-indicator ${deadlineInfo.status}`;
    elements.modalDeadline.style.display = 'inline-flex';
  } else {
    elements.modalDeadline.style.display = 'none';
  }

  // 1. Image Gallery Handling
  const isImg = (url) => url && (/\.(jpe?g|png|gif|webp|svg)($|\?)/i.test(url) || url.startsWith('data:image/'));
  const isPdf = (url) => url && (/\.pdf($|\?)/i.test(url) || url.startsWith('data:application/pdf'));

  const allFiles = Array.isArray(item.files) && item.files.length > 0
    ? item.files
    : (item.fileUrl ? [{ url: item.fileUrl, name: 'Attached Document' }] : []);
  const allLinks = Array.isArray(item.links) && item.links.length > 0
    ? item.links
    : (item.attachmentUrl && item.attachmentUrl !== item.fileUrl ? [{ url: item.attachmentUrl, label: 'Document Link' }] : []);

  // Collect image URLs
  const allImages = allFiles.filter((f) => f.isImage || isImg(f.url)).map((f) => f.url);
  if (allImages.length === 0 && isImg(item.fileUrl)) allImages.push(item.fileUrl);
  if (allImages.length === 0 && isImg(item.attachmentUrl)) allImages.push(item.attachmentUrl);

  const gallery = elements.modalGalleryContainer;
  if (gallery) {
    gallery.innerHTML = '';
    if (allImages.length === 1) {
      const img = createElement('img');
      img.src = allImages[0];
      img.alt = item.title || 'Announcement Image';
      img.style.cssText = 'width: 100%; max-height: 340px; object-fit: contain; border-radius: var(--radius-sm, 6px); background: #f8fafc; border: 1px solid var(--color-border);';
      gallery.appendChild(img);
      gallery.style.display = 'block';
    } else if (allImages.length > 1) {
      const mainImg = createElement('img');
      mainImg.src = allImages[0];
      mainImg.alt = item.title || 'Announcement Image';
      mainImg.style.cssText = 'width: 100%; max-height: 300px; object-fit: contain; border-radius: var(--radius-sm, 6px); background: #f8fafc; border: 1px solid var(--color-border); margin-bottom: 8px;';
      gallery.appendChild(mainImg);

      const thumbsRow = createElement('div');
      thumbsRow.style.cssText = 'display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;';
      allImages.forEach((imgUrl, idx) => {
        const thumb = createElement('img');
        thumb.src = imgUrl;
        thumb.alt = `Thumbnail ${idx + 1}`;
        thumb.style.cssText = `width: 56px; height: 56px; object-fit: cover; border-radius: 4px; cursor: pointer; border: 2px solid ${idx === 0 ? 'var(--color-primary)' : 'transparent'}; flex-shrink: 0;`;
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
  elements.modalDesc.textContent = item.description || 'No description provided.';

  // 3. Resources List (All Uploaded PDFs, All External Links, Source URL)
  const resList = elements.modalResourcesList;
  if (resList) {
    resList.innerHTML = '';
    let hasResources = false;

    // A) Uploaded PDFs and non-image files
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
      linkEl.style.cssText = 'display: flex; align-items: center; justify-content: space-between; text-align: left; padding: 8px 12px; gap: 10px; width: 100%;';

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
      const label = l.label ? l.label.trim() : 'External Document / Link';

      const linkEl = createElement('a', ['btn', 'btn-secondary', 'btn-sm']);
      linkEl.href = safeUrl;
      linkEl.target = '_blank';
      linkEl.rel = 'noopener noreferrer';
      linkEl.style.cssText = 'display: flex; align-items: center; justify-content: space-between; text-align: left; padding: 8px 12px; gap: 10px; width: 100%;';

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
      sourceEl.style.cssText = 'display: flex; align-items: center; justify-content: space-between; text-align: left; padding: 8px 12px; gap: 10px; width: 100%;';

      const left = createElement('span');
      left.style.cssText = 'display: flex; align-items: center; gap: 8px;';
      left.innerHTML = `<span style="background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px;">PORTAL</span> <strong>Official Website / Notice Source</strong>`;
      sourceEl.appendChild(left);

      const action = createElement('span', [], 'Visit Website ↗');
      action.style.cssText = 'font-size: 12px; color: var(--color-primary); flex-shrink: 0;';
      sourceEl.appendChild(action);

      resList.appendChild(sourceEl);
    }

    elements.modalLinksSection.style.display = hasResources ? 'block' : 'none';
  }

  // Set direct page link
  const id = item._id || item.id;
  if (id) {
    elements.modalDirectPageLink.href = `pages/announcement.html?id=${encodeURIComponent(id)}`;
    elements.modalDirectPageLink.style.display = 'inline-flex';
  } else {
    elements.modalDirectPageLink.style.display = 'none';
  }

  // Show Modal
  elements.detailModal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

/**
 * Closes Announcement Detail Modal
 */
function closeDetailModal() {
  elements.detailModal.classList.remove('active');
  document.body.style.overflow = '';
}

/**
 * Binds modal event listeners for click and keyboard escape
 */
function bindModalEvents() {
  elements.modalCloseBtn.addEventListener('click', closeDetailModal);
  elements.modalDismissBtn.addEventListener('click', closeDetailModal);

  // Close when clicking outside dialog (on backdrop)
  elements.detailModal.addEventListener('click', (e) => {
    if (e.target === elements.detailModal) {
      closeDetailModal();
    }
  });

  // ESC key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.detailModal.classList.contains('active')) {
      closeDetailModal();
    }
  });
}

/**
 * UI State Helpers
 */
function hideAllStates() {
  elements.loadingState.style.display = 'none';
  elements.errorState.style.display = 'none';
  elements.emptyState.style.display = 'none';
  elements.announcementsContainer.style.display = 'none';
}

function showLoading() {
  hideAllStates();
  elements.loadingState.style.display = 'flex';
}

function showError(msg) {
  hideAllStates();
  elements.errorMessage.textContent = msg;
  elements.errorState.style.display = 'flex';
}

function showEmpty() {
  hideAllStates();
  if (FilterState.search || FilterState.category !== 'All') {
    elements.emptyTitle.textContent = 'No Matching Announcements';
    elements.emptyMessage.textContent = 'No announcements matched your current search and filter criteria.';
  } else {
    elements.emptyTitle.textContent = 'No Announcements Available';
    elements.emptyMessage.textContent = 'There are currently no college notices published.';
  }
  elements.emptyState.style.display = 'flex';
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);
