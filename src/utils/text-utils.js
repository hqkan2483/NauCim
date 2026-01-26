function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function esc(v) {
  if (v === undefined || v === null) return "";
  const d = document.createElement("div");
  d.textContent = String(v);
  return d.innerHTML;
}

/**
 * Escape a value for usage inside a CSS attribute selector, e.g.:
 * `querySelector('[data-item-key="<value>"]')`.
 *
 * Prefer native `CSS.escape` when available.
 *
 * @param {string|number|null|undefined} value - Raw attribute value.
 * @returns {string} Escaped selector-safe value.
 */
function escapeAttrSelectorValue(value) {
  const s = String(value ?? "");

  // Modern browsers (Chrome/FF/Safari) support CSS.escape.
  // It produces a valid CSS identifier escape which is safe in selectors.
  if (globalThis.CSS && typeof globalThis.CSS.escape === "function") {
    return globalThis.CSS.escape(s);
  }

  // Fallback: minimal escaping for quoted attribute value.
  return s.replace(/\\/g, "\\\\").replace(/\"/g, '\\"');
}

/**
 * Convert any id value to a canonical string id.
 * UI contract requires ids to be strings.
 *
 * @param {string|number|null|undefined} value - Raw id value.
 * @returns {string} Canonical id string (or empty string).
 */
function toIdString(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export { escapeHtml, esc, escapeAttrSelectorValue, toIdString };
