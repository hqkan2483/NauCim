/**
 * Profile Editor Tree Component
 * Manages tree interactions (expand/collapse, select, drag-drop)
 */

/**
 * Initialize tree component
 * @param {string} containerId - Container element ID
 * @param {Object} options - Configuration options
 * @returns {Object} Tree component instance
 */
function initEditorTree(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found`);
    return null;
  }

  const instance = {
    container,
    options: {
      onSelect: options.onSelect || (() => {}),
      onExpand: options.onExpand || (() => {}),
      onCheck: options.onCheck || (() => {}),
      onDragStart: options.onDragStart || (() => {}),
      onDrop: options.onDrop || (() => {}),
      allowDragDrop: options.allowDragDrop !== false,
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
      // Delegated event listeners
      container.addEventListener("click", (e) => this.handleClick(e));

      if (this.options.allowDragDrop) {
        container.addEventListener("dragstart", (e) => this.handleDragStart(e));
        container.addEventListener("dragover", (e) => this.handleDragOver(e));
        container.addEventListener("drop", (e) => this.handleDrop(e));
      }
    },

    /**
     * Handle click events
     */
    handleClick(e) {
      const target = e.target;

      // Toggle expand/collapse
      if (target.closest("[data-action='toggle-expand']")) {
        const treeItem = target.closest("[data-item-key]");
        if (treeItem) {
          const itemKey = treeItem.getAttribute("data-item-key");
          this.toggleExpand(itemKey);
        }
        e.stopPropagation();
        return;
      }

      // Toggle checkbox
      if (target.closest("[data-action='toggle-select']")) {
        const treeItem = target.closest("[data-item-key]");
        if (treeItem) {
          const itemKey = treeItem.getAttribute("data-item-key");
          const checkbox = treeItem.querySelector(".tree-item-checkbox");
          const isChecked = checkbox?.checked || false;

          // ✅ Call callback but DON'T re-render
          this.options.onCheck(itemKey, isChecked);
        }
        e.stopPropagation();
        return;
      }

      // Select item
      const treeItem = target.closest("[data-item-key]");
      if (treeItem) {
        const itemKey = treeItem.getAttribute("data-item-key");
        this.selectItem(itemKey);
      }
    },

    /**
     * Toggle expand/collapse
     * ✅ Manipulate DOM directly, don't re-render
     */
    toggleExpand(itemKey) {
      const treeItem = container.querySelector(`[data-item-key="${itemKey}"]`);
      if (!treeItem) return;

      const toggleBtn = treeItem.querySelector("[data-action='toggle-expand']");
      const childrenContainer = container.querySelector(
        `[data-parent="${itemKey}"]`
      );

      if (!childrenContainer) return;

      const isCollapsed = childrenContainer.classList.contains("collapsed");

      if (isCollapsed) {
        // Expand
        childrenContainer.classList.remove("collapsed");
        if (toggleBtn) toggleBtn.textContent = "▼";
        this.options.onExpand(itemKey, true);
      } else {
        // Collapse
        childrenContainer.classList.add("collapsed");
        if (toggleBtn) toggleBtn.textContent = "▶";
        this.options.onExpand(itemKey, false);
      }
    },

    /**
     * Select item
     * ✅ Manipulate DOM directly, don't re-render
     */
    selectItem(itemKey) {
      // Remove previous selection
      container.querySelectorAll(".tree-item-with-checkbox").forEach((item) => {
        item.classList.remove("tree-item-selected");
      });

      // Add selection to clicked item
      const treeItem = container.querySelector(`[data-item-key="${itemKey}"]`);
      if (treeItem) {
        treeItem.classList.add("tree-item-selected");
      }

      this.options.onSelect(itemKey);
    },

    /**
     * Handle drag start
     */
    handleDragStart(e) {
      const target = e.target;
      if (!target.classList.contains("tree-item-label")) return;

      const treeItem = target.closest("[data-item-key]");
      if (!treeItem) return;

      const itemKey = treeItem.getAttribute("data-item-key");

      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("text/plain", itemKey);

      target.classList.add("dragging");

      this.options.onDragStart(itemKey, e);
    },

    /**
     * Handle drag over
     */
    handleDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },

    /**
     * Handle drop
     */
    handleDrop(e) {
      e.preventDefault();

      const itemKey = e.dataTransfer.getData("text/plain");

      // Remove dragging class
      container.querySelectorAll(".dragging").forEach((el) => {
        el.classList.remove("dragging");
      });

      this.options.onDrop(itemKey, e);
    },

    /**
     * Expand all items
     */
    expandAll() {
      container.querySelectorAll(".tree-children").forEach((children) => {
        children.classList.remove("collapsed");
      });

      container
        .querySelectorAll("[data-action='toggle-expand']")
        .forEach((btn) => {
          if (btn.textContent.trim() === "▶") {
            btn.textContent = "▼";
          }
        });
    },

    /**
     * Collapse all items
     */
    collapseAll() {
      container.querySelectorAll(".tree-children").forEach((children) => {
        children.classList.add("collapsed");
      });

      container
        .querySelectorAll("[data-action='toggle-expand']")
        .forEach((btn) => {
          if (btn.textContent.trim() === "▼") {
            btn.textContent = "▶";
          }
        });
    },

    /**
     * Get checked items
     */
    getCheckedItems() {
      const checked = [];
      container
        .querySelectorAll(".tree-item-checkbox: checked")
        .forEach((checkbox) => {
          const treeItem = checkbox.closest("[data-item-key]");
          if (treeItem) {
            checked.push(treeItem.getAttribute("data-item-key"));
          }
        });
      return checked;
    },

    /**
     * Clear all selections
     */
    clearSelection() {
      container.querySelectorAll(".tree-item-checkbox").forEach((checkbox) => {
        checkbox.checked = false;
      });
    },

    /**
     * Destroy component
     */
    destroy() {
      // Remove event listeners
      const newContainer = this.container.cloneNode(false);
      this.container.parentNode.replaceChild(newContainer, this.container);
    },
  };

  // Bind events on initialization
  instance.bindEvents();

  return instance;
}

export { initEditorTree };
