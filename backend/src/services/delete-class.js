import { prisma } from "../db.js";
import { exportProject } from "./export-project.js";

/**
 * Delete a class from a model graph and return full exported Project.
 * Also removes all links that involve this class and clears dataType references.
 *
 * @param {object} args
 * @param {string} args.modelId - Model ID
 * @param {string} args.classId - Class ID
 * @returns {Promise<object>} Full exported project
 */
export async function deleteModelClassAndExportProject({ modelId, classId }) {
  const mid = String(modelId || "");
  const cid = String(classId || "");
  if (!mid || !cid) {
    const err = new Error("modelId and classId are required");
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

  const cls = await prisma.classModel.findFirst({
    where: { id: cid, modelId: mid },
    select: { id: true, modelId: true },
  });
  if (!cls) {
    const err = new Error("Class not found");
    err.status = 404;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await nullifyModelAttributesDataType(tx, mid, cid);
    await deleteModelAssociationLinksForClass(tx, mid, cid);
    await deleteModelGeneralizationLinksForClass(tx, mid, cid);

    await tx.classModel.delete({ where: { id: cid } });
  });

  const exported = await exportProject(model.projectId);
  if (!exported) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }

  return exported;
}

/**
 * Delete a class from a profile graph and return full exported Project.
 * Also removes all links that involve this class and clears dataType references.
 *
 * @param {object} args
 * @param {string} args.profileId - Profile ID
 * @param {string} args.classId - Class ID
 * @returns {Promise<object>} Full exported project
 */
export async function deleteProfileClassAndExportProject({ profileId, classId }) {
  const pid = String(profileId || "");
  const cid = String(classId || "");
  if (!pid || !cid) {
    const err = new Error("profileId and classId are required");
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

  const cls = await prisma.classProfile.findFirst({
    where: { id: cid, profileId: pid },
    select: { id: true, profileId: true },
  });
  if (!cls) {
    const err = new Error("Class not found");
    err.status = 404;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await nullifyProfileAttributesDataType(tx, pid, cid);
    await deleteProfileAssociationLinksForClass(tx, pid, cid);
    await deleteProfileGeneralizationLinksForClass(tx, pid, cid);

    await tx.classProfile.delete({ where: { id: cid } });
  });

  const exported = await exportProject(profile.projectId);
  if (!exported) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }

  return exported;
}

/**
 * Clear dataType references to the deleted class for model attributes.
 *
 * @param {any} tx - Prisma transaction client
 * @param {string} modelId
 * @param {string} classId
 */
async function nullifyModelAttributesDataType(tx, modelId, classId) {
  await tx.attributeModel.updateMany({
    where: { modelId: String(modelId), dataTypeId: String(classId) },
    data: { dataTypeId: null },
  });
}

/**
 * Clear dataType references to the deleted class for profile attributes.
 *
 * @param {any} tx - Prisma transaction client
 * @param {string} profileId
 * @param {string} classId
 */
async function nullifyProfileAttributesDataType(tx, profileId, classId) {
  await tx.attributeProfile.updateMany({
    where: { profileId: String(profileId), dataTypeId: String(classId) },
    data: { dataTypeId: null },
  });
}

/**
 * Delete all association links that involve the class (model scope).
 *
 * @param {any} tx - Prisma transaction client
 * @param {string} modelId
 * @param {string} classId
 */
async function deleteModelAssociationLinksForClass(tx, modelId, classId) {
  const links = await tx.associationLinkModel.findMany({
    where: {
      modelId: String(modelId),
      linkEnd: { some: { linkEndClassId: String(classId) } },
    },
    select: { id: true },
  });

  const linkIds = links.map((l) => String(l.id)).filter(Boolean);
  if (!linkIds.length) return;

  await tx.associationLinkEndModel.deleteMany({
    where: { associationLinkId: { in: linkIds }, modelId: String(modelId) },
  });
  await tx.associationLinkModel.deleteMany({
    where: { id: { in: linkIds }, modelId: String(modelId) },
  });
}

/**
 * Delete all association links that involve the class (profile scope).
 *
 * @param {any} tx - Prisma transaction client
 * @param {string} profileId
 * @param {string} classId
 */
async function deleteProfileAssociationLinksForClass(tx, profileId, classId) {
  const links = await tx.associationLinkProfile.findMany({
    where: {
      profileId: String(profileId),
      linkEnd: { some: { linkEndClassId: String(classId) } },
    },
    select: { id: true },
  });

  const linkIds = links.map((l) => String(l.id)).filter(Boolean);
  if (!linkIds.length) return;

  await tx.associationLinkEndProfile.deleteMany({
    where: { associationLinkId: { in: linkIds }, profileId: String(profileId) },
  });
  await tx.associationLinkProfile.deleteMany({
    where: { id: { in: linkIds }, profileId: String(profileId) },
  });
}

/**
 * Delete all generalization links that involve the class (model scope).
 *
 * @param {any} tx - Prisma transaction client
 * @param {string} modelId
 * @param {string} classId
 */
async function deleteModelGeneralizationLinksForClass(tx, modelId, classId) {
  const links = await tx.generalizationLinkModel.findMany({
    where: {
      modelId: String(modelId),
      ends: { some: { classId: String(classId) } },
    },
    select: { id: true },
  });

  const linkIds = links.map((l) => String(l.id)).filter(Boolean);
  if (!linkIds.length) return;

  await tx.generalizationClassRefModel.deleteMany({
    where: { generalizationLinkId: { in: linkIds }, modelId: String(modelId) },
  });
  await tx.generalizationLinkModel.deleteMany({
    where: { id: { in: linkIds }, modelId: String(modelId) },
  });
}

/**
 * Delete all generalization links that involve the class (profile scope).
 *
 * @param {any} tx - Prisma transaction client
 * @param {string} profileId
 * @param {string} classId
 */
async function deleteProfileGeneralizationLinksForClass(tx, profileId, classId) {
  const links = await tx.generalizationLinkProfile.findMany({
    where: {
      profileId: String(profileId),
      ends: { some: { classId: String(classId) } },
    },
    select: { id: true },
  });

  const linkIds = links.map((l) => String(l.id)).filter(Boolean);
  if (!linkIds.length) return;

  await tx.generalizationClassRefProfile.deleteMany({
    where: { generalizationLinkId: { in: linkIds }, profileId: String(profileId) },
  });
  await tx.generalizationLinkProfile.deleteMany({
    where: { id: { in: linkIds }, profileId: String(profileId) },
  });
}
