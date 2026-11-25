/**
 * ==========================================================================
 * CampusNotice - Centralized College Announcements Portal
 * admin.js: Administrator Announcement Management Controller
 * ==========================================================================
 *
 * MENTOR NOTES FOR STUDENT PRESENTATION:
 * - Route Protection: Immediately checks AuthStorage on load. If unauthenticated,
 *   redirects the browser to admin-login.html.
 * - Single Source of Truth: We never mutate frontend UI state in isolation.
 *   Every create, edit, pin, and delete operation triggers an API write followed
 *   by fresh database synchronization.
 * - Security: Bearer token is automatically attached by api.js to write requests.
 *   If the token expires (HTTP 401), session is cleared and user is redirected.
 */

import { api } from './api.js';
import { formatDate, getDeadlineStatus, createElement, AuthStorage } from './utils.js';

// DOM Element References
const elements = {
  logoutBtn: document.getElementById('admin-logout-btn'),
  openCreateModalBtn: document.getElementById('open-create-modal-btn'),
  emptyCreateBtn: document.getElementById('empty-create-btn'),
  refreshBtn: document.getElementById('admin-refresh-btn'),
  alertBanner: document.getElementById('admin-alert'),

  // Filters
  searchInput: document.getElementById('admin-search-input'),
  categoryFilter: document.getElementById('admin-category-filter'),

  // Table & States
  loadingState: document.getElementById('admin-loading'),
  emptyState: document.getElementById('admin-empty'),
  tableWrapper: document.getElementById('admin-table-wrapper'),
  tableBody: document.getElementById('admin-table-body'),

  // Form Modal Elements
  formModal: document.getElementById('announcement-modal'),
  formModalTitle: document.getElementById('form-modal-title'),
  announcementForm: document.getElementById('announcement-form'),
  formId: document.getElementById('form-announcement-id'),
  formTitle: document.getElementById('form-title'),
  formCategory: document.getElementById('form-category'),
  formDescription: document.getElementById('form-description'),
  formPublishedAt: document.getElementById('form-published-at'),
  formDeadline: document.getElementById('form-deadline'),
  formSourceUrl: document.getElementById('form-source-url'),
  formFileInput: document.getElementById('form-file-input'),
  filesCountBadge: document.getElementById('files-count-badge'),
  uploadFilesList: document.getElementById('upload-files-list'),
  addLinkBtn: document.getElementById('add-link-btn'),
  linksListContainer: document.getElementById('links-list-container'),
  formPinned: document.getElementById('form-pinned'),
  titleError: document.getElementById('title-error'),
  descError: document.getElementById('desc-error'),
  saveBtn: document.getElementById('save-announcement-btn'),
  closeFormModalBtn: document.getElementById('close-form-modal-btn'),
  cancelFormBtn: document.getElementById('cancel-form-btn'),

  // Delete Confirmation Modal Elements
  deleteModal: document.getElementById('delete-modal'),
  deleteNoticeTitle: document.getElementById('delete-notice-title'),
  confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
  cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
  closeDeleteModalBtn: document.getElementById('close-delete-modal-btn'),
};

// Component State
let announcementsCache = [];
let itemToDelete = null;
let selectedNewFiles = []; // Array of local File objects
let persistedFiles = [];   // Array of { url, name, isImage, size }
let linksList = [];        // Array of { label, url }

/**
 * Initializes Admin Dashboard
 */
