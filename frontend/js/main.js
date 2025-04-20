// main.js - Entry point for the application
import { initState, setCurrentUser, elements } from './state.js';
import { loadCategories, loadNotes, preloadAdjacentCategories, getCurrentUser } from './api.js';
import { setupEventListeners } from './eventHandlers.js';
import { setupMobileNavigation } from './responsive.js';
import { initDarkMode } from './darkMode.js';

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
  
  // Preload adjacent categories after initial load
  setTimeout(() => {
    preloadAdjacentCategories();
  }, 2000);
});
