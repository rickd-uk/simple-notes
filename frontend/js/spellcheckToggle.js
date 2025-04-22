// spellcheckToggle.js - Toggle spell checking in editors

// Store spell check state - off by default in main view
let spellcheckEnabled = false;

/**
 * Initialize spell check functionality
 */
export function initSpellcheckToggle() {
  // Check if we have a saved preference (default to false if not set)
  const savedState = localStorage.getItem('spellcheckEnabled');
  if (savedState !== null) {
    spellcheckEnabled = savedState === 'true';
  }
  
  // Create the toggle switch if it doesn't exist
  createSpellcheckToggleSwitch();
  
  // Apply current state to all editors
  applySpellcheckState();
}

/**
 * Toggle spell checking on/off
 * @param {boolean} enabled - Optional explicit state. If not provided, toggles current state.
 * @returns {boolean} The new enabled state
 */
export function toggleSpellcheck(enabled) {
  // If no explicit state provided, toggle current state
  if (enabled === undefined) {
    spellcheckEnabled = !spellcheckEnabled;
  } else {
    spellcheckEnabled = enabled;
  }
  
  // Store state in localStorage for persistence
  localStorage.setItem('spellcheckEnabled', spellcheckEnabled.toString());
  
  // Apply to all current editors
  applySpellcheckState();
  
  // Update switch appearance
  updateToggleSwitchAppearance();
  
  return spellcheckEnabled;
}

/**
 * Get current spell check state
 * @returns {boolean} Whether spell checking is enabled
 */
export function isSpellcheckEnabled() {
  return spellcheckEnabled;
}

/**
 * Apply current spell check state to all editors
 */
export function applySpellcheckState() {
  // Set attribute on document body for CSS targeting
  document.body.setAttribute('data-spellcheck', spellcheckEnabled ? 'true' : 'false');
  
  // Apply to all Quill editor containers
  const editorContainers = document.querySelectorAll('.quill-editor');
  editorContainers.forEach(container => {
    // Only apply in regular view, not in modals
    const isInModal = !!container.closest('.modal');
    
    if (!isInModal) {
      container.setAttribute('spellcheck', spellcheckEnabled ? 'true' : 'false');
    }
  });
  
  // Apply to all editor roots
  const editorRoots = document.querySelectorAll('.ql-editor');
  editorRoots.forEach(root => {
    // Only apply in regular view, not in modals
    const isInModal = !!root.closest('.modal');
    
    if (!isInModal) {
      // Store current selection (cursor position)
      let quillInstance = null;
      let selection = null;
      let editorId = root.closest('.note')?.dataset?.id;
      
      if (editorId) {
        // Find the Quill instance from the global space if available
        if (window.getAllQuillEditors) {
          const editors = window.getAllQuillEditors();
          quillInstance = editors[editorId];
          if (quillInstance) {
            selection = quillInstance.getSelection();
          }
        }
      }
      
      // Set spellcheck attribute
      root.setAttribute('spellcheck', spellcheckEnabled ? 'true' : 'false');
      
      // For Chrome/Firefox we need to do more to make it take effect immediately
      if (navigator.userAgent.indexOf('Chrome') > -1 || navigator.userAgent.indexOf('Firefox') > -1) {
        // Apply a subtle style change to force redraw without affecting content
        root.style.textRendering = spellcheckEnabled ? 'auto' : 'optimizeSpeed';
        setTimeout(() => {
          root.style.textRendering = '';
          
          // Restore selection if we had it
          if (quillInstance && selection) {
            quillInstance.setSelection(selection);
          }
        }, 10);
      }
    }
  });
}

/**
 * Create the toggle switch in the UI
 */
function createSpellcheckToggleSwitch() {
  // Check if the switch already exists
  if (document.querySelector('.spellcheck-toggle')) return;
  
  // Create the container
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'spellcheck-toggle';
  
  // Create the label
  const toggleLabel = document.createElement('span');
  toggleLabel.className = 'spellcheck-label';
  toggleLabel.textContent = 'Spell Check';
  
  // Create the switch container
  const switchContainer = document.createElement('label');
  switchContainer.className = 'switch';
  
  // Create the checkbox input
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'spellcheckToggle';
  checkbox.checked = spellcheckEnabled;
  
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
    toggleSpellcheck(checkbox.checked);
  });
  
  // Insert before the dark mode toggle
  const darkModeToggle = document.querySelector('.dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.parentNode.insertBefore(toggleContainer, darkModeToggle);
  }
  
  // Expose the toggle function globally for easier debugging
  window.toggleSpellcheck = toggleSpellcheck;
}

/**
 * Update toggle switch appearance based on current state
 */
function updateToggleSwitchAppearance() {
  const toggleCheckbox = document.getElementById('spellcheckToggle');
  if (toggleCheckbox) {
    toggleCheckbox.checked = spellcheckEnabled;
  }
}

/**
 * Apply spell check state to a newly created editor
 * @param {string} editorId - The ID of the editor to update
 */
export function applySpellcheckToEditor(editorId) {
  const editorElement = document.querySelector(`.note[data-id="${editorId}"] .quill-editor`);
  const rootElement = document.querySelector(`.note[data-id="${editorId}"] .ql-editor`);
  
  if (editorElement) {
    // Check if in modal
    const isInModal = !!editorElement.closest('.modal');
    if (!isInModal) {
      editorElement.setAttribute('spellcheck', spellcheckEnabled ? 'true' : 'false');
    }
  }
  
  if (rootElement) {
    // Check if in modal
    const isInModal = !!rootElement.closest('.modal');
    if (!isInModal) {
      rootElement.setAttribute('spellcheck', spellcheckEnabled ? 'true' : 'false');
    }
  }
}
