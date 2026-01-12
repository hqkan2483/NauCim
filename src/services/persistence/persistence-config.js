const DEFAULT_BACKEND_BASE_URL = "http://localhost:5179";

// === CONFIG ===
// Single config line: switch backend persistence on/off.
// Set to true to use local backend API, false to use local test data.
const BACKEND_ENABLED_ON_STARTUP = true;

export function getBackendBaseUrl() {
  const v = localStorage.getItem("cim.backendBaseUrl");
  return v && v.trim() ? v.trim().replace(/\/$/, "") : DEFAULT_BACKEND_BASE_URL;
}

export function isBackendEnabled() {
  // Single switch point.
  // Set in DevTools console: localStorage.setItem('cim.dataSource','backend')
  return localStorage.getItem("cim.dataSource") === "backend";
}

export function setBackendEnabled(enabled) {
  if (enabled) localStorage.setItem("cim.dataSource", "backend");
  else localStorage.setItem("cim.dataSource", "local");
}

// Apply config at startup so appDataInit() works deterministically.
setBackendEnabled(BACKEND_ENABLED_ON_STARTUP);
