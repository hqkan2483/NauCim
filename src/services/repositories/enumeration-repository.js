/**
 * Enumeration Repository - Data Layer
 *
 * Thin wrapper around backend enumeration endpoints.
 */

import {
  createModelEnumeration as backendCreateModelEnumeration,
  createProfileEnumeration as backendCreateProfileEnumeration,
} from "../backend/enumeration-backend-service.js";

/**
 * @param {string} modelId
 * @param {string} packageId
 * @param {object} payload
 * @returns {Promise<object>} Full exported project
 */
export async function createModelEnumeration(modelId, packageId, payload) {
  if (!modelId) throw new Error("Model ID is required");
  if (!packageId) throw new Error("Package ID is required");
  return backendCreateModelEnumeration(String(modelId), String(packageId), payload);
}

/**
 * @param {string} profileId
 * @param {string} packageId
 * @param {object} payload
 * @returns {Promise<object>} Full exported project
 */
export async function createProfileEnumeration(profileId, packageId, payload) {
  if (!profileId) throw new Error("Profile ID is required");
  if (!packageId) throw new Error("Package ID is required");
  return backendCreateProfileEnumeration(String(profileId), String(packageId), payload);
}
