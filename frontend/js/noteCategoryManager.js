// noteCategoryManager.js - Simplified category selection modal

import { getCategories, getCurrentCategoryId } from './state.js';
import { updateNote } from './api.js';
import { showToast } from './uiUtils.js';
import { loadNotes } from './api.js';

// Store the current note being edited for category
let currentEditNoteId = null;

// Show the category modal for selecting a note's category
export function showNoteCategoryModal(noteId) {
  // Store the note ID being edited
  currentEditNoteId = noteId;
  
  // Get the note element
  const noteElement = document.querySelector(`.note[data-id="${noteId}"]`);
  if (!noteElement) return;
  
  // Get current category of the note
  const categorySelector = noteElement.querySelector('.note-category');
  const currentCategoryId = categorySelector ? categorySelector.dataset.categoryId : 'null';
  
  // Get modal elements
  const categoryModal = document.getElementById('categoryModal');
  const categoryModalHeader = document.getElementById('categoryModalHeader');
  const confirmCategoryBtn = document.getElementById('confirmCategoryBtn');
  
  // Set modal for category selection mode
  categoryModalHeader.textContent = 'Choose Category';
  confirmCategoryBtn.textContent = 'Select';
  
  // Custom attribute to identify this as note category selection
  categoryModal.dataset.mode = 'note-category';
  
  // Hide elements not needed for category selection
  document.getElementById('categoryEditId').value = '';
  document.getElementById('categoryInput').style.display = 'none';
  
  // Hide the icon selector section
  const iconSelector = document.querySelector('.icon-selector');
  if (iconSelector) {
    iconSelector.style.display = 'none';
  }
  
  // Create the category selection list
  let categorySelectionDiv = document.getElementById('categorySelectionList');
  if (!categorySelectionDiv) {
    categorySelectionDiv = document.createElement('div');
    categorySelectionDiv.id = 'categorySelectionList';
    categorySelectionDiv.className = 'category-selection-list';
    
    // Insert at the beginning of the modal content
    const modalContent = categoryModal.querySelector('.modal-content');
    modalContent.insertBefore(categorySelectionDiv, modalContent.firstChild);
  }
  
  // Generate the category selection list
  const categories = getCategories();
  
  // Start with uncategorized option (only if not already uncategorized)
  let categoryListHTML = '';
  if (currentCategoryId !== 'null') {
    categoryListHTML += `
      <div class="category-option" data-category-id="null">
        <div class="category-option-icon">📌</div>
        <div class="category-option-name">Uncategorized</div>
      </div>
    `;
  }
  
  // Add all custom categories (except the current one)
  categories.forEach(category => {
    const categoryId = category.id.toString();
    if (categoryId !== currentCategoryId) {
      categoryListHTML += `
        <div class="category-option" data-category-id="${categoryId}">
          <div class="category-option-icon">${category.icon || '📁'}</div>
          <div class="category-option-name">${category.name}</div>
        </div>
      `;
    }
  });
  
  // Handle the case where there are no other categories
  if (categoryListHTML === '') {
    categoryListHTML = `
      <div class="no-categories-message">
        No other categories available. Create a category first.
      </div>
    `;
    confirmCategoryBtn.disabled = true;
  } else {
    confirmCategoryBtn.disabled = false;
  }
  
  categorySelectionDiv.innerHTML = categoryListHTML;
  
  // Add event listeners to category options
  setTimeout(() => {
    document.querySelectorAll('.category-option').forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected class from all options
        document.querySelectorAll('.category-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Store the selected category ID for reference
        categoryModal.dataset.selectedCategoryId = option.dataset.categoryId;
      });
    });
    
    // Select the first option by default
    const firstOption = document.querySelector('.category-option');
    if (firstOption) {
      firstOption.click();
    }
  }, 10);
  
  // Show the modal
  categoryModal.classList.add('active');
}

// Handle confirm button click in category selection mode
export async function handleNoteCategoryConfirm() {
  const categoryModal = document.getElementById('categoryModal');
  if (!currentEditNoteId || !categoryModal.dataset.mode === 'note-category') return;
  
  // Get the selected category
  const selectedCategoryId = categoryModal.dataset.selectedCategoryId;
  if (!selectedCategoryId) {
    hideNoteCategoryModal();
    return;
  }
  
  const noteId = currentEditNoteId;
  
  // Close the modal
  hideNoteCategoryModal();
  
  // Change the note's category
  await changeNoteCategory(noteId, selectedCategoryId);
}

