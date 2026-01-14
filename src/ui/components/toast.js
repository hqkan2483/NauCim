const DEFAULT_TIMEOUT_MS = 3500;

function ensureContainer() {
  let el = document.getElementById("toast-container");
  if (el) return el;

  el = document.createElement("div");
  el.id = "toast-container";
  el.className = "toast-container";
  document.body.appendChild(el);
  return el;
}

export function showToast(message, { type = "info", timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const text = String(message ?? "").trim();
  if (!text) return;

  const container = ensureContainer();

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  const body = document.createElement("div");
  body.className = "toast__body";
  body.textContent = text;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "toast__close";
  closeBtn.textContent = "×";
  closeBtn.setAttribute("aria-label", "Закрыть уведомление");

  closeBtn.addEventListener("click", () => {
    toast.remove();
  });

  toast.appendChild(body);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  if (timeoutMs > 0) {
    window.setTimeout(() => {
      toast.remove();
    }, timeoutMs);
  }
}
