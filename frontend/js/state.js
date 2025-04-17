// state.js - Application state management

// Application state
let state = {
  notes: [],
  categories: [],
  currentCategoryId: 'all',
  apiUrl: '/api' // Use relative path for same-origin requests
};

// DOM element references
export const elements = {
  notesContainer: document.getElementById('notesContainer'),
  categoriesContainer: document.querySelector('.categories'),
  currentCategoryElement: document.querySelector('.current-category'),
  addNoteBtn: document.getElementById('addNoteBtn'),
  emptyAddNoteBtn: document.getElementById('emptyAddNoteBtn'),
  addCategoryBtn: document.getElementById('addCategoryBtn'),
  categoryModal: document.getElementById('categoryModal'),
  categoryModalHeader: document.getElementById('categoryModalHeader'),
  categoryInput: document.getElementById('categoryInput'),
  categoryIconInput: document.getElementById('categoryIconInput'),
  cancelCategoryBtn: document.getElementById('cancelCategoryBtn'),
  confirmCategoryBtn: document.getElementById('confirmCategoryBtn'),
  categoryEditId: document.getElementById('categoryEditId'),
  toast: document.getElementById('toast'),
  logoutBtn: document.getElementById('logoutBtn')
};

// Initialize state
export function initState() {
  // Nothing to initialize at the moment
  return state;
}

// State getters
export function getNotes() {
  return state.notes;
}

export function getCategories() {
  return state.categories;
}

export function getCurrentCategoryId() {
  return state.currentCategoryId;
}

export function getApiUrl() {
  return state.apiUrl;
}

// State setters
export function setNotes(notes) {
  state.notes = notes;
}

export function setCategories(categories) {
  state.categories = categories;
}

export function setCurrentCategoryId(categoryId) {
  state.currentCategoryId = categoryId;
}

// Update a specific note in the state
export function updateNoteInState(noteId, content) {
  const noteIndex = state.notes.findIndex(note => note.id == noteId);
  if (noteIndex !== -1) {
    state.notes[noteIndex].content = content;
    return state.notes[noteIndex];
  }
  return null;
}

// Add a note to the state
export function addNoteToState(note) {
  state.notes.unshift(note);
}

// Remove a note from the state
export function removeNoteFromState(noteId) {
  state.notes = state.notes.filter(note => note.id != noteId);
}

// Add a category to the state
export function addCategoryToState(category) {
  state.categories.push(category);
}

// Update a category in the state
export function updateCategoryInState(categoryId, updatedCategory) {
  const categoryIndex = state.categories.findIndex(cat => cat.id.toString() === categoryId);
  if (categoryIndex !== -1) {
    state.categories[categoryIndex] = updatedCategory;
    return true;
  }
  return false;
}

// Remove a category from the state
export function removeCategoryFromState(categoryId) {
  state.categories = state.categories.filter(cat => cat.id.toString() !== categoryId);
}