function initAdmin() {
  // 1. Guard route: redirect if not logged in
  if (!AuthStorage.isAuthenticated()) {
    window.location.replace('admin-login.html');
    return;
  }

  // 2. Wire event listeners
  elements.logoutBtn.addEventListener('click', handleLogout);
  elements.openCreateModalBtn.addEventListener('click', openCreateModal);
  if (elements.emptyCreateBtn) {
    elements.emptyCreateBtn.addEventListener('click', openCreateModal);
  }
  elements.refreshBtn.addEventListener('click', loadAdminAnnouncements);

  // Search & Category Filter
  elements.searchInput.addEventListener('input', filterAndRenderTable);
  elements.categoryFilter.addEventListener('change', filterAndRenderTable);

  // Multiple Files & Links Listeners
  if (elements.formFileInput) {
    elements.formFileInput.addEventListener('change', handleFilesSelected);
  }
  if (elements.addLinkBtn) {
    elements.addLinkBtn.addEventListener('click', handleAddLinkRow);
  }

  // Form Modal Listeners
  elements.announcementForm.addEventListener('submit', handleFormSubmit);
  elements.closeFormModalBtn.addEventListener('click', closeFormModal);
  elements.cancelFormBtn.addEventListener('click', closeFormModal);

  // Delete Modal Listeners
  elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
  elements.closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  elements.cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  // Backdrop dismissal
  elements.formModal.addEventListener('click', (e) => {
    if (e.target === elements.formModal) closeFormModal();
  });
  elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) closeDeleteModal();
  });

  // ESC key dismissal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (elements.formModal.classList.contains('active')) closeFormModal();
      if (elements.deleteModal.classList.contains('active')) closeDeleteModal();
    }
  });

  // 3. Initial load from database
  loadAdminAnnouncements();
}

/**
 * Handles administrator sign-out
 */
function handleLogout() {
  AuthStorage.clear();
  window.location.replace('admin-login.html');
}

/**
 * Fetches announcements from backend database
 */
async function loadAdminAnnouncements() {
  showLoading();

  try {
    const response = await api.getAnnouncements();
    announcementsCache = response.data || [];
    filterAndRenderTable();
  } catch (err) {
    console.error('[Admin Load Error]', err);
    if (err.status === 401) {
      handleAuthExpired();
      return;
    }
    showAlert(`Error connecting to backend database: ${err.message}`, 'error');
    showEmpty();
  }
}

/**
 * Filters cached announcements by search input & category and updates table
 */
function filterAndRenderTable() {
  const searchTerm = elements.searchInput.value.toLowerCase().trim();
  const selectedCat = elements.categoryFilter.value;

  const filtered = announcementsCache.filter((item) => {
    // Category check
    if (selectedCat !== 'All') {
      if ((item.category || '').toLowerCase() !== selectedCat.toLowerCase()) {
        return false;
      }
    }
    // Search check
    if (searchTerm) {
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      if (!title.includes(searchTerm) && !desc.includes(searchTerm)) {
        return false;
      }
    }
    return true;
  });

  // Sort: pinned first, then newest
  filtered.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0);
  });

  renderTableRows(filtered);
}

/**
 * Generates table rows with document.createElement()
 */
