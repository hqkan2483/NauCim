/**
 * Profile Tree Renderer
 * Renders the right panel tree (profile being edited)
 */

import { renderTreeChildren } from "./available-tree-renderer.js";

/**
 * Render profile tree
 * @param {Object} profileData - Profile data
 * @param {Set} selectedItems - Selected items
 * @param {Set} expandedItems - Expanded items
 * @param {string} activeItem - Active item key
 * @returns {string} HTML string
 */
export function renderProfileTree(profileData, selectedItems, expandedItems, activeItem) {
  if (!profileData.items || profileData.items.length === 0) {
    return `
      <div class="text-center text-muted" style="padding: 40px 20px">
        Профиль пуст.  Выберите элементы слева и перенесите их в профиль.
      </div>
    `;
  }

  return renderTreeChildren(
    profileData.items,
    "profile-root",
    "right",
    selectedItems,
    expandedItems,
    activeItem
  );
}
