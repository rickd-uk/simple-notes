// noteCategoryManager.js - Simplified category selection modal

import { getCategories, getCurrentCategoryId } from './state.js';
import { updateNote } from './api.js';
import { showToast } from './uiUtils.js';
import { loadNotes } from './api.js';
import { getQuillEditor } from './quillEditor.js'; // Import the function to get Quill editors

// Store the current note being edited for category
let currentEditNoteId = null;


// Show the category modal for selecting a note's category
export function showNoteCategoryModal(noteId) {
  // Store the note ID being edited
  currentEditNoteId = noteId;

  const noteElement = document.querySelector(`.note[data-id="${noteId}"]`);
  if (!noteElement) return;

  const categorySelector = noteElement.querySelector('.note-category');
  const currentNoteCategoryId = categorySelector ? categorySelector.dataset.categoryId : 'null';

  const categoryModal = document.getElementById('categoryModal');
  const categoryModalHeader = document.getElementById('categoryModalHeader');
  const confirmCategoryBtn = document.getElementById('confirmCategoryBtn');
  const cancelCategoryBtn = document.getElementById('cancelCategoryBtn'); // Make sure you have this ID on your cancel button

  // Set modal title and mode
  categoryModalHeader.textContent = 'Choose Category';
  categoryModal.dataset.mode = 'note-category'; // Use this attribute to potentially style/hide elements via CSS too

  // --- Hide elements not needed for category selection ---
  document.getElementById('categoryEditId').value = ''; // Clear edit ID if reusing modal
  const categoryInput = document.getElementById('categoryInput');
  if(categoryInput) categoryInput.style.display = 'none'; // Hide category name input
  const iconSelector = document.querySelector('.icon-selector');
  if (iconSelector) iconSelector.style.display = 'none'; // Hide icon selector

  // --- Hide the 'Confirm' button specifically for this mode ---
  if (confirmCategoryBtn) confirmCategoryBtn.style.display = 'none';

  // Create/find the category selection list container
  let categorySelectionDiv = document.getElementById('categorySelectionList');
  if (!categorySelectionDiv) {
    categorySelectionDiv = document.createElement('div');
    categorySelectionDiv.id = 'categorySelectionList';
    categorySelectionDiv.className = 'category-selection-list'; // Add class for styling

    const modalContent = categoryModal.querySelector('.modal-content');
    const modalActions = categoryModal.querySelector('.modal-actions'); // Find actions div
    if (modalActions) {
       modalContent.insertBefore(categorySelectionDiv, modalActions); // Insert list before buttons
    } else {
       modalContent.appendChild(categorySelectionDiv); // Fallback if no actions div
    }
  }

  // --- Generate the category selection list (Revised Logic) ---
  const categories = getCategories();
  let categoryListHTML = '';

  // Always add "Uncategorized" option and mark if current
  const isCurrentlyUncategorized = !currentNoteCategoryId || currentNoteCategoryId === 'null';
  categoryListHTML += `
    <div class="category-option${isCurrentlyUncategorized ? ' selected' : ''}" data-category-id="null">
      <div class="category-option-icon">📌</div>
      <div class="category-option-name">Uncategorized</div>
    </div>
  `;

  // Add all available custom categories and mark if current
  categories.forEach(category => {
    const categoryId = category.id.toString();
    const isCurrent = categoryId === currentNoteCategoryId;
    categoryListHTML += `
      <div class="category-option${isCurrent ? ' selected' : ''}" data-category-id="${categoryId}">
        <div class="category-option-icon">${category.icon || '📁'}</div>
        <div class="category-option-name">${category.name}</div>
      </div>
    `;
  });

  categorySelectionDiv.innerHTML = categoryListHTML;

  // --- Add event listeners to category options (Revised Logic) ---
  document.querySelectorAll('.category-option').forEach(option => {
    option.addEventListener('click', async () => { // Make listener async
      if (!currentEditNoteId) return; // Safety check

      const selectedCategoryId = option.dataset.categoryId;
      const noteIdToUpdate = currentEditNoteId; // Store ID before modal closes

      // --- Perform action immediately ---
      hideNoteCategoryModal(); // Close the modal

      try {
        console.log(`Attempting to change note ${noteIdToUpdate} to category ${selectedCategoryId}`);
        await changeNoteCategory(noteIdToUpdate, selectedCategoryId); // Change the category
      } catch (error) {
        console.error("Failed to change category on click:", error);
        showToast('Error changing category'); // Show feedback
      }
    });
  });

  // Show the modal
  categoryModal.classList.add('active');
}

// Handle confirm button click in category selection mode
export async function handleNoteCategoryConfirm() {
  const categoryModal = document.getElementById('categoryModal');
  // Check if NOT in note-category mode OR if currentEditNoteId is null
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
  const confirmCategoryBtn = document.getElementById('confirmCategoryBtn'); // Get button
  const categoryInput = document.getElementById('categoryInput'); // Get input

  if (!categoryModal) return; // Prevent errors if modal not found

  categoryModal.classList.remove('active');
  categoryModal.dataset.mode = ''; // Clear the mode

  // Restore potentially hidden elements for other modal uses (Add/Edit Category)
  if(categoryInput) categoryInput.style.display = '';
  if (iconSelector) iconSelector.style.display = '';

  // --- Restore the confirm button ---
  if(confirmCategoryBtn) {
      confirmCategoryBtn.style.display = ''; // Make it visible again
      confirmCategoryBtn.disabled = false; // Ensure it's enabled
  }

  // Remove the category selection list content
  const categorySelectionDiv = document.getElementById('categorySelectionList');
  if (categorySelectionDiv) {
    categorySelectionDiv.innerHTML = ''; // Clear the list
  }

  // Clear the current edit note ID - IMPORTANT
  currentEditNoteId = null;
}


// Change a note's category
export async function changeNoteCategory(noteId, categoryId) {
  try {
    // Get current content from the note
    const noteElement = document.querySelector(`.note[data-id="${noteId}"]`);
    if (!noteElement) return false;
    
    // Get content from Quill editor if available - FIXED: Use the proper function to get Quill editors
    let content = '';
    const quillEditor = getQuillEditor(noteId); // Use our imported function to get the editor
    
    if (quillEditor) {
      content = quillEditor.root.innerHTML;
    } else {
      // Fallback to textarea content
      const textarea = noteElement.querySelector('.note-content');
      content = textarea ? textarea.value : '';
    }
    
    // Make sure we have content
    if (!content || content.trim() === '') {
      console.warn('Note content appears to be empty, trying to preserve existing content');
      // Try to get content from note's data attribute as a last resort
      const contentPlaceholder = noteElement.querySelector('.note-content-placeholder');
      if (contentPlaceholder && contentPlaceholder.dataset.content) {
        content = decodeURIComponent(contentPlaceholder.dataset.content);
      }
    }
    
    console.log(`Updating note ${noteId} with content length: ${content.length}`);
    
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
