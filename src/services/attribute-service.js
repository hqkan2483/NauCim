import {
  createModelAttribute as repoCreateModelAttribute,
  createProfileAttribute as repoCreateProfileAttribute,
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

async function createModelAttribute(projectId, modelId, classId, payload) {
  if (!projectId || !modelId || !classId) return null;
  try {
    return await repoCreateModelAttribute(String(modelId), String(classId), payload);
  } catch (error) {
    console.error(
      `[createModelAttribute] Failed for model ${modelId}, class ${classId}:`,
      error
    );
    throw error;
  }
}

async function createProfileAttribute(projectId, profileId, classId, payload) {
  if (!projectId || !profileId || !classId) return null;
  try {
    return await repoCreateProfileAttribute(String(profileId), String(classId), payload);
  } catch (error) {
    console.error(
      `[createProfileAttribute] Failed for profile ${profileId}, class ${classId}:`,
      error
    );
    throw error;
  }
}

export {
  updateModelAttribute,
  updateProfileAttribute,
  createModelAttribute,
  createProfileAttribute,
};
