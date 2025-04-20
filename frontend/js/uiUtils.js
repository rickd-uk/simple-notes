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

// Confirm dialog with custom modal (returns Promise)
export function confirmDialog(message, headerText = 'Confirm Delete', confirmBtnText = 'Delete All') {
  return new Promise((resolve) => {
    // Get modal elements
    const confirmModal = document.getElementById('confirmModal');
    const messageEl = document.getElementById('confirmModalMessage');
    const headerEl = document.getElementById('confirmModalHeader');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const cancelBtn = document.getElementById('cancelConfirmBtn');
    
    // Set content
    messageEl.textContent = message;
    headerEl.textContent = headerText;
    confirmBtn.textContent = confirmBtnText;
    
    // Show the modal
    confirmModal.classList.add('active');
    
    // Set up event listeners
    const handleCancel = () => {
      cleanup();
      resolve(false);
    };
    
    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };
    
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter') {
        handleConfirm();
      }
    };
    
    const handleOutsideClick = (e) => {
      if (e.target === confirmModal) {
        handleCancel();
      }
    };
    
    // Cleanup function to remove event listeners
    const cleanup = () => {
      confirmModal.classList.remove('active');
      cancelBtn.removeEventListener('click', handleCancel);
      confirmBtn.removeEventListener('click', handleConfirm);
      document.removeEventListener('keydown', handleKeydown);
      confirmModal.removeEventListener('click', handleOutsideClick);
    };
    
    // Add event listeners
    cancelBtn.addEventListener('click', handleCancel);
    confirmBtn.addEventListener('click', handleConfirm);
    document.addEventListener('keydown', handleKeydown);
    confirmModal.addEventListener('click', handleOutsideClick);
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
