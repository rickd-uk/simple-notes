// State
let notes = [];
let categories = [];
let currentCategoryId = 'all';
let apiUrl = '/api'; // Use relative path for same-origin requests

// DOM Elements
const notesContainer = document.getElementById('notesContainer');
const categoriesContainer = document.querySelector('.categories');
const currentCategoryElement = document.querySelector('.current-category');
const addNoteBtn = document.getElementById('addNoteBtn');
const emptyAddNoteBtn = document.getElementById('emptyAddNoteBtn');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categoryModal = document.getElementById('categoryModal');
const categoryModalHeader = document.getElementById('categoryModalHeader');
const categoryInput = document.getElementById('categoryInput');
const categoryIconInput = document.getElementById('categoryIconInput');
const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
const confirmCategoryBtn = document.getElementById('confirmCategoryBtn');
const categoryEditId = document.getElementById('categoryEditId');
const toast = document.getElementById('toast');

// Cache management for categories
function saveCategoriesToCache(categories) {
  localStorage.setItem('categories', JSON.stringify(categories));
  localStorage.setItem('categoriesCachedAt', Date.now().toString());
}

function getCachedCategories() {
  const cachedCategories = localStorage.getItem('categories');
  if (!cachedCategories) return null;
  
  // Optionally check cache freshness (24-hour expiry)
  const cachedAt = localStorage.getItem('categoriesCachedAt');
  if (cachedAt && Date.now() - Number(cachedAt) > 24 * 60 * 60 * 1000) {
    localStorage.removeItem('categories');
    localStorage.removeItem('categoriesCachedAt');
    return null;
  }
  
  return JSON.parse(cachedCategories);
}

// Cache management for notes
function saveNotesToCache(categoryId, notesData) {
  localStorage.setItem(`notes_${categoryId}`, JSON.stringify(notesData));
  localStorage.setItem(`notes_${categoryId}_cachedAt`, Date.now().toString());
}

function getCachedNotes(categoryId) {
  const cachedNotes = localStorage.getItem(`notes_${categoryId}`);
  if (!cachedNotes) return null;
  
  // Cache expiry (1 hour for notes)
  const cachedAt = localStorage.getItem(`notes_${categoryId}_cachedAt`);
  if (cachedAt && Date.now() - Number(cachedAt) > 60 * 60 * 1000) { // 1 hour
    localStorage.removeItem(`notes_${categoryId}`);
    localStorage.removeItem(`notes_${categoryId}_cachedAt`);
    return null;
  }
  
  return JSON.parse(cachedNotes);
}

// Clear note cache for a specific category (used when notes are modified)
function clearNotesCache(categoryId) {
  localStorage.removeItem(`notes_${categoryId}`);
  localStorage.removeItem(`notes_${categoryId}_cachedAt`);
  
  // Also clear 'all' category cache since it contains all notes
  if (categoryId !== 'all') {
    localStorage.removeItem('notes_all');
    localStorage.removeItem('notes_all_cachedAt');
  }
}

// Fetch notes from API with caching
async function loadNotes() {
  // First try to render from cache for immediate display
  const cachedNotes = getCachedNotes(currentCategoryId);
  if (cachedNotes) {
    notes = cachedNotes;
    renderNotes();
  }

  // Show loading indicator if no cached data
  if (!cachedNotes) {
    notesContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⏳</div>
        <div class="empty-message">Loading notes...</div>
      </div>
    `;
  }

  try {
    let url = `${apiUrl}/notes`;
    if (currentCategoryId !== 'all') {
      url = `${apiUrl}/notes/category/${currentCategoryId}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch notes');
    const freshNotes = await response.json();
    
    // Only update UI if notes changed or we didn't have cache
    if (!cachedNotes || JSON.stringify(freshNotes) !== JSON.stringify(cachedNotes)) {
      notes = freshNotes;
      renderNotes();
    }
    
    // Update the cache with fresh data
    saveNotesToCache(currentCategoryId, freshNotes);
    
  } catch (error) {
    console.error('Error loading notes:', error);
    
    // If we have cached notes, continue using them
    if (!cachedNotes) {
      showToast('Error loading notes');
    }
  }
}

