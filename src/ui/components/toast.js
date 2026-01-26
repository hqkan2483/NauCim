const DEFAULT_TIMEOUT_MS = 3500;

/**
 * @typedef {{
 *  label: string,
 *  onClick?: () => void,
 *  dismiss?: boolean
 * }} ToastAction
 */

function ensureContainer() {
  let el = document.getElementById("toast-container");
  if (el) return el;

  el = document.createElement("div");
  el.id = "toast-container";
  el.className = "toast-container";
  document.body.appendChild(el);
  return el;
}

/**
 * Show a toast notification.
 *
 * @param {string} message
 * @param {{ type?: "info"|"success"|"error", timeoutMs?: number, actions?: ToastAction[] }} [options]
 * @returns {void}
 */
export function showToast(message, options = {}) {
  const text = String(message ?? "").trim();
  if (!text) return;

  const type = String(options?.type ?? "info");
  const timeoutMs = typeof options?.timeoutMs === "number" ? options.timeoutMs : DEFAULT_TIMEOUT_MS;
  const actions = Array.isArray(options?.actions) ? options.actions : [];

  const container = ensureContainer();

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  const body = document.createElement("div");
  body.className = "toast__body";

  const messageEl = document.createElement("div");
  messageEl.className = "toast__message";
  messageEl.textContent = text;
  body.appendChild(messageEl);

  if (actions.length) {
    const actionsEl = document.createElement("div");
    actionsEl.className = "toast__actions";

    for (const a of actions) {
      if (!a) continue;
      const label = String(a.label ?? "").trim();
      if (!label) continue;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "toast__action";
      btn.textContent = label;

      const dismiss = a.dismiss !== false;
      const onClick = typeof a.onClick === "function" ? a.onClick : null;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        try {
          onClick?.();
        } finally {
          if (dismiss) toast.remove();
        }
      });

      actionsEl.appendChild(btn);
    }

    if (actionsEl.childElementCount > 0) {
      body.appendChild(actionsEl);
    }
  }

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
