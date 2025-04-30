// searchNotes.js - Search functionality for notes

import { getNotes } from './state.js';
import { renderNotes } from './ui.js';
import { showToast } from './uiUtils.js';

// Keep track of search state
let currentSearchTerm = '';
let originalNotes = null;

/**
 * Search notes by content
 * @param {string} searchTerm - The term to search for
 * @returns {Array} - Filtered notes
 */
function searchNotes(searchTerm) {
  // Get all notes
  const allNotes = getNotes();
  
  // If search term is empty, return all notes
  if (!searchTerm || searchTerm.trim() === '') {
    return allNotes;
  }
  
  // Normalize search term (lowercase, trim)
  const normalizedTerm = searchTerm.toLowerCase().trim();
  
  // Filter notes based on content
  return allNotes.filter(note => {
    // Check if content contains search term
    const content = note.content || '';
    
    // For HTML content (from Quill editor), strip HTML tags first
    const plainContent = content.replace(/<[^>]*>/g, ' ');
    
    return plainContent.toLowerCase().includes(normalizedTerm);
  });
}

/**
 * Create a search modal
 */
function createSearchModal() {
  // Check if modal already exists
  if (document.getElementById('searchModal')) {
    return document.getElementById('searchModal');
  }
  
  // Create modal elements
  const modal = document.createElement('div');
  modal.id = 'searchModal';
  modal.className = 'modal';
  
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  
  // Add header
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.textContent = 'Search Notes';
  
  // Add search input
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'modal-input';
  searchInput.id = 'searchInput';
  searchInput.placeholder = 'Type to search...';
  
  // Add search count
  const searchCount = document.createElement('div');
  searchCount.id = 'searchCount';
  searchCount.style.fontSize = '14px';
  searchCount.style.margin = '10px 0';
  searchCount.textContent = '';
  
  // Add action buttons
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  
  const cancelButton = document.createElement('button');
  cancelButton.className = 'modal-btn modal-btn-cancel';
  cancelButton.textContent = 'Cancel';
  
  const searchButton = document.createElement('button');
  searchButton.className = 'modal-btn modal-btn-confirm';
  searchButton.textContent = 'Search';
  
  // Assemble the modal
  actions.appendChild(cancelButton);
  actions.appendChild(searchButton);
  
  modalContent.appendChild(header);
  modalContent.appendChild(searchInput);
  modalContent.appendChild(searchCount);
  modalContent.appendChild(actions);
  
  modal.appendChild(modalContent);
  
  // Add to DOM
  document.body.appendChild(modal);
  
  // Add event listeners
  cancelButton.addEventListener('click', closeSearch);
  
  searchButton.addEventListener('click', () => {
    const term = searchInput.value;
    performSearch(term);
  });
  
  // Search as user types (after a delay)
  let typingTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      const term = searchInput.value;
      updateSearchCount(term);
    }, 300); // Wait 300ms after typing stops
  });
  
  // Handle Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const term = searchInput.value;
      performSearch(term);
    }
  });
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSearch();
    }
  });
  
  // Also close with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeSearch();
    }
  });
  
  return modal;
}

/**
 * Update the search count display
 * @param {string} term - Search term
 */
function updateSearchCount(term) {
  const searchCount = document.getElementById('searchCount');
  if (!searchCount) return;
  
  if (!term || term.trim() === '') {
    searchCount.textContent = '';
    return;
  }
  
  const matchCount = searchNotes(term).length;
  const totalCount = getNotes().length;
  
  searchCount.textContent = `Found ${matchCount} match${matchCount !== 1 ? 'es' : ''} out of ${totalCount} note${totalCount !== 1 ? 's' : ''}`;
}

/**
 * Show the search modal
 */
function showSearch() {
  const modal = createSearchModal();
  modal.classList.add('active');
  
  // Focus the search input
  setTimeout(() => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.focus();
      
      // If there's a previous search term, restore it
      if (currentSearchTerm) {
        searchInput.value = currentSearchTerm;
        updateSearchCount(currentSearchTerm);
      }
    }
  }, 100);
}