// Hide the category modal after selection
export function hideNoteCategoryModal() {
  const categoryModal = document.getElementById('categoryModal');
  const iconSelector = document.querySelector('.icon-selector');
  
  categoryModal.classList.remove('active');
  categoryModal.dataset.mode = '';
  categoryModal.dataset.selectedCategoryId = '';
  
  // Restore hidden elements
  document.getElementById('categoryInput').style.display = '';
  if (iconSelector) {
    iconSelector.style.display = '';
  }
  
  // Remove the category selection list
  const categorySelectionDiv = document.getElementById('categorySelectionList');
  if (categorySelectionDiv) {
    categorySelectionDiv.innerHTML = '';
  }
  
  // Re-enable the confirm button
  document.getElementById('confirmCategoryBtn').disabled = false;
  
  // Clear the current edit note ID
  currentEditNoteId = null;
}

// Change a note's category
export async function changeNoteCategory(noteId, categoryId) {
  try {
    // Get current content from the note
    const noteElement = document.querySelector(`.note[data-id="${noteId}"]`);
    if (!noteElement) return false;
    
    // Get content from Quill editor if available
    let content = '';
    const quillEditor = window.quillEditors && window.quillEditors[noteId];
    
    if (quillEditor) {
      content = quillEditor.root.innerHTML;
    } else {
      // Fallback to textarea content
      const textarea = noteElement.querySelector('.note-content');
      content = textarea ? textarea.value : '';
    }
    
    // Prepare the category ID for the API
    // null for uncategorized, actual ID for categories
    const apiCategoryId = categoryId === 'null' ? null : categoryId;
    
    // Call API to update the note with new category
    await updateNote(noteId, content, apiCategoryId);
    
    // Update the note category display
    updateNoteCategoryDisplay(noteElement, categoryId);
    
    // If we're in a specific category view and the note no longer belongs,
    // we may need to remove it from the current view
    const currentViewCategory = getCurrentCategoryId();
    
    if (currentViewCategory !== 'all' && 
        currentViewCategory !== categoryId && 
        !(currentViewCategory === 'uncategorized' && (!categoryId || categoryId === 'null'))) {
      
      // If note is expanded, collapse it first
      if (noteElement.classList.contains('expanded')) {
        // Find toggle function from global scope
        const toggleFn = window.toggleNoteExpansion;
        if (typeof toggleFn === 'function') {
          toggleFn(noteElement);
        }
      }
      
      // Apply a fade-out effect before removal
      noteElement.style.transition = 'opacity 0.5s';
      noteElement.style.opacity = '0';
      
      // Remove note after animation completes
      setTimeout(() => {
        if (noteElement.parentNode) {
          noteElement.parentNode.removeChild(noteElement);
          
          // If this was the last note, reload notes to show empty state
          const notesContainer = document.getElementById('notesContainer');
          if (notesContainer && !notesContainer.querySelector('.note')) {
            loadNotes();
          }
        }
      }, 500);
    }
    
    // Get category name for success message
    let categoryName = 'Uncategorized';
    if (categoryId && categoryId !== 'null') {
      const categories = getCategories();
      const category = categories.find(cat => cat.id.toString() === categoryId);
      if (category) {
        categoryName = category.name;
      }
    }
    
    // Show success toast
    showToast(`Note moved to ${categoryName}`);
    
    return true;
  } catch (error) {
    console.error('Error changing note category:', error);
    showToast('Error changing category');
    return false;
  }
}

// Update a note's category display in the UI
// Fixed update category display function
export function updateNoteCategoryDisplay(noteElement, categoryId) {
  const categories = getCategories();
  const noteCategoryElement = noteElement.querySelector('.note-category');
  
  if (!noteCategoryElement) return;
  
  let categoryName, categoryIcon;
  
  if (!categoryId || categoryId === 'null') {
    categoryName = 'Uncategorized';
    categoryIcon = '📌';
  } else {
    const category = categories.find(c => c.id.toString() === categoryId);
    categoryName = category ? category.name : 'Uncategorized';
    categoryIcon = category ? category.icon : '📌';
  }
  
  noteCategoryElement.innerHTML = `
    <div class="note-category-icon">${categoryIcon}</div>
    <!-- <div class="note-category-name">${categoryName}</div> -->
  `;
  
  // Update data attribute for reference
  noteCategoryElement.dataset.categoryId = categoryId || 'null';
}
