// categoryNameLimit.js - Limit category name length

/**
 * Limits category name length and adds validation
 * Add this file to your project and include it in your index.html
 */

document.addEventListener('DOMContentLoaded', () => {
  // Constants
  const MAX_CATEGORY_NAME_LENGTH = 20; // Maximum length for category names
  
  // Function to add validation to the category input field
  function setupCategoryNameValidation() {
    const categoryInput = document.getElementById('categoryInput');
    const confirmCategoryBtn = document.getElementById('confirmCategoryBtn');
    
    if (!categoryInput || !confirmCategoryBtn) return;
    
    // Add maxlength attribute to the input field
    categoryInput.setAttribute('maxlength', MAX_CATEGORY_NAME_LENGTH);
    
    // Add counter below the input
    const counterDiv = document.createElement('div');
    counterDiv.className = 'character-counter';
    counterDiv.style.cssText = 'font-size: 12px; color: #757575; margin-top: -15px; margin-bottom: 15px; text-align: right;';
    categoryInput.parentNode.insertBefore(counterDiv, categoryInput.nextSibling);
    
    // Update counter on input
    categoryInput.addEventListener('input', () => {
      const currentLength = categoryInput.value.length;
      const remaining = MAX_CATEGORY_NAME_LENGTH - currentLength;
      counterDiv.textContent = `${currentLength}/${MAX_CATEGORY_NAME_LENGTH}`;
      
      // Change counter color when approaching limit
      if (currentLength > MAX_CATEGORY_NAME_LENGTH * 0.8) {
        counterDiv.style.color = '#f44336';
      } else {
        counterDiv.style.color = '#757575';
      }
    });
    
    // Initial counter update
    const initialLength = categoryInput.value.length;
    counterDiv.textContent = `${initialLength}/${MAX_CATEGORY_NAME_LENGTH}`;
  }
  
  // Watch for category modal opening
  const categoryModal = document.getElementById('categoryModal');
  if (categoryModal) {
    // Use MutationObserver to detect when modal becomes active
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && 
            categoryModal.classList.contains('active')) {
          setupCategoryNameValidation();
        }
      });
    });
    
    observer.observe(categoryModal, { attributes: true });
  }
  
  // Patch the handleCategoryCreate and handleCategoryUpdate functions
  // This is done by creating wrapper functions that intercept and modify the category name
  patchCategoryHandlers();
});

// Function to patch the existing category handlers
function patchCategoryHandlers() {
  // Wait for the main JS to load and define the functions
  setTimeout(() => {
    // Try to access the event handlers module
    try {
      // For module-based code, we need to patch at runtime
      const addCategoryBtn = document.getElementById('addCategoryBtn');
      const confirmCategoryBtn = document.getElementById('confirmCategoryBtn');
      
      if (confirmCategoryBtn) {
        // Store the original click handler
        const originalClickHandler = confirmCategoryBtn.onclick;
        
        // Replace with our patched handler
        confirmCategoryBtn.onclick = function(e) {
          // Trim and limit the category input value
          const categoryInput = document.getElementById('categoryInput');
          if (categoryInput) {
            categoryInput.value = categoryInput.value.trim().substring(0, 20);
          }
          
          // Call the original handler if it exists
          if (originalClickHandler) {
            return originalClickHandler.call(this, e);
          }
        };
      }
    } catch (error) {
      console.error("Error patching category handlers:", error);
    }
  }, 1000); // Wait 1 second for everything to initialize
}