// Fetch categories from API with caching
async function loadCategories() {
  // First try to render from cache for immediate display
  const cachedCategories = getCachedCategories();
  if (cachedCategories) {
    categories = cachedCategories;
    renderCategories();
  }

  // Show loading indicator for empty categories
  if (!cachedCategories) {
    categoriesContainer.innerHTML = `
      <div class="category${currentCategoryId === 'all' ? ' active' : ''}" data-id="all">
        <div class="category-icon">📄</div>
        <div class="category-name">All Notes</div>
      </div>
      <div class="category${currentCategoryId === 'uncategorized' ? ' active' : ''}" data-id="uncategorized">
        <div class="category-icon">📌</div>
        <div class="category-name">Uncategorized</div>
      </div>
      <div class="category" data-id="loading">
        <div class="category-icon">⏳</div>
        <div class="category-name">Loading categories...</div>
      </div>
    `;
  }

  try {
    const response = await fetch(`${apiUrl}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const freshCategories = await response.json();

    // Only update UI if categories changed or we didn't have cache
    if (!cachedCategories || JSON.stringify(freshCategories) !== JSON.stringify(cachedCategories)) {
      categories = freshCategories;
      renderCategories();
    }
    // Update the cache with fresh data
    saveCategoriesToCache(freshCategories);

  } catch (error) {
    console.error('Error loading categories:', error);

    // If we have cached categories, continue using them
    if (!cachedCategories) {
      showToast('Error loading categories');
    }
  }
}

// Preload notes for adjacent categories in the background
function preloadAdjacentCategories() {
  // Create an array of all category IDs including system categories
  const allCategoryIds = ['all', 'uncategorized', ...categories.map(c => c.id.toString())];
  const currentIndex = allCategoryIds.indexOf(currentCategoryId);
  
  // Preload next and previous categories
  if (currentIndex > 0) {
    prefetchNotes(allCategoryIds[currentIndex - 1]);
  }
  if (currentIndex < allCategoryIds.length - 1) {
    prefetchNotes(allCategoryIds[currentIndex + 1]);
  }
}

// Prefetch notes for a category without rendering them
async function prefetchNotes(categoryId) {
  // Skip if we already have fresh cached data
  const cachedAt = localStorage.getItem(`notes_${categoryId}_cachedAt`);
  if (cachedAt && Date.now() - Number(cachedAt) < 5 * 60 * 1000) { // 5 minutes
    return; // Use existing cache if it's less than 5 minutes old
  }

  try {
    let url = `${apiUrl}/notes`;
    if (categoryId !== 'all') {
      url = `${apiUrl}/notes/category/${categoryId}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to prefetch notes');
    const prefetchedNotes = await response.json();
    
    // Only update the cache
    saveNotesToCache(categoryId, prefetchedNotes);
  } catch (error) {
    console.error(`Error prefetching notes for category ${categoryId}:`, error);
    // Silently fail for prefetching
  }
}

function renderNotes() {
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
      
      noteElement.innerHTML = `
        <textarea class="note-content">${note.content || ''}</textarea>
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
    
    // Add event listeners to notes
    document.querySelectorAll('.note').forEach(noteElement => {
      const noteId = noteElement.dataset.id;
      const textArea = noteElement.querySelector('.note-content');
      const deleteBtn = noteElement.querySelector('.note-delete');
      const expandBtn = noteElement.querySelector('.note-expand');
      
      textArea.addEventListener('input', (e) => {
        updateNote(noteId, e.target.value);
      });
      
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNote(noteId);
      });
      
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNoteExpansion(noteElement);
      });
    });
  }

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

function toggleNoteExpansion(noteElement) {
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
  
  if (noteElement.classList.contains('expanded')) {
    // Collapse note
    noteElement.classList.remove('expanded');
    overlay.classList.remove('active');
    
    // Return note to its original container
    notesContainer.appendChild(noteElement);
    
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
    
    // Focus on textarea
    const textarea = noteElement.querySelector('.note-content');
    textarea.focus();
    
    // Place cursor at the end of the text
    const textLength = textarea.value.length;
    textarea.setSelectionRange(textLength, textLength);
  }
}

// Render categories
function renderCategories() {
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
  
  // Add event listeners to categories
  document.querySelectorAll('.category').forEach(categoryElem => {
    categoryElem.addEventListener('click', () => {
      const newCategoryId = categoryElem.dataset.id;
      if (newCategoryId === currentCategoryId) return; // Skip if already active
      
      currentCategoryId = newCategoryId;
      document.querySelectorAll('.category').forEach(c => c.classList.remove('active'));
      categoryElem.classList.add('active');
      loadNotes();
      renderCategories(); // Update header

      if (window.innerWidth <= 768) {
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.querySelector('.sidebar-overlay');

        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
      
      // Preload adjacent categories after a short delay
      setTimeout(() => {
        preloadAdjacentCategories();
      }, 1000);
    });
    
    const editBtn = categoryElem.querySelector('.btn-edit');
    const deleteBtn = categoryElem.querySelector('.btn-delete');
    
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const categoryId = categoryElem.dataset.id;
        editCategory(categoryId);
      });
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const categoryId = categoryElem.dataset.id;
        deleteCategory(categoryId);
      });
    }
  });
}

// Create new note
async function createNewNote() {
  try {
    const newNote = {
      content: '',
      category_id: currentCategoryId === 'all' ? null : currentCategoryId === 'uncategorized' ? null : currentCategoryId
    };
    
    const response = await fetch(`${apiUrl}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNote)
    });
    
    if (!response.ok) throw new Error('Failed to create note');
    const createdNote = await response.json();
    
    // Update local state
    notes.unshift(createdNote);
    renderNotes();
    
    // Clear cache for current category and 'all' category
    clearNotesCache(currentCategoryId);
    if (currentCategoryId !== 'all') {
      clearNotesCache('all');
    }
    
    // Focus on the new note
    setTimeout(() => {
      const firstTextarea = document.querySelector('.note-content');
      if (firstTextarea) {
        firstTextarea.focus();
      }
    }, 0);
  } catch (error) {
    console.error('Error creating note:', error);
    showToast('Error creating note');
  }
}

