/**
 * Package Repository - Data Layer
 * Handles all data operations for packages via backend API
 */

import {
  updateModelPackage as backendUpdateModelPackage,
  updateProfilePackage as backendUpdateProfilePackage,
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
