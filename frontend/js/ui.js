// ui.js - UI rendering functions
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

// Render notes in the UI
export function renderNotes() {
  // Clear existing Quill editors
  clearQuillEditors();
  
  const notes = getNotes();
  const notesContainer = elements.notesContainer;
  
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
      
      // Create placeholder with properly encoded content
      // Make sure to properly sanitize and encode HTML content to prevent XSS
      noteElement.innerHTML = `
        <div class="note-content-placeholder" data-content="${encodeURIComponent(note.content || '')}"></div>
        <div class="note-footer">
          <div class="note-timestamp">${formattedDate}</div>
          <button class="note-delete" title="Delete note">🗑️</button>
        </div>
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
      
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleNoteDelete(noteId);
      });
      
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleNoteExpand(noteElement);
      });
    });
  }

  // Add classes for dynamic layout based on note count
  const notesCount = notes.length;
  notesContainer.classList.remove('notes-count-1', 'notes-count-2', 'notes-count-3', 'notes-count-many');

  if (notesCount === 1) {
    notesContainer.classList.add('notes-count-1');
  } else if (notesCount === 2) {
    notesContainer.classList.add('notes-count-2');
  } else if (notesCount === 3) {
    notesContainer.classList.add('notes-count-3');
  } else if (notesCount > 3) {
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
  if (currentCategoryId === 'all') {
    currentCategoryElement.textContent = 'All Notes';
  } else if (currentCategoryId === 'uncategorized') {
    currentCategoryElement.textContent = 'Uncategorized';
  } else {
    const category = categories.find(cat => cat.id.toString() === currentCategoryId);
    if (category) {
      currentCategoryElement.textContent = category.name;
    }
  }

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

// Toggle note expansion
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
  
  if (!isExpanding) {
    // Collapse note
    noteElement.classList.remove('expanded');
    overlay.classList.remove('active');
    
    // Return note to its original container
    elements.notesContainer.appendChild(noteElement);
    
    // Allow scrolling on main container again
    document.body.style.overflow = '';
  } else {
    // Expand note
    noteElement.classList.add('expanded');
    overlay.classList.add('active');
    
    // Move to body to ensure proper positioning and z-index
    document.body.appendChild(noteElement);
    
    // Prevent scrolling on main container
    document.body.style.overflow = 'hidden';
    
    // Focus on editor
    focusQuillEditor(noteId);
  }
  
  // Update Quill editor layout after expanding/collapsing
  updateQuillEditorLayout(noteId);
}
