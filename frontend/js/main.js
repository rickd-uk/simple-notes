// main.js - Entry point for the application
import { initState } from './state.js';
import { loadCategories, loadNotes, preloadAdjacentCategories } from './api.js';
import { setupEventListeners } from './eventHandlers.js';
import { setupMobileNavigation } from './responsive.js';
import { initDarkMode } from './darkMode.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
  // Check if Quill is loaded
  if (typeof Quill === 'undefined') {
    console.error('Quill.js is not loaded. Rich text editing will not be available.');
  }

  // Initialize dark mode
  initDarkMode();
  
  // Initialize application state
  initState();
  
  // Set up all event listeners
  setupEventListeners();
  
  // Set up mobile navigation
  setupMobileNavigation();
  
  // Load initial data
  await loadCategories();
  await loadNotes();
  
  // Preload adjacent categories after initial load
  setTimeout(() => {
    preloadAdjacentCategories();
  }, 2000);
});
