// Diagram mode controller (Project Details page)
// Step 1: layout + split resize + persistence + placeholder.

const STORAGE_KEY_DIAGRAM_MODE = "cim.diagramMode";
const STORAGE_KEY_DIAGRAM_SPLIT_RATIO = "cim.diagramSplitRatio";

function getDiagramModeToggleButton() {
  return document.getElementById("toggle-diagram-mode");
}

function setDiagramModeToggleButtonLabel(isDiagramModeEnabled) {
  const btn = getDiagramModeToggleButton();
  if (!btn) return;

  // Keep icon consistent with existing toolbar button.
  btn.textContent = isDiagramModeEnabled
    ? "📐 Стандартный режим"
    : "📐 Режим диаграммы";
}

function getDiagramsContainer() {
  return document.getElementById("diagrams-container");
}

function getDiagramResizeHandle() {
  return document.getElementById("diagram-resize-handle");
}

function getContentArea() {
  return document.querySelector(".main-content__content-area.content-area");
}

function showDiagramsContainer() {
  const el = getDiagramsContainer();
  if (el) el.classList.remove("hidden");
}

function hideDiagramsContainer() {
  const el = getDiagramsContainer();
  if (el) el.classList.add("hidden");
}

function showDiagramResizeHandle() {
  const el = getDiagramResizeHandle();
  if (el) el.classList.remove("hidden");
}

function hideDiagramResizeHandle() {
  const el = getDiagramResizeHandle();
  if (el) el.classList.add("hidden");
}

function renderDiagramsPlaceholder() {
  return `
    <div class="diagram-mode-placeholder">
      Работа с диаграммами будет реализована позже.
    </div>
  `;
}

function renderDiagramsContainerContentOnce() {
  const diagrams = getDiagramsContainer();
  if (!diagrams) return;

  if (diagrams.dataset.initialized === "1") return;
  diagrams.innerHTML = renderDiagramsPlaceholder();
  diagrams.dataset.initialized = "1";
}

function getDiagramSplitRatio() {
  const raw = localStorage.getItem(STORAGE_KEY_DIAGRAM_SPLIT_RATIO);
  const parsed = raw ? Number.parseFloat(raw) : NaN;
  if (Number.isFinite(parsed)) {
    return Math.min(0.85, Math.max(0.15, parsed));
  }
  return 2 / 3;
}

function setDiagramSplitRatio(ratio) {
  const clamped = Math.min(0.85, Math.max(0.15, ratio));
  localStorage.setItem(STORAGE_KEY_DIAGRAM_SPLIT_RATIO, String(clamped));
}