function renderTableRows(items) {
  elements.tableBody.innerHTML = '';

  if (items.length === 0) {
    showEmpty();
    return;
  }

  hideAllStates();
  elements.tableWrapper.style.display = 'block';

  items.forEach((item) => {
    const id = item._id || item.id;
    const tr = createElement('tr');
    tr.style.borderBottom = '1px solid var(--color-border)';

    // Column 1: Pinned / Status Toggle
    const tdPin = createElement('td');
    tdPin.style.padding = 'var(--space-3) var(--space-4)';
    const pinBtn = createElement('button', ['btn', 'btn-sm', item.pinned ? 'btn-primary' : 'btn-secondary']);
    pinBtn.type = 'button';
    pinBtn.title = item.pinned ? 'Click to unpin' : 'Click to pin to top';
    pinBtn.innerHTML = item.pinned ? '&#9733; Pinned' : '&#9734; Unpinned';
    pinBtn.addEventListener('click', () => handleTogglePin(item));
    tdPin.appendChild(pinBtn);
    tr.appendChild(tdPin);

    // Column 2: Title
    const tdTitle = createElement('td');
    tdTitle.style.padding = 'var(--space-3) var(--space-4)';
    const titleLink = createElement('a', [], item.title || 'Untitled');
    titleLink.href = `announcement.html?id=${encodeURIComponent(id)}`;
    titleLink.target = '_blank';
    titleLink.style.fontWeight = '600';
    titleLink.style.color = 'var(--color-text-main)';
    tdTitle.appendChild(titleLink);
    tr.appendChild(tdTitle);

    // Column 3: Category
    const tdCat = createElement('td');
    tdCat.style.padding = 'var(--space-3) var(--space-4)';
    const category = item.category || 'General';
    const catBadge = createElement('span', ['badge', `badge-${category.toLowerCase()}`], category);
    tdCat.appendChild(catBadge);
    tr.appendChild(tdCat);

    // Column 4: Published Date
    const tdDate = createElement('td');
    tdDate.style.padding = 'var(--space-3) var(--space-4)';
    tdDate.textContent = formatDate(item.publishedAt || item.createdAt);
    tdDate.style.color = 'var(--color-text-muted)';
    tr.appendChild(tdDate);

    // Column 5: Deadline Status
    const tdDeadline = createElement('td');
    tdDeadline.style.padding = 'var(--space-3) var(--space-4)';
    const deadlineInfo = getDeadlineStatus(item.deadline);
    if (deadlineInfo) {
      const deadlineSpan = createElement('span', ['deadline-indicator', deadlineInfo.status], deadlineInfo.formatted);
      deadlineSpan.style.margin = '0';
      deadlineSpan.style.padding = '2px 6px';
      tdDeadline.appendChild(deadlineSpan);
    } else {
      tdDeadline.textContent = 'None';
      tdDeadline.style.color = 'var(--color-text-subtle)';
    }
    tr.appendChild(tdDeadline);

    // Column 6: Actions (Edit & Delete)
    const tdActions = createElement('td');
    tdActions.style.padding = 'var(--space-3) var(--space-4)';
    tdActions.style.textAlign = 'right';

    const actionGroup = createElement('div');
    actionGroup.style.display = 'inline-flex';
    actionGroup.style.gap = 'var(--space-2)';

    // Edit Button
    const editBtn = createElement('button', ['btn', 'btn-secondary', 'btn-sm'], 'Edit');
    editBtn.type = 'button';
    editBtn.addEventListener('click', () => openEditModal(item));
    actionGroup.appendChild(editBtn);

    // Delete Button
    const deleteBtn = createElement('button', ['btn', 'btn-danger', 'btn-sm'], 'Delete');
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', () => openDeleteModal(item));
    actionGroup.appendChild(deleteBtn);

    tdActions.appendChild(actionGroup);
    tr.appendChild(tdActions);

    elements.tableBody.appendChild(tr);
  });
}

/**
 * Toggles pinned status via backend PUT request
 */
async function handleTogglePin(item) {
  const id = item._id || item.id;
  const newPinnedState = !item.pinned;

  try {
    await api.updateAnnouncement(id, { pinned: newPinnedState });
    showAlert(`Notice "${item.title}" ${newPinnedState ? 'pinned to top' : 'unpinned'}.`, 'success');
    await loadAdminAnnouncements();
  } catch (err) {
    if (err.status === 401) return handleAuthExpired();
    showAlert(`Failed to update pinned state: ${err.message}`, 'error');
  }
}

/**
 * Handles multiple file selection from local device (PDF or Images only)
 */
function handleFilesSelected() {
  const fileInput = elements.formFileInput;
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;

  const filesArray = Array.from(fileInput.files);
  const allowed = /\.(pdf|jpe?g|png|gif|webp|svg)$/i;

  let addedCount = 0;
  for (const f of filesArray) {
    if (allowed.test(f.name)) {
      selectedNewFiles.push(f);
      addedCount++;
    } else {
      showAlert(`File "${f.name}" was skipped: only PDF and images are allowed.`, 'error');
    }
  }

  // Reset file input so user can choose more files if desired
  fileInput.value = '';

  renderFilesList();
  if (addedCount > 0) {
    showAlert(`Added ${addedCount} file(s). They will be uploaded when saving.`, 'success');
  }
}

