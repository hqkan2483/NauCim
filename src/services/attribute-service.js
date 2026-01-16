import {
  updateModelAttribute as repoUpdateModelAttribute,
  updateProfileAttribute as repoUpdateProfileAttribute,
} from "./repositories/attribute-repository.js";

/**
 * Attribute Service - Service Layer
 * Updates attributes in model/profile graphs.
 * Backend returns the full updated project.
 */

async function updateModelAttribute(projectId, modelId, attributeId, updates) {
  if (!projectId || !modelId || !attributeId) return null;
  try {
    return await repoUpdateModelAttribute(String(modelId), String(attributeId), updates);
  } catch (error) {
    console.error(
      `[updateModelAttribute] Failed for model ${modelId}, attribute ${attributeId}:`,
      error
    );
    throw error;
  }
}

async function updateProfileAttribute(projectId, profileId, attributeId, updates) {
  if (!projectId || !profileId || !attributeId) return null;
  try {
    return await repoUpdateProfileAttribute(String(profileId), String(attributeId), updates);
  } catch (error) {
    console.error(
      `[updateProfileAttribute] Failed for profile ${profileId}, attribute ${attributeId}:`,
      error
    );
    throw error;
  }
}

export { updateModelAttribute, updateProfileAttribute };
