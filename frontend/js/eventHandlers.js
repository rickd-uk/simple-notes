// eventHandlers.js - Event handler functions
import { 
  getCurrentCategoryId, 
  setCurrentCategoryId,
  updateNoteInState,
  removeNoteFromState,
  addNoteToState,
  addCategoryToState,
  updateCategoryInState,
  removeCategoryFromState,
  setNotes,
  getNotes, 
  setDarkMode,
  elements
} from './state.js';
import { 
  createNote, 
  updateNote, 
  deleteNote,
  deleteAllNotesInCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  loadNotes,
  logout
} from './api.js';
import { renderNotes, renderCategories, toggleNoteExpansion } from './ui.js';
import { 
  showToast, 
  showCategoryModal, 
  hideCategoryModal, 
  confirmDialog,
  getCategoryName,
  updateButtonPlacement
} from './uiUtils.js';
import { getCategories } from './state.js';
import {
  destroyQuillEditor,
  focusQuillEditor
} from './quillEditor.js';
import { toggleDarkMode } from './darkMode.js';

// Setup all event listeners
export function setupEventListeners() {
  const {
    addNoteBtn,
    addCategoryBtn,
    categoryModal,
    categoryInput,
    cancelCategoryBtn,
    confirmCategoryBtn,
    logoutBtn,
    darkModeToggle,
  } = elements;
  
  // Add note button
  addNoteBtn.addEventListener('click', createNewNote);

  // Add category button
  addCategoryBtn.addEventListener('click', () => {
    showCategoryModal();
  });

  // Dark mode toggle
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', handleDarkModeToggle);
  }

  // Icon selection
  document.querySelectorAll('.icon-item').forEach(iconItem => {
    iconItem.addEventListener('click', () => {
      // Remove selected class from all icons
      document.querySelectorAll('.icon-item').forEach(item => {
        item.classList.remove('selected');
      });
      
      // Add selected class to clicked icon
      iconItem.classList.add('selected');
      
      // Update hidden input value
      elements.categoryIconInput.value = iconItem.dataset.icon;
    });
  });

  // Handle Enter key in category modal
  categoryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission if inside a form
      if (elements.categoryEditId.value) {
        handleCategoryUpdate();
      } else {
        handleCategoryCreate();
      }
    }
  });

  // Category modal buttons
  cancelCategoryBtn.addEventListener('click', hideCategoryModal);
  confirmCategoryBtn.addEventListener('click', () => {
    if (elements.categoryEditId.value) {
      handleCategoryUpdate();
    } else {
      handleCategoryCreate();
    }
  });

  // Close modal when clicking outside
  categoryModal.addEventListener('click', (e) => {
    if (e.target === categoryModal) {
      hideCategoryModal();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Close modal with Escape key
    if (e.key === 'Escape' && categoryModal.classList.contains('active')) {
      hideCategoryModal();
    }
    
    // Close expanded note with Escape key
    if (e.key === 'Escape') {
      const expandedNote = document.querySelector('.note.expanded');
      if (expandedNote) {
        toggleNoteExpansion(expandedNote);
        e.preventDefault(); // Prevent other escape key handlers
      }
    }
  });

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
    });
  }

  // Handle window resize
  window.addEventListener('resize', updateButtonPlacement);
}

// Handle dark mode toggle
export function handleDarkModeToggle(event) {
  const isDarkMode = event.target.checked;
  setDarkMode(isDarkMode);
  toggleDarkMode(event);
  showToast(isDarkMode ? 'Dark mode enabled' : 'Light mode enabled');
}

// Create a new note
export async function createNewNote() {
  const currentCategoryId = getCurrentCategoryId();
  const createdNote = await createNote(currentCategoryId);
  
  if (createdNote) {
    addNoteToState(createdNote);
    renderNotes();
    
    // Focus on the new note - now uses Quill
    setTimeout(() => {
      // Focus on the Quill editor of the first note
      const firstNote = document.querySelector('.note');
      if (firstNote) {
        const noteId = firstNote.dataset.id;
        focusQuillEditor(noteId);
      }
    }, 100); // Slightly longer delay to ensure Quill is fully initialized
  }
}

// Handle note input (debounced)
export function handleNoteInput(noteId, content) {
  // Update locally for immediate feedback
  const note = updateNoteInState(noteId, content);
  if (!note) return;
  
  // Debounce the API call to avoid too many requests while typing
  clearTimeout(note.saveTimeout);
  note.saveTimeout = setTimeout(async () => {
    await updateNote(noteId, content, note.category_id);
  }, 500); // Wait 500ms after typing stops
}

