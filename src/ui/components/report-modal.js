import { openModal, closeModal } from "../modal.js";
import { showToast } from "./toast.js";

let initialized = false;
let lastPlainText = "";

/**
 * @typedef {{ title: string, items: Array<string|{ text: string, kind?: "success"|"info"|"error" }> }} ReportSection
 */

/**
 * @returns {HTMLElement|null}
 */
function getModalEl() {
  return document.getElementById("report-modal");
}

/**
 * @returns {{ modal: HTMLElement, titleEl: HTMLElement, contentEl: HTMLElement, copyBtn: HTMLButtonElement }|null}
 */
function getEls() {
  const modal = getModalEl();
  if (!modal) return null;

  const titleEl = modal.querySelector("#report-modal-title");
  const contentEl = modal.querySelector("#report-modal-content");
  const copyBtn = modal.querySelector("#report-modal-copy-btn");

  if (!(titleEl instanceof HTMLElement)) return null;
  if (!(contentEl instanceof HTMLElement)) return null;
  if (!(copyBtn instanceof HTMLButtonElement)) return null;

  return { modal, titleEl, contentEl, copyBtn };
}

/**
 * @param {string} text
 * @returns {Promise<boolean>}
 */
async function copyToClipboard(text) {
  const value = String(text ?? "");
  if (!value) return false;

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fallback below.
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return Boolean(ok);
  } catch {
    return false;
  }
}

/**
 * Ensure report modal buttons are wired once.
 *
 * @returns {void}
 */
export function initReportModal() {
  if (initialized) return;

  const els = getEls();
  if (!els) return;

  const { modal, copyBtn } = els;

  copyBtn.addEventListener("click", async () => {
    const ok = await copyToClipboard(lastPlainText);
    showToast(ok ? "Отчёт скопирован" : "Не удалось скопировать отчёт", {
      type: ok ? "success" : "error",
      timeoutMs: 3500,
    });
  });

  // Optional: allow double-click on content to close.
  modal.addEventListener("dblclick", (e) => {
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (!target) return;
    if (target.closest("button, a, input, textarea, select")) return;
    if (!target.closest(".modal-content")) return;
    closeModal(modal);
  });

  initialized = true;
}

/**
 * Open modal with a full operation report.
 *
 * @param {{ title: string, summaryLines?: string[], sections?: ReportSection[] }} params
 * @returns {void}
 */
export function openReportModal({ title, summaryLines = [], sections = [] } = {}) {
  const els = getEls();
  if (!els) {
    showToast("Не удалось открыть модалку отчёта (шаблон не загружен)", { type: "error" });
    return;
  }

  initReportModal();

  const { modal, titleEl, contentEl } = els;

  titleEl.textContent = String(title ?? "Отчёт");
  contentEl.replaceChildren();

  const parts = [];

  const wrapper = document.createElement("div");
  wrapper.className = "report-modal";

  if (Array.isArray(summaryLines) && summaryLines.length) {
    const summary = document.createElement("div");
    summary.className = "report-modal__summary";

    for (const line of summaryLines) {
      const p = document.createElement("div");
      p.textContent = String(line ?? "");
      summary.appendChild(p);
      parts.push(String(line ?? ""));
    }

    wrapper.appendChild(summary);
    parts.push("");
  }

  const normalizedSections = Array.isArray(sections) ? sections : [];
  for (const section of normalizedSections) {
    const sectionTitle = String(section?.title ?? "").trim();
    const items = Array.isArray(section?.items) ? section.items : [];

    if (!sectionTitle && items.length === 0) continue;

    const block = document.createElement("div");
    block.className = "report-modal__section";

    if (sectionTitle) {
      const h = document.createElement("div");
      h.className = "report-modal__section-title";
      h.textContent = sectionTitle;
      block.appendChild(h);
      parts.push(sectionTitle);
    }

    const list = document.createElement("ul");
    list.className = "report-modal__list";

    for (const raw of items) {
      const obj = typeof raw === "string" ? { text: raw } : raw;
      const text = String(obj?.text ?? "").trim();
      if (!text) continue;

      const li = document.createElement("li");
      li.textContent = text;

      const kind = String(obj?.kind ?? "").trim();
      if (kind) li.setAttribute("data-kind", kind);

      list.appendChild(li);
      parts.push(`- ${text}`);
    }

    block.appendChild(list);
    wrapper.appendChild(block);
    parts.push("");
  }

  contentEl.appendChild(wrapper);
  lastPlainText = parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  openModal(modal);
}
