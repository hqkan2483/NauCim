import {
  createModelLiteral as repoCreateModelLiteral,
  createProfileLiteral as repoCreateProfileLiteral,
  updateModelLiteral as repoUpdateModelLiteral,
  updateProfileLiteral as repoUpdateProfileLiteral,
  deleteModelLiteral as repoDeleteModelLiteral,
  deleteProfileLiteral as repoDeleteProfileLiteral,
} from "./repositories/literal-repository.js";

/**
 * Literal Service - Service Layer
 * Updates literals in model/profile graphs.
 * Backend returns the full updated project.
 */

async function updateModelLiteral(projectId, modelId, literalId, updates) {
  if (!projectId || !modelId || !literalId) return null;
  try {
    return await repoUpdateModelLiteral(String(modelId), String(literalId), updates);
  } catch (error) {
    console.error(`[updateModelLiteral] Failed for model ${modelId}, literal ${literalId}:`, error);
    throw error;
  }
}

async function updateProfileLiteral(projectId, profileId, literalId, updates) {
  if (!projectId || !profileId || !literalId) return null;
  try {
    return await repoUpdateProfileLiteral(String(profileId), String(literalId), updates);
  } catch (error) {
    console.error(
      `[updateProfileLiteral] Failed for profile ${profileId}, literal ${literalId}:`,
      error
    );
    throw error;
  }
}

async function createModelLiteral(projectId, modelId, classId, payload) {
  if (!projectId || !modelId || !classId) return null;
  try {
    return await repoCreateModelLiteral(String(modelId), String(classId), payload);
  } catch (error) {
    console.error(`[createModelLiteral] Failed for model ${modelId}, class ${classId}:`, error);
    throw error;
  }
}

async function createProfileLiteral(projectId, profileId, classId, payload) {
  if (!projectId || !profileId || !classId) return null;
  try {
    return await repoCreateProfileLiteral(String(profileId), String(classId), payload);
  } catch (error) {
    console.error(`[createProfileLiteral] Failed for profile ${profileId}, class ${classId}:`, error);
    throw error;
  }
}

async function deleteModelLiteral(projectId, modelId, literalId) {
  if (!projectId || !modelId || !literalId) return null;
  try {
    return await repoDeleteModelLiteral(String(modelId), String(literalId));
  } catch (error) {
    console.error(`[deleteModelLiteral] Failed for model ${modelId}, literal ${literalId}:`, error);
    throw error;
  }
}

async function deleteProfileLiteral(projectId, profileId, literalId) {
  if (!projectId || !profileId || !literalId) return null;
  try {
    return await repoDeleteProfileLiteral(String(profileId), String(literalId));
  } catch (error) {
    console.error(
      `[deleteProfileLiteral] Failed for profile ${profileId}, literal ${literalId}:`,
      error
    );
    throw error;
  }
}

export {
  updateModelLiteral,
  updateProfileLiteral,
  createModelLiteral,
  createProfileLiteral,
  deleteModelLiteral,
  deleteProfileLiteral,
};