// Handle note deletion
export async function handleNoteDelete(noteId) {
  const success = await deleteNote(noteId);
  
  if (success) {
    // Check if deleted note was expanded 
    const expandedNote = document.querySelector('.note.expanded');
    if (expandedNote && expandedNote.dataset.id == noteId) {
      // remove expanded note from DOM 
      expandedNote.remove();

      // also remove the overlay 
      const overlay = document.querySelector('.note-overlay');
      if (overlay) {
        overlay.classList.remove('active');
      }

      // restore body scrolling 
      document.body.style.overflow = '';
    }
    
    // Clean up Quill editor instance
    destroyQuillEditor(noteId);
    
    removeNoteFromState(noteId);
    renderNotes();
    showToast('Note deleted');
  }
}

// Handle note expansion
export function handleNoteExpand(noteElement) {
  toggleNoteExpansion(noteElement);
}

// Handle category selection
export async function handleCategoryClick(newCategoryId) {
  const currentCategoryId = getCurrentCategoryId();
  if (newCategoryId === currentCategoryId) return; // Skip if already active
  
  setCurrentCategoryId(newCategoryId);
  document.querySelectorAll('.category').forEach(c => c.classList.remove('active'));
  document.querySelector(`.category[data-id="${newCategoryId}"]`)?.classList.add('active');
  
  await loadNotes();
  renderCategories(); // Update header

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Handle category edit
export function handleCategoryEdit(categoryId) {
  const categories = getCategories();
  const category = categories.find(cat => cat.id.toString() === categoryId);
  
  if (category) {
    showCategoryModal(true, categoryId, category.name, category.icon);
  }
}

// Handle category delete
export async function handleCategoryDelete(categoryId) {
  const categories = getCategories();
  const categoryName = getCategoryName(categoryId, categories);
  
  const confirmed = await confirmDialog(
    `Are you sure you want to delete "${categoryName}"? Notes will be moved to Uncategorized.`
  );
  
  if (confirmed) {
    const success = await deleteCategory(categoryId);
    
    if (success) {
      removeCategoryFromState(categoryId);
      
      // If current category is being deleted, switch to all notes
      if (getCurrentCategoryId() === categoryId) {
        setCurrentCategoryId('all');
      }
      
      await loadNotes(); // Reload notes to get updated category assignments
      renderCategories();
      showToast('Category deleted');
    }
  }
}

// Handle bulk delete of notes
export async function handleBulkDelete() {
  const categoryId = getCurrentCategoryId();
  const categories = getCategories();
  const categoryName = getCategoryName(categoryId, categories);
  
  const confirmed = await confirmDialog(
    `Are you sure you want to delete ALL notes in "${categoryName}"? This action cannot be undone.`
  );
  
  if (confirmed) {
    // If there are no notes, show message and return
    if (getNotes().length === 0) {
      showToast('No notes to delete');
      return;
    }
    
    // Show loading message
    showToast('Deleting notes...');
    
    const result = await deleteAllNotesInCategory(categoryId);
    
    if (!result.error) {
      // Clean up all Quill editor instances for the notes being deleted
      const notes = getNotes();
      notes.forEach(note => {
        destroyQuillEditor(note.id);
      });
      
      // Clear notes array
      setNotes([]);
      
      // Check if any notes were expanded
      const expandedNote = document.querySelector('.note.expanded');
      if (expandedNote) {
        // Remove expanded note from DOM
        expandedNote.remove();
        
        // Also remove the overlay
        const overlay = document.querySelector('.note-overlay');
        if (overlay) {
          overlay.classList.remove('active');
        }
        
        // Restore body scrolling
        document.body.style.overflow = '';
      }
      
      // Render empty notes container
      renderNotes();
      
      // Show success message with count if available
      if (result.count !== undefined) {
        showToast(`Deleted ${result.count} notes from "${categoryName}"`);
      } else {
        showToast(`All notes in "${categoryName}" deleted`);
      }
    }
  }
}

// Handle category creation
export async function handleCategoryCreate() {
  const name = elements.categoryInput.value.trim();
  let icon = elements.categoryIconInput.value.trim();
  
  if (!name) {
    showToast('Please enter a category name');
    return;
  }
  
  // Default icon if none provided
  if (!icon) {
    icon = '📁';
  }
  
  const newCategory = await createCategory(name, icon);
  
  if (newCategory) {
    addCategoryToState(newCategory);
    renderCategories();
    hideCategoryModal();
    showToast('Category added');
  }
}

// Handle category update
export async function handleCategoryUpdate() {
  const id = elements.categoryEditId.value;
  const name = elements.categoryInput.value.trim();
  let icon = elements.categoryIconInput.value.trim();
  
  if (!name) {
    showToast('Please enter a category name');
    return;
  }
  
  // Default icon if none provided
  if (!icon) {
    icon = '📁';
  }
  
  const updatedCategory = await updateCategory(id, name, icon);
  
  if (updatedCategory) {
    updateCategoryInState(id, updatedCategory);
    renderCategories();
    hideCategoryModal();
    showToast('Category updated');
  }
}
