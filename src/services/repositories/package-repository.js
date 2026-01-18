/**
 * Package Repository - Data Layer
 * Handles all data operations for packages via backend API
 */

import {
  updateModelPackage as backendUpdateModelPackage,
  updateProfilePackage as backendUpdateProfilePackage,
  createModelSubpackage as backendCreateModelSubpackage,
  createProfileSubpackage as backendCreateProfileSubpackage,
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
