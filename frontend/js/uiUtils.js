// uiUtils.js - UI utility functions
import { elements } from './state.js';

// Show toast notification
export function showToast(message, duration = 3000) {
  const toast = elements.toast;
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// Show category modal
export function showCategoryModal(isEdit = false, categoryId = null, categoryName = '', categoryIcon = '📁') {
  const {
    categoryModal,
    categoryModalHeader,
    confirmCategoryBtn,
    categoryInput,
    categoryIconInput,
    categoryEditId
  } = elements;
  
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
  
  categoryModal.classList.add('active');
  categoryInput.focus();
}

// Hide category modal
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
