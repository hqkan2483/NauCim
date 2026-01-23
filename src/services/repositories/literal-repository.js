import {
  createModelLiteral as backendCreateModelLiteral,
  createProfileLiteral as backendCreateProfileLiteral,
  updateModelLiteral as backendUpdateModelLiteral,
  updateProfileLiteral as backendUpdateProfileLiteral,
  deleteModelLiteral as backendDeleteModelLiteral,
  deleteProfileLiteral as backendDeleteProfileLiteral,
} from "../backend/literal-backend-service.js";

export async function createModelLiteral(modelId, classId, payload) {
  if (!modelId || !classId) return null;
  return backendCreateModelLiteral(String(modelId), String(classId), payload);
}

export async function createProfileLiteral(profileId, classId, payload) {
  if (!profileId || !classId) return null;
  return backendCreateProfileLiteral(String(profileId), String(classId), payload);
}

export async function updateModelLiteral(modelId, literalId, updates) {
  if (!modelId || !literalId) return null;
  return backendUpdateModelLiteral(String(modelId), String(literalId), updates);
}

export async function updateProfileLiteral(profileId, literalId, updates) {
  if (!profileId || !literalId) return null;
  return backendUpdateProfileLiteral(String(profileId), String(literalId), updates);
}

export async function deleteModelLiteral(modelId, literalId) {
  if (!modelId || !literalId) return null;
  return backendDeleteModelLiteral(String(modelId), String(literalId));
}

export async function deleteProfileLiteral(profileId, literalId) {
  if (!profileId || !literalId) return null;
  return backendDeleteProfileLiteral(String(profileId), String(literalId));
}
