// toolbarToggle.js - Global toolbar toggle functionality

// Flag to track global toolbar visibility state
let toolbarsVisible = true;

/**
 * Toggle visibility of all Quill toolbars
 * @param {boolean} visible - Optional explicit state. If not provided, toggles current state.
 * @returns {boolean} The new visibility state
 */
export function toggleToolbars(visible) {
  // If no explicit state provided, toggle current state
  if (visible === undefined) {
    toolbarsVisible = !toolbarsVisible;
  } else {
    toolbarsVisible = visible;
  }
  
  // Store state in localStorage for persistence
  localStorage.setItem('toolbarsVisible', toolbarsVisible.toString());
  
  // Apply the visibility to all toolbars
  const toolbars = document.querySelectorAll('.ql-toolbar');
  toolbars.forEach(toolbar => {
    toolbar.style.display = toolbarsVisible ? '' : 'none';
    
    // Adjust editor container to give more space when toolbar is hidden
    const editorContainer = toolbar.closest('.note-editor-container');
    if (editorContainer) {
      const editor = editorContainer.querySelector('.ql-container');
      if (editor) {
        // Add/remove margin-top when toolbar is hidden/shown
        editor.style.marginTop = toolbarsVisible ? '' : '0';
        // Adjust editor height to fill space when toolbar is hidden
        editor.style.height = toolbarsVisible ? '' : 'calc(100% - 10px)';
      }
    }
  });
  
  // Update toggle button appearance based on state
  updateToggleButtonAppearance();
  
  // Set attribute on body for easy CSS targeting
  document.body.setAttribute('data-toolbars-hidden', !toolbarsVisible);
  
  return toolbarsVisible;
}

/**
 * Initialize toolbar visibility from saved preference
 */
export function initToolbarToggle() {
  // Check if we have a saved preference
  const savedVisibility = localStorage.getItem('toolbarsVisible');
  if (savedVisibility !== null) {
    toggleToolbars(savedVisibility === 'true');
  }
  
  // Create the global toggle button if it doesn't exist
  createGlobalToggleButton();
}

/**
 * Update the appearance of toolbar toggle button based on current state
 */
function updateToggleButtonAppearance() {
  const toggleButton = document.getElementById('globalToolbarToggle');
  if (toggleButton) {
    // Change icon and text based on toolbar visibility
    toggleButton.innerHTML = toolbarsVisible ? 
      '<span title="Hide formatting toolbars">🔼</span> Formatting Toolbars' : 
      '<span title="Show formatting toolbars">🔽</span> Formatting Toolbars';
    toggleButton.setAttribute('aria-label', toolbarsVisible ? 'Hide toolbars' : 'Show toolbars');
    toggleButton.title = toolbarsVisible ? 'Hide formatting toolbars' : 'Show formatting toolbars';
  }
}

/**
 * Create a single global toggle button in the UI
 */
function createGlobalToggleButton() {
  // Check if the button already exists
  if (document.getElementById('globalToolbarToggle')) return;
  
  // Create the button element
  const toggleButton = document.createElement('button');
  toggleButton.id = 'globalToolbarToggle';
  toggleButton.className = 'global-toolbar-toggle';
  toggleButton.title = toolbarsVisible ? 'Hide formatting toolbars' : 'Show formatting toolbars';
  toggleButton.innerHTML = toolbarsVisible ? 
     '<span title="Hide formatting toolbars">🔼</span> Formatting Toolbars' : 
    '<span title="Show formatting toolbars">🔽</span> Formatting Toolbars';

      // Add click event to toggle toolbars
  toggleButton.addEventListener('click', () => {
    toggleToolbars();
  });
 
  // Place the button above the dark mode toggle in the sidebar
  const darkModeToggle = document.querySelector('.dark-mode-toggle');
  if (darkModeToggle) {
    // create a new container for the toolbar toggle 
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'toolbar-toggle-container';

    // Add button to container 
    toggleContainer.appendChild(toggleButton);

    // Insert container before the dark mode toggle 
    darkModeToggle.parentNode.insertBefore(toggleContainer, darkModeToggle);
  } else {
    // fallback - add to notes header if dark mode toggle not found 
    const notesHeader = document.querySelector('.notes-header');
    if (notesHeader) {
      notesHeader.appendChild(toggleButton);
    }
  }
  
}
