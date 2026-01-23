import { prisma } from "../db.js";
import { exportProject } from "./export-project.js";

/**
 * Delete a literal in a Model graph and return full exported Project.
 *
 * @param {object} args
 * @param {string} args.modelId - Model ID
 * @param {string} args.literalId - Literal ID
 * @returns {Promise<object>} Full exported project
 */
export async function deleteModelLiteralAndExportProject({ modelId, literalId }) {
  const mid = String(modelId || "");
  const litId = String(literalId || "");
  if (!mid || !litId) {
    const err = new Error("modelId and literalId are required");
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

  const existing = await prisma.literalModel.findFirst({
    where: { id: litId, modelId: mid },
    select: { id: true },
  });
  if (!existing) {
    const err = new Error("Literal not found");
    err.status = 404;
    throw err;
  }

  await prisma.literalModel.delete({ where: { id: litId } });

  const exported = await exportProject(model.projectId);
  if (!exported) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }

  return exported;
}

/**
 * Delete a literal in a Profile graph and return full exported Project.
 *
 * @param {object} args
 * @param {string} args.profileId - Profile ID
 * @param {string} args.literalId - Literal ID
 * @returns {Promise<object>} Full exported project
 */
export async function deleteProfileLiteralAndExportProject({ profileId, literalId }) {
  const pid = String(profileId || "");
  const litId = String(literalId || "");
  if (!pid || !litId) {
    const err = new Error("profileId and literalId are required");
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

  const existing = await prisma.literalProfile.findFirst({
    where: { id: litId, profileId: pid },
    select: { id: true },
  });
  if (!existing) {
    const err = new Error("Literal not found");
    err.status = 404;
    throw err;
  }

  await prisma.literalProfile.delete({ where: { id: litId } });

  const exported = await exportProject(profile.projectId);
  if (!exported) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }

  return exported;
}
