/**
 * Class Repository - Data Layer
 * Handles all data operations for classes via backend API
 */

import {
  updateModelClass as backendUpdateModelClass,
  updateProfileClass as backendUpdateProfileClass,
  createModelClass as backendCreateModelClass,
  createProfileClass as backendCreateProfileClass,
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

export async function listModelClassesSummary(modelId) {
  if (!modelId) throw new Error("Model ID is required");
  return backendListModelClassesSummary(String(modelId));
}

export async function listProfileClassesSummary(profileId) {
  if (!profileId) throw new Error("Profile ID is required");
  return backendListProfileClassesSummary(String(profileId));
}
