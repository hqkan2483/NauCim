/**
 * Diagram Repository - Data Layer
 * Handles diagram create operations via backend API
 */

import {
  createModelDiagram as backendCreateModelDiagram,
  createProfileDiagram as backendCreateProfileDiagram,
} from "../backend/diagram-backend-service.js";

export async function createModelDiagram(modelId, packageId, payload) {
  if (!modelId) throw new Error("Model ID is required");
  if (!packageId) throw new Error("Package ID is required");
  return backendCreateModelDiagram(String(modelId), String(packageId), payload);
}

export async function createProfileDiagram(profileId, packageId, payload) {
  if (!profileId) throw new Error("Profile ID is required");
  if (!packageId) throw new Error("Package ID is required");
  return backendCreateProfileDiagram(String(profileId), String(packageId), payload);
}