/**
 * Renders list of uploaded & staged files in Admin modal
 */
function renderFilesList() {
  if (!elements.uploadFilesList) return;
  elements.uploadFilesList.innerHTML = '';
  const totalCount = persistedFiles.length + selectedNewFiles.length;

  if (elements.filesCountBadge) {
    if (totalCount > 0) {
      elements.filesCountBadge.textContent = `${totalCount} file${totalCount > 1 ? 's' : ''}`;
      elements.filesCountBadge.style.display = 'inline-block';
    } else {
      elements.filesCountBadge.style.display = 'none';
    }
  }

  // 1. Render previously persisted files (from DB)
  persistedFiles.forEach((fileItem, idx) => {
    const rawName = fileItem.name || (fileItem.url ? fileItem.url.split('/').pop().split('?')[0] : 'Document');
    const isImage = Boolean(fileItem.isImage || (fileItem.url && /\.(jpe?g|png|gif|webp|svg)($|\?)/i.test(fileItem.url)));
    const row = createFileCardRow({
      name: rawName,
      sizeText: fileItem.size ? `${Math.round(fileItem.size / 1024)} KB` : '',
      isImage,
      previewUrl: fileItem.url,
      badgeText: 'Saved File',
      badgeColor: '#16a34a',
      onRemove: () => {
        persistedFiles.splice(idx, 1);
        renderFilesList();
      },
    });
    elements.uploadFilesList.appendChild(row);
  });

  // 2. Render newly selected local files
  selectedNewFiles.forEach((file, idx) => {
    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;
    const row = createFileCardRow({
      name: file.name,
      sizeText: `${Math.round(file.size / 1024)} KB`,
      isImage,
      previewUrl,
      badgeText: 'Ready to upload',
      badgeColor: 'var(--color-primary, #2563eb)',
      onRemove: () => {
        selectedNewFiles.splice(idx, 1);
        renderFilesList();
      },
    });
    elements.uploadFilesList.appendChild(row);
  });
}

/**
 * Creates a visual card item for a file in the modal list
 */
function createFileCardRow({ name, sizeText, isImage, previewUrl, badgeText, badgeColor, onRemove }) {
  const row = createElement('div');
  row.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.03);';

  // Preview thumbnail or PDF icon
  if (isImage && previewUrl) {
    const img = createElement('img');
    img.src = previewUrl;
    img.alt = name;
    img.style.cssText = 'width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; flex-shrink: 0;';
    row.appendChild(img);
  } else {
    const pdfIcon = createElement('div', [], 'PDF');
    pdfIcon.style.cssText = 'width: 44px; height: 44px; background: #fee2e2; color: #dc2626; border-radius: 6px; font-size: 13px; font-weight: bold; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #fecaca;';
    row.appendChild(pdfIcon);
  }

  // File information
  const infoCol = createElement('div');
  infoCol.style.cssText = 'flex: 1; min-width: 0;';
  const nameEl = createElement('div', [], name);
  nameEl.style.cssText = 'font-size: 13px; font-weight: 600; color: var(--color-text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
  infoCol.appendChild(nameEl);

  const subLine = createElement('div');
  subLine.style.cssText = 'display: flex; gap: 8px; font-size: 11px; margin-top: 2px;';
  if (sizeText) {
    const sizeEl = createElement('span', [], sizeText);
    sizeEl.style.color = '#64748b';
    subLine.appendChild(sizeEl);
  }
  const badgeEl = createElement('span', [], badgeText);
  badgeEl.style.cssText = `font-weight: 500; color: ${badgeColor};`;
  subLine.appendChild(badgeEl);
  infoCol.appendChild(subLine);
  row.appendChild(infoCol);

  // Remove button
  const delBtn = createElement('button', ['btn', 'btn-danger', 'btn-sm'], '✕ Remove');
  delBtn.type = 'button';
  delBtn.title = 'Remove this file';
  delBtn.style.cssText = 'padding: 4px 8px; font-size: 12px; line-height: 1; flex-shrink: 0;';
  delBtn.addEventListener('click', onRemove);
  row.appendChild(delBtn);

  return row;
}

