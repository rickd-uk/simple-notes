// uiUtils.js - UI utility functions
import { elements } from './state.js';
import { handleNoteDelete } from './eventHandlers.js';

// Show toast notification
export function showToast(message, duration = 3000) {
  const toast = elements.toast;
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Function to physically remove all delete buttons except for expanded note
export function hideAllNoteButtons() {
  // Instead of hiding, completely detach from DOM
  document.querySelectorAll('.note:not(.expanded) .note-delete').forEach(btn => {
    if (btn.parentNode) {
      btn.parentNode.removeChild(btn);
    }
  });
}

// Function to recreate delete buttons when modals are closed
export function recreateAllNoteButtons() {
  document.querySelectorAll('.note').forEach(note => {
    // Only add if doesn't exist
    if (!note.querySelector('.note-delete')) {
      const newBtn = document.createElement('button');
      newBtn.className = 'note-delete';
      newBtn.title = 'Delete note';
      newBtn.innerHTML = '🗑️';
      newBtn.style.cssText = `
        position: absolute !important;
        top: 6px !important;
        right: 6px !important;
        bottom: auto !important;
        left: auto !important;
        z-index: 10 !important;
        background-color: rgba(255, 255, 255, 0.7) !important;
        color: #f44336 !important;
        border: none !important;
        padding: 6px !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        font-size: 18px !important;
        opacity: 0;
        width: 30px !important;
        height: 30px !important;
        line-height: 18px !important;
        text-align: center !important;
      `;
      
      const noteId = note.dataset.id;
      if (noteId) {
        newBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleNoteDelete(noteId);
        });
      }
      
      note.appendChild(newBtn);
    }
  });
}

// Show category modal with button hiding - UPDATED WITH FIX
export function showCategoryModal(isEdit = false, categoryId = null, categoryName = '', categoryIcon = '📁') {
  const {
    categoryModal,
    categoryModalHeader,
    confirmCategoryBtn,
    categoryInput,
    categoryIconInput,
    categoryEditId
  } = elements;
  
  // HIDE ALL DELETE BUTTONS
  hideAllNoteButtons();
  
  categoryModalHeader.textContent = isEdit ? 'Edit Category' : 'Add New Category';
  confirmCategoryBtn.textContent = isEdit ? 'Update' : 'Add';
  
  // Reset icon selection
  document.querySelectorAll('.icon-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  if (isEdit) {
    categoryEditId.value = categoryId;
    categoryInput.value = categoryName;
    
    // Set selected icon
    const iconElement = document.querySelector(`.icon-item[data-icon="${categoryIcon}"]`);
    if (iconElement) {
      iconElement.classList.add('selected');
      categoryIconInput.value = categoryIcon;
    } else {
      // If icon doesn't exist in our grid, select the default
      document.querySelector('.icon-item[data-icon="📁"]').classList.add('selected');
      categoryIconInput.value = '📁';
    }
  } else {
    // Default icon for new categories
    document.querySelector('.icon-item[data-icon="📁"]').classList.add('selected');
    categoryIconInput.value = '📁';
    categoryInput.value = '';
    categoryEditId.value = '';
  }
  
  // Ensure modal has high z-index and dark background
  categoryModal.style.zIndex = '9000';
  categoryModal.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
  
  // Make modal content stand out
  const modalContent = categoryModal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.zIndex = '9001';
    modalContent.style.position = 'relative';
  }
  
  categoryModal.classList.add('active');
  categoryInput.focus();
}

// Hide category modal and restore buttons - UPDATED WITH FIX
export function hideCategoryModal() {
  const {
    categoryModal,
    categoryInput,
    categoryIconInput,
    categoryEditId
  } = elements;
  
  categoryModal.classList.remove('active');
  categoryInput.value = '';
  categoryIconInput.value = '📁';
  categoryEditId.value = '';
  
  // Reset modal styles
  categoryModal.style = '';
  const modalContent = categoryModal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style = '';
  }
  
  // RESTORE ALL DELETE BUTTONS
  setTimeout(recreateAllNoteButtons, 50);
}

// Confirm dialog (returns Promise)
export function confirmDialog(message) {
  return new Promise((resolve) => {
    const result = window.confirm(message);
    resolve(result);
  });
}

// Get category name by ID
export function getCategoryName(categoryId, categories) {
  if (categoryId === 'all') {
    return 'All Notes';
  } else if (categoryId === 'uncategorized') {
    return 'Uncategorized';
  } else {
    const category = categories.find(cat => cat.id.toString() === categoryId);
    return category ? category.name : 'Unknown Category';
  }
}

// Format date for note timestamp
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Handle proper button placement when window is resized
export function updateButtonPlacement() {
  const notesHeader = document.querySelector('.notes-header');
  const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  const addNoteBtn = document.getElementById('addNoteBtn');
  
  if (bulkDeleteBtn && notesHeader && addNoteBtn) {
    if (window.innerWidth <= 768) {
      // Move to left side on mobile
      notesHeader.insertBefore(bulkDeleteBtn, notesHeader.firstChild);
    } else {
      // Move between title and add button on desktop
      notesHeader.insertBefore(bulkDeleteBtn, addNoteBtn);
    }
  }
}
