import { prisma } from "../db.js";
import { exportProject } from "./export-project.js";

/**
 * Delete an attribute in a Model graph and return full exported Project.
 *
 * @param {object} args
 * @param {string} args.modelId - Model ID
 * @param {string} args.attributeId - Attribute ID
 * @returns {Promise<object>} Full exported project
 */
export async function deleteModelAttributeAndExportProject({ modelId, attributeId }) {
  const mid = String(modelId || "");
  const attrId = String(attributeId || "");
  if (!mid || !attrId) {
    const err = new Error("modelId and attributeId are required");
    err.status = 400;
    throw err;
  }

  const model = await prisma.model.findUnique({
    where: { id: mid },
    select: { id: true, projectId: true },
  });
  if (!model) {
    const err = new Error("Model not found");
    err.status = 404;
    throw err;
  }

  const existing = await prisma.attributeModel.findFirst({
    where: { id: attrId, modelId: mid },
    select: { id: true },
  });
  if (!existing) {
    const err = new Error("Attribute not found");
    err.status = 404;
    throw err;
  }

  await prisma.attributeModel.delete({ where: { id: attrId } });

  const exported = await exportProject(model.projectId);
  if (!exported) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }

  return exported;
}

/**
 * Delete an attribute in a Profile graph and return full exported Project.
 *
 * @param {object} args
 * @param {string} args.profileId - Profile ID
 * @param {string} args.attributeId - Attribute ID
 * @returns {Promise<object>} Full exported project
 */
export async function deleteProfileAttributeAndExportProject({ profileId, attributeId }) {
  const pid = String(profileId || "");
  const attrId = String(attributeId || "");
  if (!pid || !attrId) {
    const err = new Error("profileId and attributeId are required");
    err.status = 400;
    throw err;
  }

  const profile = await prisma.profile.findUnique({
    where: { id: pid },
    select: { id: true, projectId: true },
  });
  if (!profile) {
    const err = new Error("Profile not found");
    err.status = 404;
    throw err;
  }

  const existing = await prisma.attributeProfile.findFirst({
    where: { id: attrId, profileId: pid },
    select: { id: true },
  });
  if (!existing) {
    const err = new Error("Attribute not found");
    err.status = 404;
    throw err;
  }

  await prisma.attributeProfile.delete({ where: { id: attrId } });

  const exported = await exportProject(profile.projectId);
  if (!exported) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }

  return exported;
}
