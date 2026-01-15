import {
  getCurrentProjectId,
  setCurrentProjectId,
} from "../state/current-project-state.js";
import { MemoryStore } from "../store/memory-store.js";
import { loadTestData } from "./dataloader.js";
import { generateUUID } from "../utils/uuid.js";
import { isBackendEnabled } from "./persistence/persistence-config.js";
import {
  listProjects as backendListProjects,
  exportProject as backendExportProject,
} from "./backend/project-backend-service.js";
import { attachMemoryStoreBackendSync } from "./persistence/memory-store-backend-sync.js";

// ============================================================
// PROJECT SERVICE - Manages Project Data Operations
// ============================================================
async function appDataInit() {
  if (MemoryStore.getAllProjects().length === 0) {
    if (isBackendEnabled()) {
      try {
        console.log("🔄 Loading projects from backend into MemoryStore...");
        const meta = await backendListProjects();
        const ids = Array.isArray(meta) ? meta.map((p) => p?.id).filter(Boolean) : [];
        const fullProjects = await Promise.all(ids.map((id) => backendExportProject(id)));
        MemoryStore.initialize({ projects: fullProjects.filter(Boolean) });
      } catch (e) {
        console.warn("⚠️ Backend unavailable, falling back to test data", e);
        const testData = await loadTestData();
        MemoryStore.initialize({ projects: testData });
      }
    } else {
      console.log("🔄 Loading test data into MemoryStore...");
      const testData = await loadTestData();
      MemoryStore.initialize({ projects: testData });
    }

    // One-place switch: if backend enabled, any MemoryStore project mutations will persist.
    attachMemoryStoreBackendSync(MemoryStore);

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

/**
 * Create a new project.
 * @param {object} payload - { name, description?, version?  }
 * @returns {object|null} - Created project or null on error
 */
function createProject(payload) {
  if (!payload || ! payload.name || !payload.name.trim()) {
    console.error("[createProject] Name is required");
    return null;
  }

  const trimmedName = payload.name.trim();

  // Validate name length
  if (trimmedName.length < 3) {
    console.error("[createProject] Name must be at least 3 characters");
    return null;
  }

  // Validate name uniqueness
  if (!isProjectNameUnique(trimmedName)) {
    console.error(`[createProject] Project name "${trimmedName}" already exists`);
    return null;
  }

  const newProject = {
    id: generateUUID(),
    name: trimmedName,
    description: payload.description ?  payload.description.trim() : "",
    version: payload.version ?  payload.version.trim() : "0.1",
    createDate: new Date().toISOString(),
    modifyDate: new Date().toISOString(),
    accessRights: "readWrite",
    models: [],
    profiles: [],
  };

  MemoryStore.addProject(newProject);
  console.log(`✅ Project created:  ${newProject.name} (id: ${newProject.id})`);

  return newProject;
}

/**
 * Update an existing project.
 * @param {string} projectId
 * @param {object} updates - { name?, description?, version?, models?, profiles? }
 * @returns {object|null} - Updated project or null on error
 */
function updateProject(projectId, updates) {
  if (!projectId) {
    console.error("[updateProject] Project ID is required");
    return null;
  }

  const project = MemoryStore.getProjectById(String(projectId));
  if (!project) {
    console.error(`[updateProject] Project not found: ${projectId}`);
    return null;
  }

  // Validate name if provided
  if (updates.name !== undefined) {
    const trimmedName = updates.name.trim();

    if (trimmedName.length < 3) {
      console.error("[updateProject] Name must be at least 3 characters");
      return null;
    }

    if (!isProjectNameUnique(trimmedName, projectId)) {
      console.error(`[updateProject] Project name "${trimmedName}" already exists`);
      return null;
    }

    updates.name = trimmedName;
  }

  const updatedProject = {
    ...project,
    ...updates,
    id: project.id,
    modifyDate: new Date().toISOString(),
  };

  MemoryStore.updateProject(String(projectId), updatedProject);
  console.log(`✅ Project updated: ${updatedProject.name} (id: ${projectId})`);

  return updatedProject;
}

/**
 * Delete a project by ID.
 * If deleted project is current, select next available project.
 * @param {string} projectId
 * @returns {boolean} - true if deleted, false if not found
 */
function deleteProject(projectId) {
  if (!projectId) {
    console.error("[deleteProject] Project ID is required");
    return false;
  }

  const project = getProjectById(projectId);
  if (!project) {
    console.error(`[deleteProject] Project not found: ${projectId}`);
    return false;
  }

  MemoryStore.deleteProject(projectId);

  // If deleted project was current, select another one
  if (getCurrentProjectId() === projectId) {
    {
      setCurrentProjectId(null);
      console.log("ℹ️ No projects remaining");
    }
  }

  console.log(`✅ Project deleted: ${project.name} (id: ${projectId})`);
  return true;
}

/**
 * Check if project name is unique
 * @param {string} name - Project name to check
 * @param {string} excludeId - Project ID to exclude from check (for edit)
 * @returns {boolean} - true if name is unique
 */
export function isProjectNameUnique(name, excludeId = null) {
  const projects = MemoryStore.getAllProjects();
  const trimmedName = name.trim().toLowerCase();

  return !projects.some((p) => {
    // Skip the project being edited
    if (excludeId && String(p.id) === String(excludeId)) {
      return false;
    }
    return p.name.trim().toLowerCase() === trimmedName;
  });
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
