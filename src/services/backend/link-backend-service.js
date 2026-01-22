import { apiClient } from "./api-client.js";

/**
 * Link Backend Service
 * Thin HTTP client layer for Link-related backend APIs.
 */

/**
 * Update an existing Generalization link.
 * Backend responds with the full exported Project.
 *
 * @param {object} args
 * @param {string} args.linkId
 * @param {string} [args.modelId]
 * @param {string} [args.profileId]
 * @param {string} [args.editingClassId]
 * @param {object} args.payload GeneralizationLink
 * @returns {Promise<object>} Full exported project
 */
export async function updateGeneralizationLink({
  linkId,
  modelId = "",
  profileId = "",
  editingClassId = "",
  payload,
}) {
  const id = String(linkId || "");
  const qs = new URLSearchParams();
  if (modelId) qs.set("modelId", String(modelId));
  if (profileId) qs.set("profileId", String(profileId));
  if (editingClassId) qs.set("editingClassId", String(editingClassId));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return await apiClient.put(`/api/links/generalization/${encodeURIComponent(id)}${suffix}`, payload);
}

/**
 * Update an existing Association link.
 * Backend responds with the full exported Project.
 *
 * @param {object} args
 * @param {string} args.linkId
 * @param {string} [args.modelId]
 * @param {string} [args.profileId]
 * @param {string} [args.editingClassId]
 * @param {object} args.payload AssociationLink
 * @returns {Promise<object>} Full exported project
 */
export async function updateAssociationLink({
  linkId,
  modelId = "",
  profileId = "",
  editingClassId = "",
  payload,
}) {
  const id = String(linkId || "");
  const qs = new URLSearchParams();
  if (modelId) qs.set("modelId", String(modelId));
  if (profileId) qs.set("profileId", String(profileId));
  if (editingClassId) qs.set("editingClassId", String(editingClassId));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return await apiClient.put(`/api/links/association/${encodeURIComponent(id)}${suffix}`, payload);
}

/**
 * Create a new Generalization link.
 */
export async function createGeneralizationLink({ modelId = "", profileId = "", editingClassId = "", payload }) {
  const qs = new URLSearchParams();
  if (modelId) qs.set("modelId", String(modelId));
  if (profileId) qs.set("profileId", String(profileId));
  if (editingClassId) qs.set("editingClassId", String(editingClassId));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return await apiClient.post(`/api/links/generalization${suffix}`, payload);
}

/**
 * Create a new Association link.
 */
export async function createAssociationLink({ modelId = "", profileId = "", editingClassId = "", payload }) {
  const qs = new URLSearchParams();
  if (modelId) qs.set("modelId", String(modelId));
  if (profileId) qs.set("profileId", String(profileId));
  if (editingClassId) qs.set("editingClassId", String(editingClassId));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return await apiClient.post(`/api/links/association${suffix}`, payload);
}

/**
 * Delete an existing Generalization link.
 * Backend responds with the full exported Project.
 *
 * @param {object} args
 * @param {string} args.linkId
 * @param {string} [args.modelId]
 * @param {string} [args.profileId]
 * @param {string} [args.editingClassId]
 * @returns {Promise<object>} Full exported project
 */
export async function deleteGeneralizationLink({
  linkId,
  modelId = "",
  profileId = "",
  editingClassId = "",
}) {
  const id = String(linkId || "");
  const qs = new URLSearchParams();
  if (modelId) qs.set("modelId", String(modelId));
  if (profileId) qs.set("profileId", String(profileId));
  if (editingClassId) qs.set("editingClassId", String(editingClassId));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return await apiClient.del(`/api/links/generalization/${encodeURIComponent(id)}${suffix}`);
}

/**
 * Delete an existing Association link.
 * Backend responds with the full exported Project.
 *
 * @param {object} args
 * @param {string} args.linkId
 * @param {string} [args.modelId]
 * @param {string} [args.profileId]
 * @param {string} [args.editingClassId]
 * @returns {Promise<object>} Full exported project
 */
export async function deleteAssociationLink({
  linkId,
  modelId = "",
  profileId = "",
  editingClassId = "",
}) {
  const id = String(linkId || "");
  const qs = new URLSearchParams();
  if (modelId) qs.set("modelId", String(modelId));
  if (profileId) qs.set("profileId", String(profileId));
  if (editingClassId) qs.set("editingClassId", String(editingClassId));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return await apiClient.del(`/api/links/association/${encodeURIComponent(id)}${suffix}`);
}

