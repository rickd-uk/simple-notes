// ui.js - UI rendering functions with toolbar toggle integration
import { 
  getNotes, 
  getCategories, 
  getCurrentCategoryId, 
  elements 
} from './state.js';
import { 
  createNewNote, 
  handleNoteInput, 
  handleNoteDelete, 
  handleNoteExpand,
  handleCategoryClick,
  handleCategoryEdit,
  handleCategoryDelete,
  handleBulkDelete
} from './eventHandlers.js';
import {
  createQuillEditor,
  clearQuillEditors,
  focusQuillEditor,
  updateQuillEditorLayout
} from './quillEditor.js';
import { hideAllNoteButtons, recreateAllNoteButtons } from './uiUtils.js';
import { showNoteCategoryModal } from './noteCategoryManager.js';

// Render notes in the UI
export function renderNotes() {
  // Clear existing Quill editors
  clearQuillEditors();
  
  const notes = getNotes();
  const notesContainer = elements.notesContainer;
  const categories = getCategories();
   
  if (notes.length === 0) {
    notesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-message">No notes in this category</div>
        <button class="empty-action" id="emptyAddNoteBtn">Create a note</button>
      </div>
    `;
    document.getElementById('emptyAddNoteBtn').addEventListener('click', createNewNote); 
  } else {
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    notes.forEach(note => {
      const noteElement = document.createElement('div');
      noteElement.className = 'note';
      noteElement.dataset.id = note.id;
      
      const date = new Date(note.updated_at);
      const formattedDate = date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Get category information for this note
      let categoryName = "Uncategorized";
      let categoryIcon = "📌";
      let categoryId = null;
      
      if (note.category_id) {
        const category = categories.find(c => c.id == note.category_id);
        if (category) {
          categoryName = category.name;
          categoryIcon = category.icon || '📁';
          categoryId = category.id.toString();
        }
      }
      
      // Create placeholder with properly encoded content
      // Make sure to properly sanitize and encode HTML content to prevent XSS
       noteElement.innerHTML = `
        <div class="note-content-placeholder" data-content="${encodeURIComponent(note.content || '')}"></div>
        <div class="note-footer">
          <div class="note-timestamp">${formattedDate}</div>
          <div class="note-category" data-category-id="${categoryId || 'null'}">
            <div class="note-category-icon">${categoryIcon}</div>
            <!-- <div class="note-category-name">${categoryName}</div>  -->
          </div>
        </div>
        <button class="note-delete" title="Delete note">🗑️</button>
        <div class="note-expand" title="Expand/collapse note">
          <span class="expand-icon">⤢</span>
        </div>
      `;
      fragment.appendChild(noteElement);
    });
    
    // Clear and append in a single operation
    notesContainer.innerHTML = '';
    notesContainer.appendChild(fragment);
    
    // Initialize Quill editors for each note
    document.querySelectorAll('.note').forEach(noteElement => {
      const noteId = noteElement.dataset.id;
      const placeholder = noteElement.querySelector('.note-content-placeholder');
      const content = placeholder ? decodeURIComponent(placeholder.dataset.content) : '';
      
      // Create Quill editor for this note
      createQuillEditor(noteElement, noteId, content);
      
      // Add event listeners
      const deleteBtn = noteElement.querySelector('.note-delete');
      const expandBtn = noteElement.querySelector('.note-expand');
      const categoryBtn = noteElement.querySelector('.note-category');
      
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleNoteDelete(noteId);
      });
      
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleNoteExpand(noteElement);
      });
      
      // Add category selection event listener using modal
      if (categoryBtn) {
        categoryBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          showNoteCategoryModal(noteId);
        });
      }
    });
    
  }

  // Fix for delete button position
  // Updated fixDeleteButtons function in ui.js
function fixDeleteButtons() {
  console.log("Using simplified button handler");
}

  // Call this with a longer delay to ensure Quill is fully initialized
  setTimeout(fixDeleteButtons, 500);

  // Call this after your notes are rendered
  setTimeout(fixDeleteButtons, 100);
    
  // Update classes for dynamic layout based on note count
  const notesCount = notes.length;

  // Remove all possible layout classes
  notesContainer.classList.remove(
    'note-count-1', 
    'note-count-2', 
    'note-count-3', 
    'note-count-4',
    'note-count-5',
    'note-count-6',
    'note-count-7',
    'note-count-8',
    'note-count-9',
    'note-count-many',
    'notes-count-1',
    'notes-count-2',
    'notes-count-3',
    'notes-count-many'
  );

  // Add appropriate class based on number of notes
  if (notesCount === 0) {
    // Empty state - no special class needed
  } else if (notesCount === 1) {
    notesContainer.classList.add('note-count-1');
    notesContainer.classList.add('notes-count-1');
  } else if (notesCount === 2) {
    notesContainer.classList.add('note-count-2');
    notesContainer.classList.add('notes-count-2');
  } else if (notesCount === 3) {
    notesContainer.classList.add('note-count-3');
    notesContainer.classList.add('notes-count-3');
  } else if (notesCount === 4) {
    notesContainer.classList.add('note-count-4');
    notesContainer.classList.add('notes-count-many');
  } else if (notesCount === 5) {
    notesContainer.classList.add('note-count-5');
    notesContainer.classList.add('notes-count-many');
  } else if (notesCount === 6) {
    notesContainer.classList.add('note-count-6');
    notesContainer.classList.add('notes-count-many');
  } else if (notesCount === 7) {
    notesContainer.classList.add('note-count-7');
    notesContainer.classList.add('notes-count-many');
  } else if (notesCount === 8) {
    notesContainer.classList.add('note-count-8');
    notesContainer.classList.add('notes-count-many');
  } else if (notesCount === 9) {
    notesContainer.classList.add('note-count-9');
    notesContainer.classList.add('notes-count-many');
  } else {
    notesContainer.classList.add('note-count-many');
    notesContainer.classList.add('notes-count-many');
  }
}

// Render categories in the UI
export function renderCategories() {
  const categories = getCategories();
  const currentCategoryId = getCurrentCategoryId();
  const categoriesContainer = elements.categoriesContainer;
  const currentCategoryElement = elements.currentCategoryElement;
  
  const customCategoriesHTML = categories.map(category => `
    <div class="category${currentCategoryId === category.id.toString() ? ' active' : ''}" data-id="${category.id}">
      <div class="category-icon">${category.icon || '📁'}</div>
      <div class="category-name">${category.name}</div>
      <div class="category-controls">
        <button class="btn-edit" title="Edit category">✏️</button>
        <button class="btn-delete" title="Delete category">🗑️</button>
      </div>
    </div>
  `).join('');
  
  // Update the existing system categories and add custom ones
  categoriesContainer.innerHTML = `
    <div class="category${currentCategoryId === 'all' ? ' active' : ''}" data-id="all">
      <div class="category-icon">📄</div>
      <div class="category-name">All Notes</div>
    </div>
    <div class="category${currentCategoryId === 'uncategorized' ? ' active' : ''}" data-id="uncategorized">
      <div class="category-icon">📌</div>
      <div class="category-name">Uncategorized</div>
    </div>
    ${customCategoriesHTML}
  `;
  
  // Update current category label
 /*  if (currentCategoryId === 'all') {
    currentCategoryElement.textContent = 'All Notes';
  } else if (currentCategoryId === 'uncategorized') {
    currentCategoryElement.textContent = 'Uncategorized';
  } else {
    const category = categories.find(cat => cat.id.toString() === currentCategoryId);
    if (category) {
      currentCategoryElement.textContent = category.name;
    }
  }
  */

  // Add bulk delete button to notes header if not already present
  const notesHeader = document.querySelector('.notes-header');
  let bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
  
  if (!bulkDeleteBtn) {
    bulkDeleteBtn = document.createElement('button');
    bulkDeleteBtn.id = 'bulkDeleteBtn';
    bulkDeleteBtn.className = 'bulk-delete-btn';
    bulkDeleteBtn.title = 'Delete all notes in this category';
    bulkDeleteBtn.innerHTML = '🗑️ Delete All';
    
    // On mobile, ensure proper button placement
    if (window.innerWidth <= 768) {
      // Insert at the beginning of the header (left side)
      notesHeader.insertBefore(bulkDeleteBtn, notesHeader.firstChild);
    } else {
      // On desktop, add button between the category title and add note button
      notesHeader.insertBefore(bulkDeleteBtn, document.getElementById('addNoteBtn'));
    }
    
    // Add event listener to bulk delete button
    bulkDeleteBtn.addEventListener('click', handleBulkDelete);
  }
  
  // Add event listeners to categories
  document.querySelectorAll('.category').forEach(categoryElem => {
    categoryElem.addEventListener('click', () => {
      handleCategoryClick(categoryElem.dataset.id);
    });
    
    const editBtn = categoryElem.querySelector('.btn-edit');
    const deleteBtn = categoryElem.querySelector('.btn-delete');
    
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCategoryEdit(categoryElem.dataset.id);
      });
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleCategoryDelete(categoryElem.dataset.id);
      });
    }
  });
}

// Toggle note expansion - UPDATED VERSION WITH FIX
// Update to toggleNoteExpansion function in ui.js

export function toggleNoteExpansion(noteElement) {
  // Create overlay if it doesn't exist yet
  let overlay = document.querySelector('.note-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'note-overlay';
    document.body.appendChild(overlay);
    
    // Add click event to close expanded note when clicking outside
    overlay.addEventListener('click', () => {
      const expandedNote = document.querySelector('.note.expanded');
      if (expandedNote) {
        toggleNoteExpansion(expandedNote);
      }
    });
  }
  
  const noteId = noteElement.dataset.id;
  const isExpanding = !noteElement.classList.contains('expanded');
  
  if (isExpanding) {
    // REMOVE ALL DELETE BUTTONS EXCEPT FOR THIS NOTE
    hideAllNoteButtons();
    
    // Expand note
    noteElement.classList.add('expanded');
    overlay.classList.add('active');
    
    // Add inline styles to maximize size
    noteElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 95%;
      max-width: 1200px;
      height: 90%;
      max-height: 900px;
      z-index: 9001;
      background-color: var(--surface-color);
    `;
    
    // Apply mobile styles if needed
    if (window.innerWidth <= 768) {
      noteElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform: none;
        border-radius: 0;
        z-index: 9001;
        background-color: var(--surface-color);
      `;
    }
    
    // Move to body to ensure proper positioning and z-index
    document.body.appendChild(noteElement);
    
    // Prevent scrolling on main container
    document.body.style.overflow = 'hidden';
    
    // Make overlay darker
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    overlay.style.zIndex = '9000';
    
    
    // Focus on editor
    focusQuillEditor(noteId);
  } else {
    // Collapse note
    noteElement.classList.remove('expanded');
    overlay.classList.remove('active');
    
    // Remove inline styles
    noteElement.style = '';
    
    // Reset overlay style
    overlay.style = '';
    
    // Return note to its original container
    elements.notesContainer.appendChild(noteElement);
    
    // Allow scrolling on main container again
    document.body.style.overflow = '';
    
    // RESTORE ALL DELETE BUTTONS
    setTimeout(recreateAllNoteButtons, 50);
    
    
  }
  
  // Update Quill editor layout after expanding/collapsing
  updateQuillEditorLayout(noteId);
}
