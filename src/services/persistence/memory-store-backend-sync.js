import { isBackendEnabled } from "./persistence-config.js";
import {
  deleteProject as backendDeleteProject,
  importProject as backendImportProject,
} from "../backend/project-backend-service.js";

let isAttached = false;

export function attachMemoryStoreBackendSync(MemoryStore) {
  if (!isBackendEnabled()) return;
  if (!MemoryStore || typeof MemoryStore !== "object") return;
  if (isAttached) return;

  const original = {
    addProject: MemoryStore.addProject.bind(MemoryStore),
    updateProject: MemoryStore.updateProject.bind(MemoryStore),
    deleteProject: MemoryStore.deleteProject.bind(MemoryStore),
  };

  const debounceTimers = new Map();

  function scheduleSave(project) {
    if (!project?.id) return;
    const projectId = String(project.id);

    const prev = debounceTimers.get(projectId);
    if (prev) clearTimeout(prev);

    const t = setTimeout(() => {
      debounceTimers.delete(projectId);
      backendImportProject(project).catch((e) => {
        console.error("[backend] save failed", e);
      });
    }, 400);

    debounceTimers.set(projectId, t);
  }

  MemoryStore.addProject = (project) => {
    const res = original.addProject(project);
    scheduleSave(project);
    return res;
  };

  MemoryStore.updateProject = (projectId, updates) => {
    const res = original.updateProject(projectId, updates);
    const project = MemoryStore.getProjectById(String(projectId));
    if (project) scheduleSave(project);
    return res;
  };

  MemoryStore.deleteProject = (projectId) => {
    const res = original.deleteProject(projectId);
    backendDeleteProject(projectId).catch((e) => {
      console.error("[backend] delete failed", e);
    });
    return res;
  };

  isAttached = true;
}
