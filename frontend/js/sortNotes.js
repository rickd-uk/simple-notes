// sortNotes.js - Add this file to your frontend/js directory

// Import necessary functions from state and ui
import { getNotes, setNotes } from './state.js';
import { renderNotes } from './ui.js';
import { showToast } from './uiUtils.js';

// Store sort preference in localStorage
let sortOldestFirst = localStorage.getItem('sortOldestFirst') === 'true';

/**
 * Sort the notes based on date
 * @param {boolean} oldestFirst - true to sort oldest first, false for newest first
 */
function sortNotes(oldestFirst = false) {
  const notes = getNotes();
  
  notes.sort((a, b) => {
    const dateA = new Date(a.updated_at).getTime();
    const dateB = new Date(b.updated_at).getTime();
    return oldestFirst ? dateA - dateB : dateB - dateA;
  });
  
  setNotes([...notes]);
  return notes;
}

/**
 * Initialize the sort functionality by attaching to the sort button
 */
function initSortFunctionality() {
  // Find the sort button
  const sortButton = document.getElementById('sortButton');
  if (!sortButton) {
    console.error('Sort button not found');
    return;
  }
  
  // Apply initial sort if we have notes
  if (getNotes().length > 0) {
    sortNotes(sortOldestFirst);
    renderNotes();
    updateButtonAppearance();
  }
  
  // Override the sort button's existing click handler
  sortButton.addEventListener('click', function(e) {
    e.stopPropagation(); // Stop any other handlers
    e.preventDefault();  // Prevent default action
    
    // Toggle sort order
    sortOldestFirst = !sortOldestFirst;
    
    // Save preference
    localStorage.setItem('sortOldestFirst', sortOldestFirst.toString());
    
    // Sort and render notes
    sortNotes(sortOldestFirst);
    renderNotes();
    
    // Update button appearance and show toast
    updateButtonAppearance();
    showToast(sortOldestFirst ? 'Sorted by oldest first' : 'Sorted by newest first');
    
    // Return false to prevent other handlers
    return false;
  }, true); // Use capture phase to intercept event before other handlers
}

/**
 * Update the sort button appearance based on current sort state
 */
function updateButtonAppearance() {
  const sortButton = document.getElementById('sortButton');
  if (!sortButton) return;
  
  const sortIcon = sortButton.querySelector('span');
  if (sortIcon) {
    sortIcon.textContent = sortOldestFirst ? '↑' : '↓';
  }
  
  sortButton.title = sortOldestFirst ? 'Sort by newest first' : 'Sort by oldest first';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit to make sure everything else is loaded
  setTimeout(initSortFunctionality, 1000);
});

// Also export a function to apply sorting after notes are loaded
export function applySortAfterLoad() {
  if (getNotes().length > 0) {
    sortNotes(sortOldestFirst);
  }
}

// Expose function globally to allow api.js to call it
window.applySortAfterLoad = applySortAfterLoad;
