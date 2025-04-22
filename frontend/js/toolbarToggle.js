// toolbarToggle.js - Global toolbar toggle functionality

// Flag to track global toolbar visibility state - make this accessible to the rest of the application
export let toolbarsVisible = true;

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
  
  // Update toggle switch appearance
  updateToggleSwitchAppearance();
  
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
    toolbarsVisible = savedVisibility === 'true';
  }
  
  // Create the toggle switch if it doesn't exist
  createToolbarToggleSwitch();
  
  // Apply the current visibility state
  toggleToolbars(toolbarsVisible);
}

/**
 * Get current toolbar visibility state
 * This function lets other modules check if toolbars should be visible
 */
export function getToolbarsVisible() {
  return toolbarsVisible;
}

/**
 * Create the toggle switch in the UI
 */
function createToolbarToggleSwitch() {
  // Check if the switch already exists
  if (document.querySelector('.toolbar-toggle')) return;
  
  // Create the container
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'toolbar-toggle';
  
  // Create the label
  const toggleLabel = document.createElement('span');
  toggleLabel.className = 'toolbar-label';
  toggleLabel.textContent = 'Formatting Toolbar';
  
  // Create the switch container
  const switchContainer = document.createElement('label');
  switchContainer.className = 'switch';
  
  // Create the checkbox input
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'toolbarToggle';
  checkbox.checked = toolbarsVisible;
  
  // Create the slider element
  const slider = document.createElement('span');
  slider.className = 'slider';
  
  // Assemble the switch
  switchContainer.appendChild(checkbox);
  switchContainer.appendChild(slider);
  
  // Assemble the toggle container
  toggleContainer.appendChild(toggleLabel);
  toggleContainer.appendChild(switchContainer);
  
  // Add click event to checkbox
  checkbox.addEventListener('change', () => {
    toggleToolbars(checkbox.checked);
  });
  
  // Find where to place the toggle
  const spellcheckToggle = document.querySelector('.spellcheck-toggle');
  if (spellcheckToggle) {
    // Insert after the spellcheck toggle
    spellcheckToggle.parentNode.insertBefore(toggleContainer, spellcheckToggle.nextSibling);
  } else {
    // Fallback - add near dark mode toggle
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.parentNode.insertBefore(toggleContainer, darkModeToggle);
    }
  }
  
  // Expose toggle function globally for easier debugging
  window.toggleToolbars = toggleToolbars;
}

/**
 * Update toggle switch appearance based on current state
 */
function updateToggleSwitchAppearance() {
  const toggleCheckbox = document.getElementById('toolbarToggle');
  if (toggleCheckbox) {
    toggleCheckbox.checked = toolbarsVisible;
  }
}