/**
 * Adds an empty link row to the external links list
 */
function handleAddLinkRow() {
  linksList.push({ label: '', url: '' });
  renderLinksList();
}

/**
 * Renders all external links input rows
 */
function renderLinksList() {
  if (!elements.linksListContainer) return;
  elements.linksListContainer.innerHTML = '';

  linksList.forEach((linkItem, idx) => {
    const row = createElement('div');
    row.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    // Label input
    const labelInput = createElement('input', ['form-control']);
    labelInput.type = 'text';
    labelInput.placeholder = 'Link Label (e.g. Exam Timetable, Guidelines PDF)';
    labelInput.value = linkItem.label || '';
    labelInput.style.cssText = 'flex: 1; background: #ffffff; font-size: 13px; padding: 6px 10px;';
    labelInput.addEventListener('input', (e) => {
      linkItem.label = e.target.value;
    });
    row.appendChild(labelInput);

    // URL input
    const urlInput = createElement('input', ['form-control']);
    urlInput.type = 'url';
    urlInput.placeholder = 'https://college.edu/documents/circular.pdf';
    urlInput.value = linkItem.url || '';
    urlInput.style.cssText = 'flex: 2; background: #ffffff; font-size: 13px; padding: 6px 10px;';
    urlInput.addEventListener('input', (e) => {
      linkItem.url = e.target.value;
    });
    row.appendChild(urlInput);

    // Remove button
    const removeBtn = createElement('button', ['btn', 'btn-danger', 'btn-sm'], '✕');
    removeBtn.type = 'button';
    removeBtn.title = 'Remove this link';
    removeBtn.style.cssText = 'padding: 6px 10px; font-size: 12px; flex-shrink: 0;';
    removeBtn.addEventListener('click', () => {
      linksList.splice(idx, 1);
      if (linksList.length === 0) linksList.push({ label: '', url: '' });
      renderLinksList();
    });
    row.appendChild(removeBtn);

    elements.linksListContainer.appendChild(row);
  });
}

/**
 * Opens Create Modal
 */
function openCreateModal() {
  elements.formModalTitle.textContent = 'New Announcement';
  elements.formId.value = '';
  elements.announcementForm.reset();
  elements.formCategory.value = 'General';
  
  selectedNewFiles = [];
  persistedFiles = [];
  linksList = [{ label: '', url: '' }];
  renderFilesList();
  renderLinksList();

  // Set default publication date to current local datetime
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  elements.formPublishedAt.value = now.toISOString().slice(0, 16);

  clearValidationErrors();
  elements.formModal.classList.add('active');
  elements.formTitle.focus();
}

/**
 * Opens Edit Modal pre-populated with announcement data
 */
