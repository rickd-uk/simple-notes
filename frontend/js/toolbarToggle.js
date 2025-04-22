// toolbarToggle.js - Global toolbar toggle functionality

// Flag to track global toolbar visibility state - make this accessible to the rest of the application
export let toolbarsVisible = false;

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
    toolbarsVisible = savedVisibility === 'true';
    toggleToolbars(toolbarsVisible);
  } else {
    toolbarsVisible = false;
  localStorage.setItem('toolbarsVisible', 'false');
  toggleToolbars(false);
  }
  
  // Create the global toggle buttons in the main header
  createMainViewToggles();
}

/**
 * Get current toolbar visibility state
 * This function lets other modules check if toolbars should be visible
 */
export function getToolbarsVisible() {
  return toolbarsVisible;
}

/**
 * Set toolbar visibility to a specific state
 * @param {boolean} visible - Whether toolbars should be visible
 */
export function setToolbarsVisible(visible) {
  if (visible !== toolbarsVisible) {
    toggleToolbars(visible);
  }
}

/**
 * Update the appearance of toolbar toggle button based on current state
 */
function updateToggleButtonAppearance() {
  // Update main toolbar toggle button
  const toolbarToggle = document.getElementById('mainToolbarToggle');
  if (toolbarToggle) {
    toolbarToggle.classList.toggle('active', toolbarsVisible);
  }
  
  // Update expanded note toolbar toggle button
  const expandedControls = document.getElementById('expandedNoteControls');
  if (expandedControls) {
    const expandedToggle = expandedControls.querySelector('button:first-child');
    if (expandedToggle) {
      expandedToggle.classList.toggle('active', toolbarsVisible);
    }
  }
}

/**
 * Create toggle buttons in the main view header
 */
/**
 * Create toggle buttons in the main view header
 */
function createMainViewToggles() {
  // Get the notes header where we'll add the toggles
  const notesHeader = document.querySelector('.notes-header');
  const addNoteBtn = document.getElementById('addNoteBtn');
  
  if (!notesHeader || !addNoteBtn) return;
  
  // Create a container for the control buttons to group them
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'header-controls-group';
  controlsContainer.id = 'headerControlsGroup';
  
  // Create toolbar toggle button
  const toolbarToggle = document.createElement('button');
  toolbarToggle.id = 'mainToolbarToggle';
  toolbarToggle.className = `header-control-btn ${toolbarsVisible ? 'active' : ''}`;
  toolbarToggle.title = 'Toggle Formatting Toolbar';
  toolbarToggle.innerHTML = '<span style="font-weight: bold;">T</span>';
  
  // Add click handler
  toolbarToggle.addEventListener('click', () => {
    toggleToolbars();
  });
  
  // Add toolbar toggle to container
  controlsContainer.appendChild(toolbarToggle);
  
  // Import spell check functions and add the spell check toggle
  import('./noteControls.js').then(module => {
    const spellCheckToggle = document.createElement('button');
    spellCheckToggle.id = 'mainSpellCheckToggle';
    spellCheckToggle.className = `header-control-btn ${module.isSpellCheckEnabled() ? 'active' : ''}`;
    spellCheckToggle.title = 'Toggle Spell Check';
    spellCheckToggle.innerHTML = '<span style="font-weight: bold;">Aa</span>';
    
    // Add click handler
    spellCheckToggle.addEventListener('click', () => {
      const newState = module.toggleSpellCheck();
      spellCheckToggle.classList.toggle('active', newState);
    });
    
    // Add spell check toggle to container
    controlsContainer.appendChild(spellCheckToggle);
    
    // Optional: Add search button
    const searchButton = document.createElement('button');
    searchButton.id = 'searchButton';
    searchButton.className = 'header-control-btn';
    searchButton.title = 'Search Notes';
    searchButton.innerHTML = '<span>🔍</span>';
    
    // Add click handler for search button
    searchButton.addEventListener('click', () => {
      // Placeholder for search functionality
      alert('Search functionality to be implemented');
    });
    
    // Add search button to container
    controlsContainer.appendChild(searchButton);
    
    // Optional: Add sort button
    const sortButton = document.createElement('button');
    sortButton.id = 'sortButton';
    sortButton.className = 'header-control-btn';
    sortButton.title = 'Sort Notes';
    sortButton.innerHTML = '<span>↕️</span>';
    
    // Add click handler for sort button
    sortButton.addEventListener('click', () => {
      // Placeholder for sort functionality
      alert('Sort functionality to be implemented');
    });
    
    // Add sort button to container
    controlsContainer.appendChild(sortButton);
    
    // Insert the container before the add note button
    notesHeader.insertBefore(controlsContainer, addNoteBtn);
  });
}
