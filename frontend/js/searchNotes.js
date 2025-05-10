// frontend/js/searchNotes.js
import { getNotes } from "./state.js";
import { renderNotes } from "./ui.js"; // Assuming this is used by your search/modal logic
import { showToast } from "./uiUtils.js"; // Assuming this is used

// Keep track of search state
let currentSearchTerm = "";
let originalNotes = null;

/**
 * Search notes by content
 * @param {string} searchTerm - The term to search for
 * @returns {Array} - Filtered notes
 */
function searchNotes(searchTerm) {
  const allNotes = getNotes();
  if (!searchTerm || searchTerm.trim() === "") {
    return allNotes;
  }
  const normalizedTerm = searchTerm.toLowerCase().trim();
  return allNotes.filter((note) => {
    const content = note.content || "";
    const plainContent = content.replace(/<[^>]*>/g, " ");
    return plainContent.toLowerCase().includes(normalizedTerm);
  });
}

/**
 * Create a search modal
 */
function createSearchModal() {
  if (document.getElementById("searchModal")) {
    return document.getElementById("searchModal");
  }

  const modal = document.createElement("div");
  modal.id = "searchModal";
  modal.className = "modal";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";

  const header = document.createElement("div");
  header.className = "modal-header";
  header.textContent = "Search Notes";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "modal-input";
  searchInput.id = "searchInput";
  searchInput.placeholder = "Type to search...";

  const searchCount = document.createElement("div");
  searchCount.id = "searchCount";
  searchCount.style.fontSize = "14px";
  searchCount.style.margin = "10px 0";
  searchCount.textContent = "";

  const actions = document.createElement("div");
  actions.className = "modal-actions";

  const cancelButton = document.createElement("button");
  cancelButton.className = "modal-btn modal-btn-cancel";
  cancelButton.textContent = "Cancel";

  const performSearchButton = document.createElement("button"); // Renamed to avoid conflict if 'searchButton' is specific
  performSearchButton.className = "modal-btn modal-btn-confirm";
  performSearchButton.textContent = "Search";

  actions.appendChild(cancelButton);
  actions.appendChild(performSearchButton);

  modalContent.appendChild(header);
  modalContent.appendChild(searchInput);
  modalContent.appendChild(searchCount);
  modalContent.appendChild(actions);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  cancelButton.addEventListener("click", () => closeSearch(true)); // Pass true to clear search

  performSearchButton.addEventListener("click", () => {
    const term = searchInput.value;
    performSearch(term);
  });

  let typingTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      const term = searchInput.value;
      updateSearchCount(term);
    }, 300);
  });

  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const term = searchInput.value;
      performSearch(term);
    }
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeSearch(true); // Pass true to clear search
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) {
      closeSearch(true); // Pass true to clear search
    }
  });

  return modal;
}

/**
 * Update the search count display
 * @param {string} term - Search term
 */
function updateSearchCount(term) {
  const searchCountEl = document.getElementById("searchCount"); // Renamed variable
  if (!searchCountEl) return;

  if (!term || term.trim() === "") {
    searchCountEl.textContent = "";
    return;
  }

  const matchCount = searchNotes(term).length;
  const totalCount = getNotes().length; // Assuming getNotes() gives all notes before filtering

  searchCountEl.textContent = `Found ${matchCount} match${matchCount !== 1 ? "es" : ""} out of ${totalCount} note${totalCount !== 1 ? "s" : ""}`;
}

/**
 * Show the search modal
 */
function showSearch() {
  console.log("[searchNotes.js] showSearch called");
  const modal = createSearchModal(); // Ensure modal is created if not exists
  modal.classList.add("active");

  setTimeout(() => {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.focus();
      if (currentSearchTerm) {
        searchInput.value = currentSearchTerm;
        updateSearchCount(currentSearchTerm);
      } else {
        searchInput.value = ""; // Clear previous term if not restoring
        updateSearchCount(""); // Clear count
      }
    }
  }, 100); // Short delay for modal animation and focus
}

/**
 * Close the search modal and optionally clear search
 * @param {boolean} shouldClearSearch - Whether to clear the search results
 */
function closeSearch(shouldClearSearch) {
  console.log(
    `[searchNotes.js] closeSearch called. shouldClearSearch: ${shouldClearSearch}`,
  );
  const modal = document.getElementById("searchModal");
  if (modal) {
    modal.classList.remove("active");
  }

  if (shouldClearSearch && originalNotes && currentSearchTerm) {
    console.log(
      "[searchNotes.js] Clearing search and restoring original notes.",
    );
    restoreOriginalNotes();
  } else if (shouldClearSearch) {
    // If not restoring (e.g. modal closed without search), ensure search term is reset
    currentSearchTerm = "";
    originalNotes = null;
  }
}

/**
 * Perform search on notes
 * @param {string} term - Search term
 */
async function performSearch(term) {
  // Made async to align with potential async operations in state/render
  console.log(`[searchNotes.js] performSearch called with term: "${term}"`);
  if (!originalNotes && (!currentSearchTerm || term !== currentSearchTerm)) {
    // Store original notes only on a new search action
    originalNotes = [...getNotes()]; // Get a fresh copy of all notes
    console.log(
      "[searchNotes.js] Stored original notes. Count:",
      originalNotes.length,
    );
  }

  currentSearchTerm = term.trim();

  if (!currentSearchTerm) {
    console.log(
      "[searchNotes.js] Search term is empty. Restoring original notes.",
    );
    restoreOriginalNotes();
    closeSearch(false); // Don't re-clear, already handled by restoreOriginalNotes
    return;
  }

  const filteredNotes = searchNotes(currentSearchTerm);
  console.log(`[searchNotes.js] Filtered notes count: ${filteredNotes.length}`);

  try {
    const stateModule = await import("./state.js");
    stateModule.setNotes(filteredNotes); // Update state with filtered notes
    renderNotes(); // Re-render the notes list with filtered notes

    showToast(
      `Showing ${filteredNotes.length} search result${filteredNotes.length !== 1 ? "s" : ""}`,
    );
    closeSearch(false); // Close modal, don't clear the active search results
    addSearchIndicator(currentSearchTerm);
  } catch (error) {
    console.error(
      "[searchNotes.js] Error during performSearch state update or render:",
      error,
    );
  }
}