function openEditModal(item) {
  elements.formModalTitle.textContent = 'Edit Announcement';
  elements.formId.value = item._id || item.id;
  elements.formTitle.value = item.title || '';
  elements.formCategory.value = item.category || 'General';
  elements.formDescription.value = item.description || '';

  // Format dates for datetime-local input
  if (item.publishedAt) {
    const pub = new Date(item.publishedAt);
    pub.setMinutes(pub.getMinutes() - pub.getTimezoneOffset());
    elements.formPublishedAt.value = pub.toISOString().slice(0, 16);
  } else {
    elements.formPublishedAt.value = '';
  }

  if (item.deadline) {
    const dead = new Date(item.deadline);
    dead.setMinutes(dead.getMinutes() - dead.getTimezoneOffset());
    elements.formDeadline.value = dead.toISOString().slice(0, 16);
  } else {
    elements.formDeadline.value = '';
  }

  elements.formSourceUrl.value = item.sourceUrl || '';
  elements.formPinned.checked = Boolean(item.pinned);

  // Initialize multiple files
  selectedNewFiles = [];
  if (item.files && Array.isArray(item.files) && item.files.length > 0) {
    persistedFiles = item.files.map((f) => ({
      url: f.url,
      name: f.name || f.url.split('/').pop().split('?')[0],
      isImage: Boolean(f.isImage || /\.(jpe?g|png|gif|webp|svg)($|\?)/i.test(f.url)),
      size: f.size || 0,
    }));
  } else if (item.fileUrl) {
    persistedFiles = [
      {
        url: item.fileUrl,
        name: item.fileUrl.split('/').pop().split('?')[0],
        isImage: /\.(jpe?g|png|gif|webp|svg)($|\?)/i.test(item.fileUrl),
        size: 0,
      },
    ];
  } else {
    persistedFiles = [];
  }
  renderFilesList();

  // Initialize multiple links
  if (item.links && Array.isArray(item.links) && item.links.length > 0) {
    linksList = item.links.map((l) => ({ label: l.label || '', url: l.url || '' }));
  } else if (item.attachmentUrl) {
    linksList = [{ label: 'Document Link', url: item.attachmentUrl }];
  } else {
    linksList = [{ label: '', url: '' }];
  }
  renderLinksList();

  clearValidationErrors();
  elements.formModal.classList.add('active');
  elements.formTitle.focus();
}

/**
 * Closes Form Modal
 */
function closeFormModal() {
  elements.formModal.classList.remove('active');
  clearValidationErrors();
}

/**
 * Handles Form Submission (Create or Edit)
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  clearValidationErrors();

  const id = elements.formId.value;
  const isEditing = Boolean(id);

  const title = elements.formTitle.value.trim();
  const description = elements.formDescription.value.trim();
  const category = elements.formCategory.value;
  const publishedAtRaw = elements.formPublishedAt.value;
  const deadlineRaw = elements.formDeadline.value;
  const sourceUrl = elements.formSourceUrl.value.trim();
  const pinned = elements.formPinned.checked;

  // Validation
  let hasError = false;
  if (!title) {
    elements.titleError.style.display = 'block';
    elements.formTitle.classList.add('is-invalid');
    hasError = true;
  }
  if (!description) {
    elements.descError.style.display = 'block';
    elements.formDescription.classList.add('is-invalid');
    hasError = true;
  }

  if (hasError) return;

  // Upload any newly selected files
  let allUploadedFiles = [...persistedFiles];

  if (selectedNewFiles.length > 0) {
    elements.saveBtn.disabled = true;
    elements.saveBtn.textContent = `Uploading ${selectedNewFiles.length} file(s)...`;
    try {
      const uploadResList = await api.uploadFiles(selectedNewFiles);
      const formattedUploads = uploadResList.map((res) => ({
        url: res.url,
        name: res.originalName || res.fileName,
        isImage: Boolean(res.isImage),
        size: res.size || 0,
      }));
      allUploadedFiles = [...allUploadedFiles, ...formattedUploads];
    } catch (uploadErr) {
      showAlert(`Upload failed: ${uploadErr.message}`, 'error');
      elements.saveBtn.disabled = false;
      elements.saveBtn.textContent = isEditing ? 'Save Changes' : 'Publish Announcement';
      return;
    }
  }

  // Filter valid external links
  const validLinks = linksList
    .map((l) => ({ label: l.label ? l.label.trim() : '', url: l.url ? l.url.trim() : '' }))
    .filter((l) => Boolean(l.url));

  // Primary URL references for backward compatibility
  const primaryFileUrl = allUploadedFiles.length > 0 ? allUploadedFiles[0].url : null;
  const primaryAttachmentUrl = validLinks.length > 0 ? validLinks[0].url : primaryFileUrl;

  // Prepare full payload
  const payload = {
    title,
    description,
    category,
    pinned,
    publishedAt: publishedAtRaw ? new Date(publishedAtRaw).toISOString() : new Date().toISOString(),
    deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : null,
    sourceUrl: sourceUrl || null,
    fileUrl: primaryFileUrl,
    attachmentUrl: primaryAttachmentUrl,
    files: allUploadedFiles,
    links: validLinks,
  };

  // Set submitting state
  elements.saveBtn.disabled = true;
  elements.saveBtn.textContent = 'Saving to Database...';

  try {
    if (isEditing) {
      await api.updateAnnouncement(id, payload);
      showAlert(`Announcement "${title}" updated successfully!`, 'success');
    } else {
      await api.createAnnouncement(payload);
      showAlert(`Announcement "${title}" created successfully!`, 'success');
    }

    closeFormModal();
    // Synchronize fresh data from backend
    await loadAdminAnnouncements();
  } catch (err) {
    console.error('[Form Submit Error]', err);
    if (err.status === 401) return handleAuthExpired();
    showAlert(`Failed to save announcement: ${err.message}`, 'error');
  } finally {
    elements.saveBtn.disabled = false;
    elements.saveBtn.textContent = 'Save Announcement';
  }
}

/**
 * Opens Delete Confirmation Dialog
 */
