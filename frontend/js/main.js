// main.js - Entry point for the application
import { initState, setCurrentUser, elements } from './state.js';
import { loadCategories, loadNotes, preloadAdjacentCategories, getCurrentUser } from './api.js';
import { setupEventListeners } from './eventHandlers.js';
import { setupMobileNavigation } from './responsive.js';
import { initDarkMode } from './darkMode.js';
import { initToolbarToggle } from './toolbarToggle.js';
import { applyToolbarVisibilityToAll } from './quillEditor.js';

// Function to update the username display
async function updateUsernameDisplay() {
  try {
    const user = await getCurrentUser();
    if (user) {
      console.log('User data retrieved:', user);
      // Set user in state
      setCurrentUser(user);
      
      // Update username display
      if (elements.usernameDisplay) {
        elements.usernameDisplay.textContent = `${user.username}`;
      }
    } else {
      // If no user is found, redirect to login
      window.location.href = '/login.html';
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    elements.usernameDisplay.textContent = 'Unknown User';
  }
}

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

  await updateUsernameDisplay();
  
  // Load initial data
  await loadCategories();
  await loadNotes();
  
  // Initialize the global toolbar toggle AFTER notes are loaded
  setTimeout(() => {
    initToolbarToggle();
    
    // Make sure toolbar visibility is applied to all editors after a brief delay
    setTimeout(() => {
      applyToolbarVisibilityToAll();
    }, 100);
  }, 500);
  
  // Preload adjacent categories after initial load
  setTimeout(() => {
    preloadAdjacentCategories();
  }, 2000);
  
  // Add MutationObserver to detect new notes and maintain toolbar visibility
  const notesContainer = document.getElementById('notesContainer');
  if (notesContainer) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // New notes were added, ensure toolbar visibility is maintained
          setTimeout(() => {
            applyToolbarVisibilityToAll();
          }, 50);
        }
      });
    });
    
    // Start observing the notes container for changes
    observer.observe(notesContainer, { 
      childList: true,
      subtree: true 
    });
  }
});