// Update note
async function updateNote(id, content) {
  try {
    const noteIndex = notes.findIndex(note => note.id == id);
    if (noteIndex === -1) return;
    
    const updatedNote = {
      content,
      category_id: notes[noteIndex].category_id
    };
    
    // Debounce the API call to avoid too many requests while typing
    clearTimeout(notes[noteIndex].saveTimeout);
    notes[noteIndex].saveTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`${apiUrl}/notes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedNote)
        });
        
        if (!response.ok) throw new Error('Failed to update note');
        const result = await response.json();
        
        // Update the note in the array with the result from the server
        Object.assign(notes[noteIndex], result);
        
        // Update cache for current category and 'all' category
        saveNotesToCache(currentCategoryId, notes);
        if (currentCategoryId !== 'all') {
          // We don't have the full 'all' notes array, so just clear that cache
          clearNotesCache('all');
        }
      } catch (err) {
        console.error('Error saving note:', err);
        showToast('Error saving note');
      }
    }, 500); // Wait 500ms after typing stops
    
    // Update locally for immediate feedback
    notes[noteIndex].content = content;
  } catch (error) {
    console.error('Error updating note:', error);
    showToast('Error saving note');
  }
}

// Delete note
async function deleteNote(id) {
  try {
    const response = await fetch(`${apiUrl}/notes/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete note');
   
    // Check if deleted note was expanded 
    const expandedNote = document.querySelector('.note.expanded')
    if (expandedNote && expandedNote.dataset.id == id) {
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
    notes = notes.filter(note => note.id != id);

    // Clear cache for current category and 'all' category
    clearNotesCache(currentCategoryId);
    if (currentCategoryId !== 'all') {
      clearNotesCache('all');
    }

    renderNotes();
    showToast('Note deleted');
  } catch (error) {
    console.error('Error deleting note:', error);
    showToast('Error deleting note');
  }
}

// Show category modal
function showCategoryModal(isEdit = false) {
  categoryModalHeader.textContent = isEdit ? 'Edit Category' : 'Add New Category';
  confirmCategoryBtn.textContent = isEdit ? 'Update' : 'Add';
  
  // Reset icon selection
  document.querySelectorAll('.icon-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  if (isEdit) {
    const categoryId = categoryEditId.value;
    const category = categories.find(cat => cat.id.toString() === categoryId);
    
    if (category) {
      categoryInput.value = category.name;
      
      // Set selected icon
      const iconElement = document.querySelector(`.icon-item[data-icon="${category.icon}"]`);
      if (iconElement) {
        iconElement.classList.add('selected');
        categoryIconInput.value = category.icon;
      } else {
        // If icon doesn't exist in our grid, select the default
        document.querySelector('.icon-item[data-icon="📁"]').classList.add('selected');
        categoryIconInput.value = '📁';
      }
    }
  } else {
    // Default icon for new categories
    document.querySelector('.icon-item[data-icon="📁"]').classList.add('selected');
    categoryIconInput.value = '📁';
    categoryInput.value = '';
  }
  
  categoryModal.classList.add('active');
  categoryInput.focus();
}

// Hide category modal
function hideCategoryModal() {
  categoryModal.classList.remove('active');
  categoryInput.value = '';
  categoryIconInput.value = '📁';
  categoryEditId.value = '';
}

// Create category
async function createCategory() {
  const name = categoryInput.value.trim();
  let icon = categoryIconInput.value.trim();
  
  if (!name) {
    showToast('Please enter a category name');
    return;
  }
  
  // Default icon if none provided
  if (!icon) {
    icon = '📁';
  }
  
  try {
    const response = await fetch(`${apiUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon })
    });
    
    if (!response.ok) throw new Error('Failed to create category');
    
    const newCategory = await response.json();
    categories.push(newCategory);
    saveCategoriesToCache(categories);
    renderCategories();
    hideCategoryModal();
    showToast('Category added');
  } catch (error) {
    console.error('Error creating category:', error);
    showToast('Error creating category');
  }
}

// Edit category
function editCategory(id) {
  const category = categories.find(cat => cat.id.toString() === id);
  if (category) {
    categoryEditId.value = id;
    showCategoryModal(true);
  }
}

// Update category
async function updateCategory() {
  const id = categoryEditId.value;
  const name = categoryInput.value.trim();
  let icon = categoryIconInput.value.trim();
  
  if (!name) {
    showToast('Please enter a category name');
    return;
  }
  
  // Default icon if none provided
  if (!icon) {
    icon = '📁';
  }
  
  try {
    const response = await fetch(`${apiUrl}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon })
    });
    
    if (!response.ok) throw new Error('Failed to update category');
    
    const updatedCategory = await response.json();
    const categoryIndex = categories.findIndex(cat => cat.id.toString() === id);
    
    if (categoryIndex !== -1) {
      categories[categoryIndex] = updatedCategory;
      saveCategoriesToCache(categories);
      renderCategories();
      hideCategoryModal();
      showToast('Category updated');
    }
  } catch (error) {
    console.error('Error updating category:', error);
    showToast('Error updating category');
  }
}

