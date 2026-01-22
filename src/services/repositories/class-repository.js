/**
 * Class Repository - Data Layer
 * Handles all data operations for classes via backend API
 */

import {
  updateModelClass as backendUpdateModelClass,
  updateProfileClass as backendUpdateProfileClass,
  createModelClass as backendCreateModelClass,
  createProfileClass as backendCreateProfileClass,
  deleteModelClass as backendDeleteModelClass,
  deleteProfileClass as backendDeleteProfileClass,
  listModelClassesSummary as backendListModelClassesSummary,
  listProfileClassesSummary as backendListProfileClassesSummary,
} from "../backend/class-backend-service.js";

export async function updateModelClass(modelId, classId, updates) {
  if (!modelId) throw new Error("Model ID is required");
  if (!classId) throw new Error("Class ID is required");
  return backendUpdateModelClass(String(modelId), String(classId), updates);
}

export async function updateProfileClass(profileId, classId, updates) {
  if (!profileId) throw new Error("Profile ID is required");
  if (!classId) throw new Error("Class ID is required");
  return backendUpdateProfileClass(String(profileId), String(classId), updates);
}

export async function createModelClass(modelId, packageId, payload) {
  if (!modelId) throw new Error("Model ID is required");
  if (!packageId) throw new Error("Package ID is required");
  return backendCreateModelClass(String(modelId), String(packageId), payload);
}

export async function createProfileClass(profileId, packageId, payload) {
  if (!profileId) throw new Error("Profile ID is required");
  if (!packageId) throw new Error("Package ID is required");
  return backendCreateProfileClass(String(profileId), String(packageId), payload);
}

/**
 * Delete a class from a model graph.
 *
 * @param {string} modelId
 * @param {string} classId
 * @returns {Promise<object>} Full exported project
 */
export async function deleteModelClass(modelId, classId) {
  if (!modelId) throw new Error("Model ID is required");
  if (!classId) throw new Error("Class ID is required");
  return backendDeleteModelClass(String(modelId), String(classId));
}

/**
 * Delete a class from a profile graph.
 *
 * @param {string} profileId
 * @param {string} classId
 * @returns {Promise<object>} Full exported project
 */
export async function deleteProfileClass(profileId, classId) {
  if (!profileId) throw new Error("Profile ID is required");
  if (!classId) throw new Error("Class ID is required");
  return backendDeleteProfileClass(String(profileId), String(classId));
}

export async function listModelClassesSummary(modelId, { filters = {} } = {}) {
  if (!modelId) throw new Error("Model ID is required");
  return backendListModelClassesSummary(String(modelId), { filters });
}

export async function listProfileClassesSummary(profileId, { filters = {} } = {}) {
  if (!profileId) throw new Error("Profile ID is required");
  return backendListProfileClassesSummary(String(profileId), { filters });
}