function initDiagramMode({
  hideModelContainer,
  hideProfileContainer,
  showItemContainer,
  clearItemDetailsContent,
  getSelectedTreeType,
} = {}) {
  let isEnabled = false;
  let standardModeVisibilitySnapshot = null;

  const applySplitLayout = () => {
    if (!isEnabled) return;

    const contentArea = getContentArea();
    const diagrams = getDiagramsContainer();
    const handle = getDiagramResizeHandle();
    const item = document.getElementById("item-container");
    if (!contentArea || !diagrams || !handle || !item) return;

    const total = contentArea.getBoundingClientRect().height;
    if (!total || total <= 0) return;

    const ratio = getDiagramSplitRatio();
    const handleHeight = handle.getBoundingClientRect().height || 8;
    const available = Math.max(0, total - handleHeight);
    const minPx = 120;
    const maxPx = Math.max(minPx, available - minPx);

    const diagramsPx = Math.min(
      maxPx,
      Math.max(minPx, Math.round(available * ratio))
    );

    diagrams.style.flex = `0 0 ${diagramsPx}px`;
    handle.style.flex = `0 0 ${handleHeight}px`;
    item.style.flex = "1 1 auto";
  };

  const resetSplitLayout = () => {
    const diagrams = getDiagramsContainer();
    const handle = getDiagramResizeHandle();
    const item = document.getElementById("item-container");

    if (diagrams) diagrams.style.flex = "";
    if (handle) handle.style.flex = "";
    if (item) item.style.flex = "";
  };

  const ensureDiagramModeVisibility = ({
    clearItem = false,
    clearItemIfNotClassPackage = false,
  } = {}) => {
    if (!isEnabled) return;

    if (typeof hideModelContainer === "function") hideModelContainer();
    if (typeof hideProfileContainer === "function") hideProfileContainer();

    showDiagramsContainer();
    renderDiagramsContainerContentOnce();
    showDiagramResizeHandle();

    if (typeof showItemContainer === "function") showItemContainer();

    if (typeof clearItemDetailsContent === "function") {
      if (clearItem) {
        clearItemDetailsContent();
      } else if (clearItemIfNotClassPackage) {
        const t =
          typeof getSelectedTreeType === "function"
            ? getSelectedTreeType()
            : null;
        if (t !== "class" && t !== "package") {
          clearItemDetailsContent();
        }
      }
    }

    requestAnimationFrame(() => applySplitLayout());
  };

  const onWindowResize = () => applySplitLayout();

  const enter = ({ persist = true } = {}) => {
    isEnabled = true;
    if (persist) localStorage.setItem(STORAGE_KEY_DIAGRAM_MODE, "1");

    setDiagramModeToggleButtonLabel(true);

    standardModeVisibilitySnapshot = {
      modelsHidden:
        document
          .getElementById("models-container")
          ?.classList.contains("hidden") ?? true,
      profilesHidden:
        document
          .getElementById("profiles-container")
          ?.classList.contains("hidden") ?? true,
      itemHidden:
        document
          .getElementById("item-container")
          ?.classList.contains("hidden") ?? true,
    };

    document.body.classList.add("diagram-mode");
    ensureDiagramModeVisibility({ clearItemIfNotClassPackage: true });

    window.addEventListener("resize", onWindowResize);
  };

  const exit = ({ persist = true } = {}) => {
    isEnabled = false;
    if (persist) localStorage.setItem(STORAGE_KEY_DIAGRAM_MODE, "0");

    setDiagramModeToggleButtonLabel(false);

    document.body.classList.remove("diagram-mode");
    hideDiagramsContainer();
    hideDiagramResizeHandle();
    resetSplitLayout();

    window.removeEventListener("resize", onWindowResize);

    const snap = standardModeVisibilitySnapshot;
    if (snap) {
      const models = document.getElementById("models-container");
      const profiles = document.getElementById("profiles-container");
      const item = document.getElementById("item-container");
      if (models) models.classList.toggle("hidden", snap.modelsHidden);
      if (profiles) profiles.classList.toggle("hidden", snap.profilesHidden);
      if (item) item.classList.toggle("hidden", snap.itemHidden);
    }

    standardModeVisibilitySnapshot = null;
  };

  const toggle = () => {
    if (isEnabled) exit();
    else enter();
  };

  const restoreFromStorage = () => {
    const flag = localStorage.getItem(STORAGE_KEY_DIAGRAM_MODE);
    if (flag === "1") {
      enter({ persist: false });
    } else {
      setDiagramModeToggleButtonLabel(false);
    }
  };

  const initResize = () => {
    const handle = getDiagramResizeHandle();
    const contentArea = getContentArea();
    if (!handle || !contentArea) return;

    let isDragging = false;

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const rect = contentArea.getBoundingClientRect();
      const total = rect.height;
      const handleHeight = handle.getBoundingClientRect().height || 8;
      const available = Math.max(0, total - handleHeight);
      if (available <= 0) return;

      const minPx = 120;
      const maxPx = Math.max(minPx, available - minPx);
      const y = e.clientY - rect.top;
      const diagramsPx = Math.min(maxPx, Math.max(minPx, y));
      const ratio = diagramsPx / available;

      setDiagramSplitRatio(ratio);
      applySplitLayout();
    };

    const stopDragging = () => {
      if (!isDragging) return;
      isDragging = false;
      document.body.classList.remove("is-resizing");
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", stopDragging);
    };

    handle.addEventListener("mousedown", (e) => {
      if (!isEnabled) return;
      e.preventDefault();
      isDragging = true;
      document.body.classList.add("is-resizing");
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", stopDragging);
    });
  };

  // Bind once
  initResize();

  return {
    isEnabled: () => isEnabled,
    enter,
    exit,
    toggle,
    restoreFromStorage,
    // Call from page when selection/context changes while mode is enabled
    sync: ensureDiagramModeVisibility,
  };
}

export { initDiagramMode };