/**
 * Close the search modal and optionally clear search
 * @param {boolean} clearSearch - Whether to clear the search results
 */
function closeSearch(clearSearch = true) {
  const modal = document.getElementById('searchModal');
  if (modal) {
    modal.classList.remove('active');
  }
  
  // If clearSearch is true, restore original notes
  if (clearSearch && originalNotes && currentSearchTerm) {
    restoreOriginalNotes();
  }
}

/**
 * Perform search on notes
 * @param {string} term - Search term
 */
function performSearch(term) {
  // Store current state if this is a new search
  if (!currentSearchTerm) {
    originalNotes = [...getNotes()];
  }
  
  // Update current search term
  currentSearchTerm = term;
  
  if (!term || term.trim() === '') {
    // If search term is empty, restore original notes
    restoreOriginalNotes();
    closeSearch();
    return;
  }
  
  // Filter notes
  const filteredNotes = searchNotes(term);
  
  // Update UI
  import('./state.js').then(module => {
    module.setNotes(filteredNotes);
    renderNotes();
    
    // Display search results message
    showToast(`Showing ${filteredNotes.length} search result${filteredNotes.length !== 1 ? 's' : ''}`);
    
    // Hide modal
    closeSearch(false); // Don't clear search when closing
    
    // Add search indicator to the UI
    addSearchIndicator(term);
  });
}

/**
 * Add a search indicator to the UI
 * @param {string} term - Search term
 */
function addSearchIndicator(term) {
  // Remove any existing search indicator
  removeSearchIndicator();
  
  // Create search indicator
  const indicator = document.createElement('div');
  indicator.id = 'searchIndicator';
  indicator.className = 'search-indicator';
  
  // Style the indicator
  indicator.style.cssText = `
    position: fixed;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--primary-color);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    z-index: 100;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  `;
  
  // Add content
  indicator.innerHTML = `
    <span style="margin-right: 8px;">Search: "${term}"</span>
    <button id="clearSearchBtn" style="background: none; border: none; color: white; cursor: pointer; font-weight: bold;">✕</button>
  `;
  
  // Add to DOM
  document.body.appendChild(indicator);
  
  // Add event listener to clear button
  document.getElementById('clearSearchBtn').addEventListener('click', restoreOriginalNotes);
}

/**
 * Remove search indicator from UI
 */
function removeSearchIndicator() {
  const indicator = document.getElementById('searchIndicator');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Restore original notes (before search filtering)
 */
function restoreOriginalNotes() {
  if (originalNotes) {
    import('./state.js').then(module => {
      module.setNotes(originalNotes);
      renderNotes();
      
      // Reset search state
      originalNotes = null;
      currentSearchTerm = '';
      
      // Remove search indicator
      removeSearchIndicator();
    });
  }
}

/**
 * Initialize search functionality
 */
function initSearchFunctionality() {
  // Find the search button
  const searchButton = document.getElementById('searchButton');
  if (!searchButton) {
    console.error('Search button not found');
    return;
  }
  
  // Add click event listener
  searchButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showSearch();
    return false;
  }, true); // Use capture phase to ensure our handler runs first
  
  console.log('Search functionality initialized');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit to ensure everything else is loaded
  setTimeout(initSearchFunctionality, 1000);
});

// Add some CSS for the search feature
const style = document.createElement('style');
style.textContent = `
  /* Search modal specific styles */
  #searchModal .modal-content {
    max-width: 500px;
  }
  
  #searchModal .modal-header {
    color: var(--primary-color);
  }
  
  #searchInput {
    width: 100%;
    padding: 10px;
    border-radius: var(--border-radius);
    border: 1px solid #e0e0e0;
    font-size: 16px;
  }
  
  #searchInput:focus {
    outline: none;
    border-color: var(--primary-color);
  }
  
  /* Dark mode support */
  body.dark-mode #searchInput {
    background-color: #2a2a2a;
    border-color: var(--border-color);
    color: var(--text-color);
  }
  
  body.dark-mode #searchInput:focus {
    border-color: var(--primary-color);
  }
`;
document.head.appendChild(style);
