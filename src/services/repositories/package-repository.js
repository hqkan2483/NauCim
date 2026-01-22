/**
 * Package Repository - Data Layer
 * Handles all data operations for packages via backend API
 */

import {
  updateModelPackage as backendUpdateModelPackage,
  updateProfilePackage as backendUpdateProfilePackage,
  createModelSubpackage as backendCreateModelSubpackage,
  createProfileSubpackage as backendCreateProfileSubpackage,
  deleteModelPackage as backendDeleteModelPackage,
  deleteProfilePackage as backendDeleteProfilePackage,
} from "../backend/package-backend-service.js";

export async function updateModelPackage(modelId, packageId, updates) {
  if (!modelId) throw new Error("Model ID is required");
  if (!packageId) throw new Error("Package ID is required");
  return backendUpdateModelPackage(String(modelId), String(packageId), updates);
}

export async function updateProfilePackage(profileId, packageId, updates) {
  if (!profileId) throw new Error("Profile ID is required");
  if (!packageId) throw new Error("Package ID is required");
  return backendUpdateProfilePackage(String(profileId), String(packageId), updates);
}

export async function createModelSubpackage(modelId, parentPackageId, payload) {
  if (!modelId) throw new Error("Model ID is required");
  if (!parentPackageId) throw new Error("Parent package ID is required");
  return backendCreateModelSubpackage(String(modelId), String(parentPackageId), payload);
}

export async function createProfileSubpackage(profileId, parentPackageId, payload) {
  if (!profileId) throw new Error("Profile ID is required");
  if (!parentPackageId) throw new Error("Parent package ID is required");
  return backendCreateProfileSubpackage(String(profileId), String(parentPackageId), payload);
}

/**
 * Delete a package from a model graph.
 *
 * @param {string} modelId
 * @param {string} packageId
 * @returns {Promise<object>} Full exported project
 */
export async function deleteModelPackage(modelId, packageId) {
  if (!modelId) throw new Error("Model ID is required");
  if (!packageId) throw new Error("Package ID is required");
  return backendDeleteModelPackage(String(modelId), String(packageId));
}

/**
 * Delete a package from a profile graph.
 *
 * @param {string} profileId
 * @param {string} packageId
 * @returns {Promise<object>} Full exported project
 */
export async function deleteProfilePackage(profileId, packageId) {
  if (!profileId) throw new Error("Profile ID is required");
  if (!packageId) throw new Error("Package ID is required");
  return backendDeleteProfilePackage(String(profileId), String(packageId));
}
