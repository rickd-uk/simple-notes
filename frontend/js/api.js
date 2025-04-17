// api.js - API interaction functions
import { 
  getApiUrl, 
  getCurrentCategoryId, 
  setNotes, 
  setCategories, 
  getCategories
} from './state.js';
import { 
  getCachedNotes, 
  getCachedCategories, 
  saveNotesToCache, 
  saveCategoriesToCache,
  clearNotesCache,
  isCacheFresh
} from './cache.js';
import { renderNotes, renderCategories } from './ui.js';
import { showToast } from './uiUtils.js';

// Fetch notes from API with caching
export async function loadNotes() {
  const currentCategoryId = getCurrentCategoryId();
  
  // First try to render from cache for immediate display
  const cachedNotes = getCachedNotes(currentCategoryId);
  if (cachedNotes) {
    setNotes(cachedNotes);
    renderNotes();
  }

  // Show loading indicator if no cached data
  if (!cachedNotes) {
    document.getElementById('notesContainer').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⏳</div>
        <div class="empty-message">Loading notes...</div>
      </div>
    `;
  }

  try {
    const apiUrl = getApiUrl();
    let url = `${apiUrl}/notes`;
    if (currentCategoryId !== 'all') {
      url = `${apiUrl}/notes/category/${currentCategoryId}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch notes');
    const freshNotes = await response.json();
    
    // Only update UI if notes changed or we didn't have cache
    if (!cachedNotes || JSON.stringify(freshNotes) !== JSON.stringify(cachedNotes)) {
      setNotes(freshNotes);
      renderNotes();
    }
    
    // Update the cache with fresh data
    saveNotesToCache(currentCategoryId, freshNotes);
    
    return freshNotes;
  } catch (error) {
    console.error('Error loading notes:', error);
    
    // If we have cached notes, continue using them
    if (!cachedNotes) {
      showToast('Error loading notes');
    }
    
    return cachedNotes || [];
  }
}

// Fetch categories from API with caching
export async function loadCategories() {
  // First try to render from cache for immediate display
  const cachedCategories = getCachedCategories();
  if (cachedCategories) {
    setCategories(cachedCategories);
    renderCategories();
  }

  // Show loading indicator for empty categories
  if (!cachedCategories) {
    document.querySelector('.categories').innerHTML = `
      <div class="category${getCurrentCategoryId() === 'all' ? ' active' : ''}" data-id="all">
        <div class="category-icon">📄</div>
        <div class="category-name">All Notes</div>
      </div>
      <div class="category${getCurrentCategoryId() === 'uncategorized' ? ' active' : ''}" data-id="uncategorized">
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
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const freshCategories = await response.json();

    // Only update UI if categories changed or we didn't have cache
    if (!cachedCategories || JSON.stringify(freshCategories) !== JSON.stringify(cachedCategories)) {
      setCategories(freshCategories);
      renderCategories();
    }
    // Update the cache with fresh data
    saveCategoriesToCache(freshCategories);

    return freshCategories;
  } catch (error) {
    console.error('Error loading categories:', error);

    // If we have cached categories, continue using them
    if (!cachedCategories) {
      showToast('Error loading categories');
    }
    
    return cachedCategories || [];
  }
}

// Preload notes for adjacent categories in the background
export function preloadAdjacentCategories() {
  const currentCategoryId = getCurrentCategoryId();
  const categories = getCategories();
  
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
  if (isCacheFresh(categoryId, 5)) { // 5 minutes
    return; // Use existing cache if it's less than 5 minutes old
  }

  try {
    const apiUrl = getApiUrl();
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

// Create a new note
export async function createNote(categoryId) {
  try {
    const apiUrl = getApiUrl();
    const newNote = {
      content: '',
      category_id: categoryId === 'all' ? null : categoryId === 'uncategorized' ? null : categoryId
    };
    
    const response = await fetch(`${apiUrl}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNote)
    });
    
    if (!response.ok) throw new Error('Failed to create note');
    const createdNote = await response.json();
    
    // Clear cache for current category and 'all' category
    clearNotesCache(categoryId);
    if (categoryId !== 'all') {
      clearNotesCache('all');
    }
    
    return createdNote;
  } catch (error) {
    console.error('Error creating note:', error);
    showToast('Error creating note');
    return null;
  }
}

// Update an existing note
export async function updateNote(noteId, content, categoryId) {
  try {
    const apiUrl = getApiUrl();
    const updatedNote = { content, category_id: categoryId };
    
    const response = await fetch(`${apiUrl}/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedNote)
    });
    
    if (!response.ok) throw new Error('Failed to update note');
    const result = await response.json();
    
    // Clear cache for current category and 'all' category
    const currentCategoryId = getCurrentCategoryId();
    saveNotesToCache(currentCategoryId, null); // Force reload next time
    if (currentCategoryId !== 'all') {
      clearNotesCache('all');
    }
    
    return result;
  } catch (error) {
    console.error('Error updating note:', error);
    showToast('Error saving note');
    return null;
  }
}

// Delete a note
export async function deleteNote(noteId) {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/notes/${noteId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete note');
    
    // Clear cache for current category and 'all' category
    const currentCategoryId = getCurrentCategoryId();
    clearNotesCache(currentCategoryId);
    if (currentCategoryId !== 'all') {
      clearNotesCache('all');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    showToast('Error deleting note');
    return false;
  }
}

// Delete all notes in a category
export async function deleteAllNotesInCategory(categoryId) {
  try {
    const apiUrl = getApiUrl();
    const url = `${apiUrl}/notes/category/${categoryId}`;
    
    const response = await fetch(url, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete notes');
    const result = await response.json();
    
    // Clear cache for current category and 'all' category
    clearNotesCache(categoryId);
    if (categoryId !== 'all') {
      clearNotesCache('all');
    }
    
    return result;
  } catch (error) {
    console.error('Error deleting all notes:', error);
    showToast('Error deleting notes');
    return { error: true };
  }
}

// Create a new category
export async function createCategory(name, icon) {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon })
    });
    
    if (!response.ok) throw new Error('Failed to create category');
    const newCategory = await response.json();
    
    return newCategory;
  } catch (error) {
    console.error('Error creating category:', error);
    showToast('Error creating category');
    return null;
  }
}

// Update an existing category
export async function updateCategory(id, name, icon) {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon })
    });
    
    if (!response.ok) throw new Error('Failed to update category');
    const updatedCategory = await response.json();
    
    return updatedCategory;
  } catch (error) {
    console.error('Error updating category:', error);
    showToast('Error updating category');
    return null;
  }
}

// Delete a category
export async function deleteCategory(id) {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/categories/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Failed to delete category');
    
    // Clear all notes caches since category assignments changed
    clearNotesCache('all');
    clearNotesCache('uncategorized');
    getCategories().forEach(cat => {
      clearNotesCache(cat.id.toString());
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    showToast('Error deleting category');
    return false;
  }
}

// Log out the user
export async function logout() {
  try {
    const apiUrl = getApiUrl();
    await fetch(`${apiUrl}/logout`, {
      method: 'POST'
    });
    
    window.location.href = '/login.html';
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Error logging out');
    return false;
  }
}
