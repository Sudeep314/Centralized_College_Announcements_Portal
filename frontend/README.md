# CampusNotice — Centralized College Announcements Portal Frontend

Please refer to the comprehensive project documentation in the root [README.md](../README.md).

### Quick Summary
- `index.html`: Student Announcements Feed, search, category filters, date sorting, pinned notices, detail modal.
- `pages/announcement.html`: Standalone announcement view for direct links and bookmarking.
- `pages/admin-login.html`: Administrator authentication form.
- `pages/admin.html`: Announcements management interface (CRUD, pin toggles, delete confirmation).
- `css/styles.css` & `css/responsive.css`: Academic design tokens, mobile-first responsive layout (320px to 1024px+).
- `js/api.js`: Unified REST API communication module (`http://localhost:5000/api`).
- `js/utils.js`: Safe date formatting, deadline evaluation, debouncing, DOM element creation.
- `js/filters.js`: Search, category, and sort state management.
