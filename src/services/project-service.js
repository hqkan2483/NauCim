import {
  getCurrentProjectId,
  setCurrentProjectId,
} from "../state/current-project-state.js";
import { MemoryStore } from "../store/memory-store.js";
import { loadTestData } from "./dataloader.js";

// ============================================================
// PROJECT SERVICE - Manages Project Data Operations
// ============================================================
async function appDataInit() {
  if (MemoryStore.getProjects().length === 0) {
    console.log("🔄 Loading test data into MemoryStore...");
    const testData = await loadTestData();
    MemoryStore.initialize({ projects: testData });
    const savedProjectId = getCurrentProjectId();
    if (savedProjectId) {
      const project = getProjectById(savedProjectId);
      if (project) {
        console.log(`✅ Restored current project ID: ${savedProjectId}`);
      } else {
        setCurrentProjectId(null);
        console.log(
          `⚠️ Saved current project ID ${savedProjectId} not found in loaded projects.`
        );
      }
    }
  }
}

function getAllProjects() {
  return MemoryStore.getAllProjects();
}

function getProjectById(id) {
  const project = MemoryStore.getProjectById(String(id));
  return project ? project : null;
}

function getCurrentProject() {
  const projectId = getCurrentProjectId();
  if (projectId) {
    return getProjectById(projectId);
  } else {
    return null;
  }
}

function createProject() {}

function updateProject() {}

function deleteProject() {
  //  при deleteProject если удалён текущий — выбрать новый и обновить currentProjectId через state-модуль
}

// Exported functions

export {
  getAllProjects,
  getProjectById,
  getCurrentProject,
  appDataInit,
  createProject,
  updateProject,
  deleteProject,
};
