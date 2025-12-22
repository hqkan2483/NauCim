const STORAGE_KEY = "cim.currentProjectId";

function getCurrentProjectId() {
  let id = localStorage.getItem(STORAGE_KEY);
  return id? id : null;
}

function setCurrentProjectId(projectId) {
  if (projectId) {
    localStorage.setItem(STORAGE_KEY, String(projectId));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export { getCurrentProjectId, setCurrentProjectId };
