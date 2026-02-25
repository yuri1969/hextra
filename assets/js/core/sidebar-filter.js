// Sidebar filter functionality
document.addEventListener("DOMContentLoaded", function () {
  const filterInputs = document.querySelectorAll(".hextra-sidebar-filter-input");
  if (!filterInputs.length) return;

  filterInputs.forEach(function (filterInput) {
    const filterContainer = filterInput.closest(".hextra-sidebar-filter");
    const clearButton = filterContainer.querySelector(".hextra-sidebar-filter-clear");
    const statusElement = filterContainer.querySelector(".hextra-sidebar-filter-status");
    const sidebarContainer = filterInput.closest(".hextra-sidebar-container");

    let originalState = null;
    let originalTexts = null;

    function saveOriginalState() {
      if (originalState !== null) return;
      originalState = new Map();
      originalTexts = new Map();
      sidebarContainer.querySelectorAll("li").forEach(function (li, index) {
        originalState.set(index, li.classList.contains("open"));
      });
      // Save original text content for highlighting
      sidebarContainer.querySelectorAll(".hextra-sidebar-item").forEach(function (item) {
        const textSpan = item.querySelector("a > span");
        if (textSpan) {
          originalTexts.set(textSpan, textSpan.innerHTML);
        }
      });
    }

    function restoreOriginalState() {
      if (originalState === null) return;
      sidebarContainer.querySelectorAll("li").forEach(function (li, index) {
        const wasOpen = originalState.get(index);
        if (wasOpen !== undefined) {
          li.classList.toggle("open", wasOpen);
          const button = li.querySelector(":scope > .hextra-sidebar-item .hextra-sidebar-collapsible-button");
          if (button) {
            button.setAttribute("aria-expanded", wasOpen ? "true" : "false");
          }
        }
        li.classList.remove("hextra-sidebar-filtered-hidden");
      });
      // Restore original text content
      if (originalTexts) {
        originalTexts.forEach(function (html, span) {
          span.innerHTML = html;
        });
      }
      originalState = null;
      originalTexts = null;
    }

    function highlightText(text, query) {
      if (!query) return text;
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const index = lowerText.indexOf(lowerQuery);
      if (index === -1) return text;

      const before = text.substring(0, index);
      const match = text.substring(index, index + query.length);
      const after = text.substring(index + query.length);
      return before + '<mark class="hextra-sidebar-filter-highlight">' + match + '</mark>' + after;
    }

    function filterSidebar(query) {
      const normalizedQuery = query.toLowerCase().trim();

      if (!normalizedQuery) {
        restoreOriginalState();
        clearButton.classList.add("hx:hidden");
        updateStatus("");
        return;
      }

      saveOriginalState();
      clearButton.classList.remove("hx:hidden");

      const items = sidebarContainer.querySelectorAll(".hextra-sidebar-item");
      let matchCount = 0;
      const matchedLis = new Set();

      // First pass: find all matching items and highlight text
      items.forEach(function (item) {
        const filterText = item.dataset.filterText || "";
        const matches = filterText.includes(normalizedQuery);
        const li = item.closest("li");
        const textSpan = item.querySelector("a > span");

        if (matches) {
          matchCount++;
          matchedLis.add(li);

          // Highlight matching text
          if (textSpan && originalTexts && originalTexts.has(textSpan)) {
            const originalText = originalTexts.get(textSpan);
            textSpan.innerHTML = highlightText(originalText, query.trim());
          }

          // Mark all parent LIs as having a match (for hierarchy preservation)
          let parent = li.parentElement ? li.parentElement.closest("li") : null;
          while (parent) {
            matchedLis.add(parent);
            parent = parent.parentElement ? parent.parentElement.closest("li") : null;
          }
        } else {
          // Restore original text for non-matching items
          if (textSpan && originalTexts && originalTexts.has(textSpan)) {
            textSpan.innerHTML = originalTexts.get(textSpan);
          }
        }
      });

      // Second pass: show/hide items
      sidebarContainer.querySelectorAll("ul > li").forEach(function (li) {
        if (matchedLis.has(li)) {
          li.classList.remove("hextra-sidebar-filtered-hidden");
          // Expand all matched items to show children
          li.classList.add("open");
          const button = li.querySelector(":scope > .hextra-sidebar-item .hextra-sidebar-collapsible-button");
          if (button) {
            button.setAttribute("aria-expanded", "true");
          }
        } else {
          li.classList.add("hextra-sidebar-filtered-hidden");
        }
      });

      updateStatus(matchCount);
    }

    function updateStatus(count) {
      if (!statusElement) return;
      if (count === "") {
        statusElement.textContent = "";
      } else if (count === 0) {
        statusElement.textContent = "No matching menu items";
      } else {
        statusElement.textContent = count + " matching menu item" + (count !== 1 ? "s" : "");
      }
    }

    // Debounce function for performance
    function debounce(func, wait) {
      let timeout;
      return function () {
        const args = arguments;
        const later = function () {
          clearTimeout(timeout);
          func.apply(null, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    const debouncedFilter = debounce(function (query) {
      filterSidebar(query);
    }, 150);

    // Event listeners
    filterInput.addEventListener("input", function (e) {
      debouncedFilter(e.target.value);
    });

    clearButton.addEventListener("click", function () {
      filterInput.value = "";
      filterSidebar("");
      filterInput.focus();
    });

    // Keyboard shortcuts
    filterInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (filterInput.value) {
          filterInput.value = "";
          filterSidebar("");
        } else {
          filterInput.blur();
        }
        e.preventDefault();
      }
    });
  });
});
