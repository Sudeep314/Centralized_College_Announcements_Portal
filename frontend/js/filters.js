/**
 * ==========================================================================
 * CampusNotice - Centralized College Announcements Portal
 * filters.js: Search, Category Filter, and Sorting Controller
 * ==========================================================================
 *
 * MENTOR NOTES FOR STUDENT PRESENTATION:
 * - State Encapsulation: We manage the active filter criteria (search keyword,
 *   category, sort order) in a unified state object.
 * - Event-Driven UI: Whenever a user clicks a category tab, types in the search
 *   box, or changes the sort dropdown, we update the state and notify the
 *   announcements controller via an onChange callback.
 * - Two-tier Filtering: Supports passing query parameters to the backend API,
 *   and also provides client-side array filtering as a guarantee.
 */

import { debounce } from './utils.js';

export const FilterState = {
  search: '',
  category: 'All', // 'All' | 'Academics' | 'Examinations' | 'Events' | 'General'
  sort: 'newest',  // 'newest' | 'oldest' | 'deadline'
};

/**
 * Initializes filter UI bindings and wires event listeners.
 *
 * @param {object} elements
 * @param {HTMLInputElement} elements.searchInput
 * @param {HTMLButtonElement} elements.clearSearchBtn
 * @param {NodeList|Array<HTMLButtonElement>} elements.categoryButtons
 * @param {HTMLSelectElement} elements.sortSelect
 * @param {Function} onFilterChange - Callback invoked when filter state updates
 */
export function initFilters({ searchInput, clearSearchBtn, categoryButtons, sortSelect }, onFilterChange) {
  // 1. Search Input with 300ms Debounce
  if (searchInput) {
    const debouncedSearch = debounce((query) => {
      FilterState.search = query.trim();
      if (clearSearchBtn) {
        clearSearchBtn.style.display = FilterState.search ? 'inline-block' : 'none';
      }
      onFilterChange(FilterState);
    }, 300);

    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        FilterState.search = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        onFilterChange(FilterState);
      });
    }
  }

  // 2. Category Tab Buttons
  if (categoryButtons) {
    categoryButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const selectedCategory = btn.getAttribute('data-category') || 'All';
        
        // Update active class on tab buttons
        categoryButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        FilterState.category = selectedCategory;
        onFilterChange(FilterState);
      });
    });
  }

  // 3. Sort Select Dropdown
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      FilterState.sort = e.target.value;
      onFilterChange(FilterState);
    });
  }
}

/**
 * Helper to apply client-side filtering and sorting to an announcements array.
 * This guarantees proper filtering even if the backend returns all items.
 *
 * @param {Array} announcements
 * @param {object} criteria - { search, category, sort }
 * @returns {Array} Filtered and sorted array
 */
export function applyClientFilters(announcements, criteria = FilterState) {
  if (!Array.isArray(announcements)) return [];

  let results = [...announcements];

  // 1. Category Filter
  if (criteria.category && criteria.category !== 'All') {
    const targetCat = criteria.category.toLowerCase();
    results = results.filter((item) => {
      return (item.category || '').toLowerCase() === targetCat;
    });
  }

  // 2. Keyword Search (title and description)
  if (criteria.search && criteria.search.trim()) {
    const q = criteria.search.toLowerCase().trim();
    results = results.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }

  // 3. Sort Order
  results.sort((a, b) => {
    // Pinned notices always float to top unless sorting specifically overrides
    const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();

    if (criteria.sort === 'oldest') {
      return dateA - dateB;
    }

    if (criteria.sort === 'deadline') {
      // Items with upcoming deadlines come first, missing deadlines go to end
      const deadA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const deadB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return deadA - deadB;
    }

    // Default: 'newest' (most recent publication date first)
    return dateB - dateA;
  });

  return results;
}
