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


export { escapeHtml, esc };
