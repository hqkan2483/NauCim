/**
 * Class Repository - Data Layer
 * Handles all data operations for classes via backend API
 */

import {
  updateModelClass as backendUpdateModelClass,
  updateProfileClass as backendUpdateProfileClass,
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
