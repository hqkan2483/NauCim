import {
  getCurrentProjectId,
  setCurrentProjectId,
} from "../state/current-project-state.js";
import { MemoryStore } from "../store/memory-store.js";
import { loadTestData } from "./dataloader.js";
import { generateUUID } from "../utils/uuid.js";

// ============================================================
// PROJECT SERVICE - Manages Project Data Operations
// ============================================================
async function appDataInit() {
  if (MemoryStore.getAllProjects().length === 0) {
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

  const newProject = {
    id:  generateUUID(),
    name: payload.name. trim(),
    description: payload. description ?  payload.description.trim() : "",
    version: payload.version ?  payload.version.trim() : "1.0",
    models: [],
    profiles: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  MemoryStore.addProject(newProject);

  // Auto-select new project as current
  setCurrentProjectId(newProject.id);

  console.log(`✅ Project created: ${newProject.name} (id: ${newProject.id})`);
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

  const project = getProjectById(projectId);
  if (!project) {
    console.error(`[updateProject] Project not found: ${projectId}`);
    return null;
  }

  // Merge updates
  const updated = {
    ...project,
    ... updates,
    id: project.id, // ID cannot be changed
    updatedAt: new Date().toISOString(),
  };

  // Validate name
  if (updated.name && ! updated.name.trim()) {
    console.error("[updateProject] Name cannot be empty");
    return null;
  }

  MemoryStore.updateProject(projectId, updated);

  console.log(`✅ Project updated: ${updated.name} (id: ${projectId})`);
  return updated;
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
