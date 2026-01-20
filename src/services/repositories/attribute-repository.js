import {
  createModelAttribute as backendCreateModelAttribute,
  createProfileAttribute as backendCreateProfileAttribute,
  updateModelAttribute as backendUpdateModelAttribute,
  updateProfileAttribute as backendUpdateProfileAttribute,
} from "../backend/attribute-backend-service.js";

export async function createModelAttribute(modelId, classId, payload) {
  if (!modelId || !classId) return null;
  return backendCreateModelAttribute(String(modelId), String(classId), payload);
}

export async function createProfileAttribute(profileId, classId, payload) {
  if (!profileId || !classId) return null;
  return backendCreateProfileAttribute(String(profileId), String(classId), payload);
}

export async function updateModelAttribute(modelId, attributeId, updates) {
  if (!modelId || !attributeId) return null;
  return backendUpdateModelAttribute(String(modelId), String(attributeId), updates);
}

export async function updateProfileAttribute(profileId, attributeId, updates) {
  if (!profileId || !attributeId) return null;
  return backendUpdateProfileAttribute(String(profileId), String(attributeId), updates);
}