/**
 * Add a search indicator to the UI
 * @param {string} term - Search term
 */
function addSearchIndicator(term) {
  removeSearchIndicator(); // Remove any existing one

  const indicator = document.createElement("div");
  indicator.id = "searchIndicator";
  indicator.className = "search-indicator"; // For CSS styling
  indicator.style.cssText = `
        position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
        background-color: var(--primary-color, #6200ee); color: white; padding: 8px 16px;
        border-radius: 20px; font-size: 14px; z-index: 1001; display: flex;
        align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.2);`;

  indicator.innerHTML = `
        <span style="margin-right: 8px;">Search: "${term}"</span>
        <button id="clearSearchBtnIndicator" style="background:none;border:none;color:white;cursor:pointer;font-weight:bold;font-size:16px;line-height:1;">✕</button>
    `;
  document.body.appendChild(indicator);

  document
    .getElementById("clearSearchBtnIndicator")
    .addEventListener("click", () => {
      console.log("[searchNotes.js] Clear search from indicator clicked.");
      restoreOriginalNotes();
      closeSearch(true); // Ensure modal is closed and state is reset
    });
}

/**
 * Remove search indicator from UI
 */
function removeSearchIndicator() {
  const indicator = document.getElementById("searchIndicator");
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Restore original notes (before search filtering)
 */
async function restoreOriginalNotes() {
  // Made async
  console.log("[searchNotes.js] restoreOriginalNotes called.");
  if (originalNotes) {
    try {
      const stateModule = await import("./state.js");
      stateModule.setNotes(originalNotes); // Restore notes in state
      renderNotes(); // Re-render with original notes

      originalNotes = null;
      currentSearchTerm = "";
      removeSearchIndicator();
      console.log(
        "[searchNotes.js] Original notes restored and search state reset.",
      );
    } catch (error) {
      console.error(
        "[searchNotes.js] Error during restoreOriginalNotes state update or render:",
        error,
      );
    }
  } else {
    // If originalNotes is null, it might mean we need to reload all notes
    // This case depends on how your application fetches notes initially
    console.log(
      "[searchNotes.js] No originalNotes to restore, current search term was likely empty or not set.",
    );
    currentSearchTerm = ""; // Ensure search term is cleared
    removeSearchIndicator();
  }
}

/**
 * Initialize search functionality by attaching event listener to the search button
 */
function initSearchFunctionality() {
  console.log(
    "[searchNotes.js] Attempting to initialize search functionality (event listener setup)...",
  );
  const mainSearchButton = document.getElementById("searchButton"); // This is the button in the main header

  if (!mainSearchButton) {
    console.error(
      '[searchNotes.js] Main search button (id="searchButton") NOT FOUND in the DOM even after uiControlsReady. Cannot attach listener.',
    );
    return;
  }

  console.log(
    '[searchNotes.js] Main search button (id="searchButton") FOUND. Adding click listener.',
  );
  mainSearchButton.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("[searchNotes.js] Main search button clicked.");
      showSearch(); // This function creates and shows the search modal
    },
    true,
  ); // Use capture phase if needed, or false for bubbling

  console.log(
    "[searchNotes.js] Search functionality (event listener on main button) initialized.",
  );
}

// REMOVED old DOMContentLoaded and setTimeout logic.
// We now ONLY initialize when 'uiControlsReady' is dispatched.
document.addEventListener("uiControlsReady", () => {
  console.log(
    '[searchNotes.js] "uiControlsReady" event received. Initializing search functionality.',
  );
  initSearchFunctionality();
});

// Add some CSS for the search feature (modal and indicator)
// This can stay as it just adds styles and doesn't depend on DOM elements being ready immediately.
const style = document.createElement("style");
style.textContent = `
    /* Search modal specific styles */
    #searchModal .modal-content {
        max-width: 500px; /* Or your preferred width */
    }
    #searchModal .modal-header {
        color: var(--primary-color, #6200ee); /* Fallback color */
        /* Add other header styles as needed */
    }
    #searchInput { /* ID of the input inside the modal */
        width: 100%;
        padding: 10px;
        margin-bottom: 10px; /* Space before count/buttons */
        border-radius: var(--border-radius, 4px);
        border: 1px solid #e0e0e0;
        font-size: 16px;
        box-sizing: border-box; /* Include padding and border in the element's total width and height */
    }
    #searchInput:focus {
        outline: none;
        border-color: var(--primary-color, #6200ee); /* Fallback color */
        box-shadow: 0 0 0 2px rgba(98, 0, 238, 0.2); /* Optional focus ring */
    }
    /* Dark mode support for search input */
    body.dark-mode #searchInput {
        background-color: var(--dm-surface-color, #2a2a2a); /* Fallback dark bg */
        border-color: var(--dm-border-color, #444); /* Fallback dark border */
        color: var(--dm-text-color, #e0e0e0); /* Fallback dark text */
    }
    body.dark-mode #searchInput:focus {
        border-color: var(--primary-color, #bb86fc); /* Dark mode primary focus */
    }
    /* Search indicator styles are applied via JS inline or a dedicated class */
    .search-indicator {
        /* You can define base styles here if preferred over inline JS styles */
    }
`;
document.head.appendChild(style);