function openDeleteModal(item) {
  itemToDelete = item;
  elements.deleteNoticeTitle.textContent = item.title || 'Untitled Notice';
  elements.deleteModal.classList.add('active');
}

/**
 * Closes Delete Confirmation Dialog
 */
function closeDeleteModal() {
  itemToDelete = null;
  elements.deleteModal.classList.remove('active');
}

/**
 * Confirms deletion and makes DELETE request to backend
 */
async function handleConfirmDelete() {
  if (!itemToDelete) return;

  const id = itemToDelete._id || itemToDelete.id;
  const title = itemToDelete.title;

  elements.confirmDeleteBtn.disabled = true;
  elements.confirmDeleteBtn.textContent = 'Deleting...';

  try {
    await api.deleteAnnouncement(id);
    showAlert(`Announcement "${title}" was permanently removed.`, 'success');
    closeDeleteModal();
    await loadAdminAnnouncements();
  } catch (err) {
    if (err.status === 401) return handleAuthExpired();
    showAlert(`Failed to delete announcement: ${err.message}`, 'error');
  } finally {
    elements.confirmDeleteBtn.disabled = false;
    elements.confirmDeleteBtn.textContent = 'Delete Notice';
  }
}

/**
 * Helper to handle 401 session expiration
 */
function handleAuthExpired() {
  AuthStorage.clear();
  alert('Your administrative session has expired or is invalid. Please sign in again.');
  window.location.replace('admin-login.html');
}

/**
 * Clears form validation messages
 */
function clearValidationErrors() {
  elements.titleError.style.display = 'none';
  elements.descError.style.display = 'none';
  elements.formTitle.classList.remove('is-invalid');
  elements.formDescription.classList.remove('is-invalid');
}

/**
 * Displays top alert banner
 */
function showAlert(message, type = 'success') {
  elements.alertBanner.textContent = message;
  elements.alertBanner.className = `alert alert-${type}`;
  elements.alertBanner.style.display = 'block';

  // Auto hide after 5 seconds
  setTimeout(() => {
    elements.alertBanner.style.display = 'none';
  }, 5000);
}

function hideAllStates() {
  elements.loadingState.style.display = 'none';
  elements.emptyState.style.display = 'none';
  elements.tableWrapper.style.display = 'none';
}

function showLoading() {
  hideAllStates();
  elements.loadingState.style.display = 'flex';
}

function showEmpty() {
  hideAllStates();
  elements.emptyState.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', initAdmin);
