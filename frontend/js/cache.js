// cache.js - Local storage cache management

// Cache management for categories
export function saveCategoriesToCache(categories) {
  localStorage.setItem('categories', JSON.stringify(categories));
  localStorage.setItem('categoriesCachedAt', Date.now().toString());
}

export function getCachedCategories() {
  const cachedCategories = localStorage.getItem('categories');
  if (!cachedCategories) return null;
  
  // Check cache freshness (24-hour expiry)
  const cachedAt = localStorage.getItem('categoriesCachedAt');
  if (cachedAt && Date.now() - Number(cachedAt) > 24 * 60 * 60 * 1000) {
    localStorage.removeItem('categories');
    localStorage.removeItem('categoriesCachedAt');
    return null;
  }
  
  return JSON.parse(cachedCategories);
}

// Cache management for notes
export function saveNotesToCache(categoryId, notesData) {
  localStorage.setItem(`notes_${categoryId}`, JSON.stringify(notesData));
  localStorage.setItem(`notes_${categoryId}_cachedAt`, Date.now().toString());
}

export function getCachedNotes(categoryId) {
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
export function clearNotesCache(categoryId) {
  localStorage.removeItem(`notes_${categoryId}`);
  localStorage.removeItem(`notes_${categoryId}_cachedAt`);
  
  // Also clear 'all' category cache since it contains all notes
  if (categoryId !== 'all') {
    localStorage.removeItem('notes_all');
    localStorage.removeItem('notes_all_cachedAt');
  }
}

// Clear all caches
export function clearAllCaches() {
  // Find all notes caches
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('notes_')) {
      localStorage.removeItem(key);
    }
  }
  
  // Clear categories cache
  localStorage.removeItem('categories');
  localStorage.removeItem('categoriesCachedAt');
}

// Check if cache exists and is fresh for prefetching
export function isCacheFresh(categoryId, minutes = 5) {
  const cachedAt = localStorage.getItem(`notes_${categoryId}_cachedAt`);
  return cachedAt && Date.now() - Number(cachedAt) < minutes * 60 * 1000;
}
