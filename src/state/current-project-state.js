function getCurrentProjectId() {
  let id = localStorage.getItem("cim.currentProjectId");
  return id? id : null;
}

function setCurrentProject(projectId) {
  if (projectId) {
    localStorage.setItem("cim.currentProjectId", projectId);
  } else {
    localStorage.removeItem("cim.currentProjectId");
  }
}