// Delete category
async function deleteCategory(id) {
  if (confirm('Are you sure you want to delete this category? Notes will be moved to Uncategorized.')) {
    try {
      const response = await fetch(`${apiUrl}/categories/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete category');
      
      categories = categories.filter(cat => cat.id.toString() !== id);
      saveCategoriesToCache(categories);
      
      // Clear all notes caches since category assignments changed
      clearNotesCache('all');
      clearNotesCache('uncategorized');
      categories.forEach(cat => {
        clearNotesCache(cat.id.toString());
      });
      
      // If current category is being deleted, switch to all notes
      if (currentCategoryId === id) {
        currentCategoryId = 'all';
      }
      
      await loadNotes(); // Reload notes to get updated category assignments
      renderCategories();
      showToast('Category deleted');
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Error deleting category');
    }
  }
}

// Show toast notification
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Add note button
  addNoteBtn.addEventListener('click', createNewNote);
  
  // Add category button
  addCategoryBtn.addEventListener('click', () => {
    showCategoryModal();
  });
  
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
      categoryIconInput.value = iconItem.dataset.icon;
    });
  });


  categoryInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // Prevent form submission if inside a form
    if (categoryEditId.value) {
      updateCategory();
    } else {
      createCategory();
    }
  }
  });
  
  // Category modal buttons
  cancelCategoryBtn.addEventListener('click', hideCategoryModal);
  
  confirmCategoryBtn.addEventListener('click', () => {
    if (categoryEditId.value) {
      updateCategory();
    } else {
      createCategory();
    }
  });
  
  // Close modal when clicking outside
  categoryModal.addEventListener('click', (e) => {
    if (e.target === categoryModal) {
      hideCategoryModal();
    }
  });
  
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && categoryModal.classList.contains('active')) {
      hideCategoryModal();
    }
  });
 
  // Add this new Escape key handler for expanded notes
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const expandedNote = document.querySelector('.note.expanded');
      if (expandedNote) {
        toggleNoteExpansion(expandedNote);
        e.preventDefault(); // Prevent other escape key handlers
      }
    }
  });



  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  }

  // Initialize the app
  loadCategories().then(() => {
    loadNotes();
    // Preload adjacent categories after initial load
    setTimeout(() => {
      preloadAdjacentCategories();
    }, 2000);
  });
});


// Add this code to your existing app.js, preferably at the end of the 
// DOMContentLoaded event listener

// Mobile navigation functionality
function setupMobileNavigation() {
  // Create and append nav toggle button
  const navToggle = document.createElement('button');
  navToggle.className = 'nav-toggle';
  navToggle.innerHTML = '≡';
  navToggle.setAttribute('aria-label', 'Toggle sidebar');
  document.body.appendChild(navToggle);
  
  // Create sidebar overlay
  const sidebarOverlay = document.createElement('div');
  sidebarOverlay.className = 'sidebar-overlay';
  document.body.appendChild(sidebarOverlay);
  
  // Get sidebar element
  const sidebar = document.querySelector('.sidebar');
  
  // Toggle sidebar function
  function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
  }
  
  // Event listeners
  navToggle.addEventListener('click', toggleSidebar);
  sidebarOverlay.addEventListener('click', toggleSidebar);
  
  // Close sidebar when a category is selected on mobile
  if (window.innerWidth <= 768) {
    document.querySelectorAll('.category').forEach(cat => {
      cat.addEventListener('click', () => {
        setTimeout(() => {
          toggleSidebar();
        }, 100);
      });
    });
  }
  
  // Resize handler to reset sidebar state on screen size change
  let previousWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const currentWidth = window.innerWidth;
    
    // Check if we've crossed the mobile breakpoint
    if ((previousWidth <= 768 && currentWidth > 768) || 
        (previousWidth > 768 && currentWidth <= 768)) {
      // Reset sidebar state
      sidebar.classList.remove('active');
      sidebarOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    
    previousWidth = currentWidth;
  });
}

// Call the function to set up mobile navigation
setupMobileNavigation();

// Fix for buttons being added multiple times when switching categories
document.querySelectorAll('.category').forEach(cat => {
  cat.addEventListener('click', () => {
    if (window.innerWidth <= 768) {
      const emptyAddNoteBtn = document.getElementById('emptyAddNoteBtn');
      if (emptyAddNoteBtn) {
        // Ensure we only have one event listener
        const newBtn = emptyAddNoteBtn.cloneNode(true);
        emptyAddNoteBtn.parentNode.replaceChild(newBtn, emptyAddNoteBtn);
        newBtn.addEventListener('click', createNewNote);
      }
    }
  });
});
