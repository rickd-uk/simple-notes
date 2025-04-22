// quillEditor.js - Quill rich text editor integration
import { handleNoteInput } from './eventHandlers.js';
import { getToolbarsVisible } from './toolbarToggle.js';
import { isSpellcheckEnabled, applySpellcheckToEditor } from './spellcheckToggle.js';

// Store Quill editor instances
let quillEditors = {};

// Configure Quill toolbar options
const quillToolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],
  [{ 'header': 1 }, { 'header': 2 }],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'color': [] }, { 'background': [] }],
  ['link'],
  ['clean']
];

// Initialize Quill for all notes
export function initializeQuillEditors() {
  document.querySelectorAll('.note').forEach(noteElement => {
    const noteId = noteElement.dataset.id;
    const textareaContent = noteElement.querySelector('.note-content')?.value || '';
    
    // Create Quill editor for this note
    createQuillEditor(noteElement, noteId, textareaContent);
  });
}

// Create a Quill editor for a note
export function createQuillEditor(noteElement, noteId, initialContent) {
  // Clean up any existing editor for this note
  destroyQuillEditor(noteId);
  
  // Create container for editor
  const editorContainer = document.createElement('div');
  editorContainer.className = 'note-editor-container';
  
  // Create editor element
  const editorElement = document.createElement('div');
  editorElement.className = 'quill-editor';
  
  // Check if this editor is in a modal
  const isInModal = !!noteElement.closest('.modal');
  
  // Set spell checking based on setting (default to on in modals, follow toggle in main view)
  const useSpellcheck = isInModal ? true : isSpellcheckEnabled();
  editorElement.setAttribute('spellcheck', useSpellcheck ? 'true' : 'false');
  
  editorContainer.appendChild(editorElement);
  
  // Replace textarea with editor
  const textarea = noteElement.querySelector('.note-content');
  if (textarea) {
    textarea.parentNode.replaceChild(editorContainer, textarea);
  } else {
    // If no textarea (e.g., creating from scratch), just append
    noteElement.insertBefore(editorContainer, noteElement.querySelector('.note-footer'));
  }
  
  // Initialize Quill
  const quill = new Quill(editorElement, {
    modules: {
      toolbar: quillToolbarOptions
    },
    placeholder: 'Start writing...',
    theme: 'snow'
  });
  
  // Set initial content
  if (initialContent) {
    // Check if content is HTML
    if (initialContent.trim().startsWith('<')) {
      quill.clipboard.dangerouslyPasteHTML(initialContent);
    } else {
      quill.setText(initialContent);
    }
  }
  
  // Store reference to editor
  quillEditors[noteId] = quill;
  
  // Handle content changes
  quill.on('text-change', function() {
    // Get HTML content from the editor
    const content = quill.root.innerHTML;
    handleNoteInput(noteId, content);
  });
  
  // Apply current toolbar visibility state to the new editor
  applyToolbarVisibility(noteId);
  
  // Apply spell check setting to the Quill editor root element
  if (!isInModal) {
    quill.root.setAttribute('spellcheck', useSpellcheck ? 'true' : 'false');
  }
  
  return quill;
}

// Apply current toolbar visibility to a specific editor
export function applyToolbarVisibility(noteId) {
  const toolbarsVisible = getToolbarsVisible();
  const editorContainer = document.querySelector(`.note[data-id="${noteId}"] .note-editor-container`);
  
  if (editorContainer) {
    const toolbar = editorContainer.querySelector('.ql-toolbar');
    const editor = editorContainer.querySelector('.ql-container');
    
    if (toolbar) {
      toolbar.style.display = toolbarsVisible ? '' : 'none';
    }
    
    if (editor) {
      editor.style.marginTop = toolbarsVisible ? '' : '0';
      editor.style.height = toolbarsVisible ? '' : 'calc(100% - 10px)';
    }
  }
}

// Apply current toolbar visibility to all editors
export function applyToolbarVisibilityToAll() {
  for (const noteId in quillEditors) {
    applyToolbarVisibility(noteId);
  }
}

// Clean up Quill editor instances when notes are removed
export function destroyQuillEditor(noteId) {
  if (quillEditors[noteId]) {
    // No explicit destroy method in Quill, but we can clean up our reference
    delete quillEditors[noteId];
  }
}

// Get a specific editor instance
export function getQuillEditor(noteId) {
  return quillEditors[noteId];
}

// Update the Quill editor layout after expanding/collapsing
export function updateQuillEditorLayout(noteId) {
  if (quillEditors[noteId]) {
    // Force Quill to update its layout after a short delay
    window.setTimeout(() => {
      quillEditors[noteId].update();
    }, 100);
  }
}

// Focus on a specific editor
export function focusQuillEditor(noteId) {
  if (quillEditors[noteId]) {
    quillEditors[noteId].focus();
  }
}

// Clear all editor instances
export function clearQuillEditors() {
  quillEditors = {};
}

// Make quillEditors globally accessible via a function
// Safer than exposing the variable directly
export function getAllQuillEditors() {
  window.getAllQuillEditors = function() {
    return quillEditors;
  };
  return quillEditors;
}

// Apply spell check state to all editors
export function applySpellcheckToAll() {
  // Just call the central function from spellcheckToggle.js
  // which handles cursor position preservation
  if (typeof applySpellcheckState === 'function') {
    applySpellcheckState();
  }
}
