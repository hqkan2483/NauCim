import {
  updateModelAttribute as backendUpdateModelAttribute,
  updateProfileAttribute as backendUpdateProfileAttribute,
} from "../backend/attribute-backend-service.js";

export async function updateModelAttribute(modelId, attributeId, updates) {
  if (!modelId || !attributeId) return null;
  return backendUpdateModelAttribute(String(modelId), String(attributeId), updates);
}

export async function updateProfileAttribute(profileId, attributeId, updates) {
  if (!profileId || !attributeId) return null;
  return backendUpdateProfileAttribute(String(profileId), String(attributeId), updates);
}
