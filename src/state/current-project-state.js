const STORAGE_KEY = "cim.currentProjectId";

function getCurrentProjectId() {
  return localStorage.getItem(STORAGE_KEY);
}

function setCurrentProjectId(projectId) {
  if (projectId) {
    localStorage.setItem(STORAGE_KEY, String(projectId));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export { getCurrentProjectId, setCurrentProjectId };
