/**
 * Project Repository - Data Layer
 * Handles all data operations for projects via backend API
 */

import {
  listProjects as backendListProjects,
  getProject as backendGetProject,
  createProject as backendCreateProject,
  updateProject as backendUpdateProject,
  deleteProject as backendDeleteProject,
  exportProject as backendExportProject,
} from "../backend/project-backend-service.js";

/**
 * Get all projects from backend
 * @returns {Promise<Array>} Array of project metadata
 */
export async function getAllProjects() {
  try {
    const projects = await backendListProjects();
    return Array.isArray(projects) ? projects : [];
  } catch (error) {
    console.error("[ProjectRepository] Failed to fetch projects:", error);
    throw error;
  }
}

/**
 * Get full project data by ID (with models and profiles)
 * @param {string} projectId
 * @returns {Promise<Object|null>} Full project object or null
 */
export async function getProjectById(projectId) {
  if (!projectId) return null;
  try {
    const project = await backendExportProject(projectId);
    return project || null;
  } catch (error) {
    if (error.status === 404) return null;
    console.error(`[ProjectRepository] Failed to fetch project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Create a new project
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} Created project
 */
export async function createProject(projectData) {
  try {
    // First create project metadata
    const created = await backendCreateProject(projectData);
    // Then export full project to get complete structure
    return await backendExportProject(created.id);
  } catch (error) {
    console.error("[ProjectRepository] Failed to create project:", error);
    throw error;
  }
}

/**
 * Update project
 * @param {string} projectId
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated project
 */
export async function updateProject(projectId, updates) {
  if (!projectId) throw new Error("Project ID is required");
  try {
    await backendUpdateProject(projectId, updates);
    // Return full updated project
    return await backendExportProject(projectId);
  } catch (error) {
    console.error(`[ProjectRepository] Failed to update project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Delete project
 * @param {string} projectId
 * @returns {Promise<boolean>} true if deleted
 */
export async function deleteProject(projectId) {
  if (!projectId) return false;
  try {
    await backendDeleteProject(projectId);
    return true;
  } catch (error) {
    if (error.status === 404) return false;
    console.error(`[ProjectRepository] Failed to delete project ${projectId}:`, error);
    throw error;
  }
}
