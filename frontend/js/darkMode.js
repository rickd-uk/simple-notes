// darkMode.js - Dark mode functionality

// Initialize dark mode from saved preference
export function initDarkMode() {
    // Check if user preference is saved
    const darkModeEnabled = localStorage.getItem('darkMode') === 'true';
    
    // Apply initial state
    if (darkModeEnabled) {
        document.body.classList.add('dark-mode');
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }
    }
    
    // Set up event listener for toggle
    setupDarkModeToggle();
}

// Set up dark mode toggle event listener
function setupDarkModeToggle() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', toggleDarkMode);
    }
}

// Toggle dark mode on/off
export function toggleDarkMode(event) {
    const isDarkMode = event ? event.target.checked : !document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
    
    // Update editor colors if needed
    updateEditorTheme(isDarkMode);
}

// Update Quill editor theme for dark mode
function updateEditorTheme(isDarkMode) {
    // Quill doesn't have built-in theming, so we need to adjust CSS variables
    // The CSS rules we added in dark-mode.css will handle most styling
    
    // You can add additional dynamic styling here if needed
    // For example, you might want to dynamically change Quill's content colors
    
    // Refresh Quill instances by forcing a redraw
    document.querySelectorAll('.ql-editor').forEach(editor => {
        // Trigger a redraw by briefly changing a property
        const originalDisplay = editor.style.display;
        editor.style.display = 'none';
        // Force reflow
        editor.offsetHeight;
        editor.style.display = originalDisplay;
    });
}
