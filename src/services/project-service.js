import {
  getCurrentProjectId,
  setCurrentProjectId,
} from "../state/current-project-state.js";
import { generateUUID } from "../utils/uuid.js";
import {
  getAllProjects as repoGetAllProjects,
  getProjectById as repoGetProjectById,
  createProject as repoCreateProject,
  updateProject as repoUpdateProject,
  deleteProject as repoDeleteProject,
} from "./repositories/project-repository.js";
import {
  validateCreateProjectPayload,
  validateUpdateProjectPayload,
} from "./business/project-validator.js";

// ============================================================
// PROJECT SERVICE - Service Layer
// Manages Project Business Operations
// ============================================================

/**
 * Initialize application data
 * Checks current project state
 */
async function appDataInit() {
  try {
    const savedProjectId = getCurrentProjectId();
    if (savedProjectId) {
      const project = await getProjectById(savedProjectId);
      if (project) {
      } else {
        setCurrentProjectId(null);
      }
    }
  } catch (error) {
    console.error("[appDataInit] Failed to initialize:", error);
  }
}

/**
 * Get all projects
 * @returns {Promise<Array>} Array of projects
 */
async function getAllProjects() {
  try {
    return await repoGetAllProjects();
  } catch (error) {
    console.error("[getAllProjects] Failed:", error);
    return [];
  }
}

/**
 * Get project by ID
 * @param {string} id - Project ID
 * @returns {Promise<Object|null>} Project object or null
 */
async function getProjectById(id) {
  if (!id) return null;
  try {
    return await repoGetProjectById(String(id));
  } catch (error) {
    console.error(`[getProjectById] Failed for ${id}:`, error);
    return null;
  }
}

/**
 * Get current project
 * @returns {Promise<Object|null>} Current project or null
 */
async function getCurrentProject() {
  const projectId = getCurrentProjectId();
  if (projectId) {
    return await getProjectById(projectId);
  }
  return null;
}

/**
 * Check if project name is unique
 * @param {string} name - Project name to check
 * @param {string} excludeId - Project ID to exclude from check (for edit)
 * @returns {Promise<boolean>} true if name is unique
 */
async function isProjectNameUnique(name, excludeId = null) {
  try {
    const projects = await repoGetAllProjects();
    const trimmedName = name.trim().toLowerCase();

    return !projects.some((p) => {
      // Skip the project being edited
      if (excludeId && String(p.id) === String(excludeId)) {
        return false;
      }
      return p.name.trim().toLowerCase() === trimmedName;
    });
  } catch (error) {
    console.error("[isProjectNameUnique] Failed:", error);
    return false;
  }
}

/**
 * Create a new project
 * @param {object} payload - { name, description?, version? }
 * @returns {Promise<object|null>} Created project or null on error
 */
async function createProject(payload) {
  // Validate payload
  const validation = validateCreateProjectPayload(payload);
  if (!validation.valid) {
    console.error("[createProject]", validation.error);
    return null;
  }

  const trimmedName = payload.name.trim();

  // Check name uniqueness
  const isUnique = await isProjectNameUnique(trimmedName);
  if (!isUnique) {
    console.error(`[createProject] Project name "${trimmedName}" already exists`);
    return null;
  }

  // Prepare project data
  const newProject = {
    id: generateUUID(),
    name: trimmedName,
    description: payload.description ? payload.description.trim() : "",
    version: payload.version ? payload.version.trim() : "0.1",
    createDate: new Date().toISOString(),
    modifyDate: new Date().toISOString(),
    accessRights: "readWrite",
  };

  try {
    const created = await repoCreateProject(newProject);
    return created;
  } catch (error) {
    console.error("[createProject] Failed to create project:", error);
    // Check for duplicate name error from backend
    if (error.status === 409 || error.details?.name) {
      console.error(`[createProject] Project name "${trimmedName}" already exists`);
    }
    return null;
  }
}

/**
 * Update an existing project
 * @param {string} projectId
 * @param {object} updates - { name?, description?, version? }
 * @returns {Promise<object|null>} Updated project or null on error
 */
async function updateProject(projectId, updates) {
  if (!projectId) {
    console.error("[updateProject] Project ID is required");
    return null;
  }

  // Validate payload
  const validation = validateUpdateProjectPayload(updates);
  if (!validation.valid) {
    console.error("[updateProject]", validation.error);
    return null;
  }

  // Get existing project to check name uniqueness
  const existingProject = await getProjectById(projectId);
  if (!existingProject) {
    console.error(`[updateProject] Project not found: ${projectId}`);
    return null;
  }

  // Validate name if provided
  if (updates.name !== undefined) {
    const trimmedName = updates.name.trim();

    // Check uniqueness if name changed
    if (trimmedName.toLowerCase() !== existingProject.name.trim().toLowerCase()) {
      const isUnique = await isProjectNameUnique(trimmedName, projectId);
      if (!isUnique) {
        console.error(`[updateProject] Project name "${trimmedName}" already exists`);
        return null;
      }
    }

    updates.name = trimmedName;
  }

  // Prepare update data
  const updateData = {
    ...updates,
    modifyDate: new Date().toISOString(),
  };

  try {
    const updated = await repoUpdateProject(String(projectId), updateData);
    return updated;
  } catch (error) {
    console.error(`[updateProject] Failed to update project ${projectId}:`, error);
    // Check for duplicate name error from backend
    if (error.status === 409 || error.details?.name) {
      console.error(`[updateProject] Project name "${updates.name}" already exists`);
    }
    return null;
  }
}

/**
 * Delete a project by ID
 * If deleted project is current, clear current project
 * @param {string} projectId
 * @returns {Promise<boolean>} true if deleted, false if not found
 */
async function deleteProject(projectId) {
  if (!projectId) {
    console.error("[deleteProject] Project ID is required");
    return false;
  }

  const project = await getProjectById(projectId);
  if (!project) {
    console.error(`[deleteProject] Project not found: ${projectId}`);
    return false;
  }

  try {
    const deleted = await repoDeleteProject(projectId);
    if (deleted) {
      // If deleted project was current, clear it
      if (getCurrentProjectId() === projectId) {
        setCurrentProjectId(null);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[deleteProject] Failed to delete project ${projectId}:`, error);
    return false;
  }
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
  isProjectNameUnique,
};
