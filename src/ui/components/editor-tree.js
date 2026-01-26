/**
 * Profile Editor Tree Component
 * Manages tree interactions (expand/collapse, select, drag-drop)
 */

import { escapeAttrSelectorValue } from "../../utils/text-utils.js";

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
     * Get tree item element by itemKey.
     * @param {string} itemKey - Node key.
     * @returns {HTMLElement|null} Element.
     */
    getTreeItemEl(itemKey) {
      if (!itemKey) return null;
      const key = escapeAttrSelectorValue(itemKey);
      return container.querySelector(`[data-item-key="${key}"]`);
    },

    /**
     * Get children container element for node.
     * @param {string} itemKey - Node key.
     * @returns {HTMLElement|null} Children container.
     */
    getChildrenContainerEl(itemKey) {
      if (!itemKey) return null;
      const key = escapeAttrSelectorValue(itemKey);
      return container.querySelector(`[data-parent="${key}"]`);
    },

    /**
     * Get checkbox element for node.
     * @param {string} itemKey - Node key.
     * @returns {HTMLInputElement|null} Checkbox.
     */
    getCheckboxEl(itemKey) {
      const treeItem = this.getTreeItemEl(itemKey);
      const checkbox = treeItem?.querySelector(".tree-item-checkbox") || null;
      return checkbox instanceof HTMLInputElement ? checkbox : null;
    },

    /**
     * Get direct child node keys for a parent key.
     * Direct children are the first-level tree-item elements inside the children container.
     * @param {string} parentKey - Parent node key.
     * @returns {string[]} Array of child keys.
     */
    getDirectChildKeys(parentKey) {
      const childrenContainer = this.getChildrenContainerEl(parentKey);
      if (!childrenContainer) return [];

      return Array.from(childrenContainer.children)
        .filter((el) => el instanceof HTMLElement && el.hasAttribute("data-item-key"))
        .map((el) => el.getAttribute("data-item-key") || "")
        .filter(Boolean);
    },

    /**
     * Set checkbox state for a node and optionally emit onCheck when "checked" changes.
      *
      * Note: disabled checkboxes are treated as non-interactive and are not mutated
      * by this component (including parent subtree toggles).
     * @param {string} itemKey - Node key.
     * @param {{checked?: boolean, indeterminate?: boolean, emitCheck?: boolean}} state - Desired state.
     */
    setCheckboxState(itemKey, state = {}) {
      const checkbox = this.getCheckboxEl(itemKey);
      if (!checkbox) return;

      // Disabled nodes are not user-selectable and should not be mutated by
      // parent selection toggles. This keeps "blocked" classes stable.
      if (checkbox.disabled) return;

      const nextChecked = state.checked ?? checkbox.checked;
      const nextIndeterminate = state.indeterminate ?? checkbox.indeterminate;
      const emitCheck = state.emitCheck === true;

      const prevChecked = checkbox.checked;

      checkbox.checked = Boolean(nextChecked);
      checkbox.indeterminate = Boolean(nextIndeterminate);

      if (emitCheck && prevChecked !== checkbox.checked) {
        this.options.onCheck(itemKey, checkbox.checked);
      }
    },

    /**
     * Apply checked state to all descendant nodes (and optionally to self).
     * @param {string} itemKey - Root node key.
     * @param {boolean} checked - Target checked state.
     * @param {{includeSelf?: boolean}} opts - Options.
     */
    setSubtreeChecked(itemKey, checked, opts = {}) {
      const includeSelf = opts.includeSelf !== false;

      if (includeSelf) {
        this.setCheckboxState(itemKey, {
          checked,
          indeterminate: false,
          emitCheck: true,
        });
      }

      const childrenContainer = this.getChildrenContainerEl(itemKey);
      if (!childrenContainer) return;

      childrenContainer
        .querySelectorAll("[data-item-key]")
        .forEach((childTreeItem) => {
          const key = childTreeItem.getAttribute("data-item-key") || "";
          if (!key) return;

          this.setCheckboxState(key, {
            checked,
            indeterminate: false,
            emitCheck: true,
          });
        });
    },

    /**
     * Recompute checkbox state (checked/indeterminate) for a node based on direct children.
     * - checked=true when ALL direct children are checked
     * - indeterminate=true when SOME direct children are checked or indeterminate
      *
      * Disabled child checkboxes are ignored (they do not affect parent indicators).
     * @param {string} itemKey - Node key.
     */
    refreshStateForItem(itemKey) {
      const checkbox = this.getCheckboxEl(itemKey);
      if (!checkbox) return;

      const childKeys = this.getDirectChildKeys(itemKey);
      if (childKeys.length === 0) {
        // Leaf
        this.setCheckboxState(itemKey, { indeterminate: false });
        return;
      }

      const childCheckboxes = childKeys
        .map((k) => this.getCheckboxEl(k))
        .filter((cb) => cb && !cb.disabled);

      if (childCheckboxes.length === 0) {
        this.setCheckboxState(itemKey, { indeterminate: false });
        return;
      }

      const allChecked = childCheckboxes.every((cb) => cb.checked);
      const anyMarked = childCheckboxes.some((cb) => cb.checked || cb.indeterminate);

      if (allChecked) {
        this.setCheckboxState(itemKey, {
          checked: true,
          indeterminate: false,
          emitCheck: true,
        });
        return;
      }

      if (anyMarked) {
        this.setCheckboxState(itemKey, {
          checked: false,
          indeterminate: true,
          emitCheck: true,
        });
        return;
      }

      this.setCheckboxState(itemKey, {
        checked: false,
        indeterminate: false,
        emitCheck: true,
      });
    },

    /**
     * Refresh state for this node and all its ancestors up to the root.
     * @param {string} itemKey - Start node key.
     */
    refreshIndicatorsUpToRoot(itemKey) {
      let currentKey = itemKey;
      const visited = new Set();

      while (currentKey && !visited.has(currentKey)) {
        visited.add(currentKey);
        this.refreshStateForItem(currentKey);

        const treeItem = this.getTreeItemEl(currentKey);
        if (!treeItem) break;

        const parentChildrenContainer = treeItem.closest(".tree-children[data-parent]");
        const parentKey = parentChildrenContainer?.getAttribute("data-parent") || "";
        if (!parentKey) break;

        currentKey = parentKey;
      }
    },

    /**
     * Recompute checkbox state (checked/indeterminate) for the whole tree.
     * Useful after external re-render (innerHTML replacement).
     */
    refreshAllIndicators() {
      // Walk all nodes bottom-up (deepest first) so parents compute after children.
      const nodes = Array.from(container.querySelectorAll("[data-item-key]"));
      nodes
        .sort((a, b) => {
          const aDepth = String(a.getAttribute("data-item-key") || "").split("-pkg-").length;
          const bDepth = String(b.getAttribute("data-item-key") || "").split("-pkg-").length;
          return bDepth - aDepth;
        })
        .forEach((el) => {
          const key = el.getAttribute("data-item-key") || "";
          if (key) this.refreshStateForItem(key);
        });
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
          if (checkbox instanceof HTMLInputElement && checkbox.disabled) {
            e.stopPropagation();
            return;
          }
          const isChecked = checkbox?.checked || false;

          // ✅ Call callback but DON'T re-render
          this.options.onCheck(itemKey, isChecked);

          // ✅ If node has children: toggle all descendants to match
          this.setSubtreeChecked(itemKey, isChecked, { includeSelf: false });

          // ✅ Recompute parent states up to root
          this.refreshIndicatorsUpToRoot(itemKey);
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
        checkbox.indeterminate = false;
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
