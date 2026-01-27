/**
 * Select Location Modal
 *
 * A small reusable modal that lets the user choose one item out of many.
 * Used by profile-editor when a package name matches multiple locations
 * across different models/profiles.
 */

import { openModal, closeModal } from "../modal.js";
import { showToast } from "./toast.js";

let initialized = false;

/** @type {Array<{ id: string, title: string, subtitle?: string }>} */
let currentItems = [];

/**
 * Selection handler.
 * Should return true when navigation succeeded (modal will close), otherwise false.
 * Can be async.
 * @type {(id: string) => (boolean|Promise<boolean>)}
 */
let currentOnSelect = () => false;

/**
 * @returns {HTMLElement|null}
 */
function getModalEl() {
  return document.getElementById("select-location-modal");
}

/**
 * @returns {{ modal: HTMLElement, titleEl: HTMLElement, hintEl: HTMLElement, listEl: HTMLElement }|null}
 */
function getEls() {
  const modal = getModalEl();
  if (!modal) return null;

  const titleEl = modal.querySelector("#select-location-modal-title");
  const hintEl = modal.querySelector("#select-location-modal-hint");
  const listEl = modal.querySelector("#select-location-modal-list");

  if (!(titleEl instanceof HTMLElement)) return null;
  if (!(hintEl instanceof HTMLElement)) return null;
  if (!(listEl instanceof HTMLElement)) return null;

  return { modal, titleEl, hintEl, listEl };
}

/**
 * Ensure modal event bindings are attached once.
 *
 * @returns {void}
 */
export function initSelectLocationModal() {
  if (initialized) return;

  const els = getEls();
  if (!els) return;

  const { modal, listEl } = els;

  listEl.addEventListener("click", async (e) => {
    const target = e.target instanceof HTMLElement ? e.target : null;
    if (!target) return;

    const itemEl = target.closest("[data-select-location-id]");
    if (!(itemEl instanceof HTMLElement)) return;

    const id = String(itemEl.getAttribute("data-select-location-id") || "").trim();
    if (!id) return;

    // NOTE: Do NOT close the modal before navigation completes.
    // The caller reports success via boolean/Promise<boolean>.
    const onSelect = currentOnSelect;
    try {
      const ok = await onSelect(id);
      if (ok) {
        closeModal(modal);
      } else {
        showToast("Не удалось выполнить переход (возможна рассинхронизация данных)", {
          type: "error",
          timeoutMs: 5000,
        });
      }
    } catch (err) {
      console.error("[select-location-modal] onSelect failed:", err);
      showToast("Ошибка перехода (возможна рассинхронизация данных)", {
        type: "error",
        timeoutMs: 5000,
      });
    }
  });

  // Reset state when closed.
  modal.addEventListener("modal:afterclose", () => {
    currentItems = [];
    currentOnSelect = () => false;
  });

  initialized = true;
}

/**
 * Open the modal with a selectable list.
 *
 * @param {{ title: string, hint?: string, items: Array<{ id: string, title: string, subtitle?: string }>, onSelect: (id: string) => (boolean|Promise<boolean>) }} params
 * @returns {void}
 */
export function openSelectLocationModal({ title, hint = "", items = [], onSelect } = {}) {
  const els = getEls();
  if (!els) {
    showToast("Не удалось открыть модалку выбора (шаблон не загружен)", { type: "error" });
    return;
  }

  initSelectLocationModal();

  const { modal, titleEl, hintEl, listEl } = els;

  titleEl.textContent = String(title ?? "Выбор");
  hintEl.textContent = String(hint ?? "");

  currentItems = Array.isArray(items) ? items : [];
  currentOnSelect = typeof onSelect === "function" ? onSelect : () => false;

  listEl.replaceChildren();

  if (!currentItems.length) {
    const empty = document.createElement("div");
    empty.className = "text-muted";
    empty.textContent = "Нет вариантов";
    listEl.appendChild(empty);
    openModal(modal);
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "select-location-modal__items";

  for (const item of currentItems) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "select-location-modal__item";
    btn.setAttribute("data-select-location-id", String(item?.id ?? ""));

    const title = document.createElement("div");
    title.className = "select-location-modal__item-title";
    title.textContent = String(item?.title ?? "");

    const subtitle = String(item?.subtitle ?? "").trim();
    if (subtitle) {
      const sub = document.createElement("div");
      sub.className = "select-location-modal__item-subtitle";
      sub.textContent = subtitle;
      btn.appendChild(title);
      btn.appendChild(sub);
    } else {
      btn.appendChild(title);
    }

    wrapper.appendChild(btn);
  }

  listEl.appendChild(wrapper);
  openModal(modal);
}
