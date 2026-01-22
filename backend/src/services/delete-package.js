import { prisma } from "../db.js";
import { exportProject } from "./export-project.js";

/**
 * Delete a package from a model graph and return full exported Project.
 * Recursively removes all nested packages. Also removes links that involve
 * any class in the deleted package subtree and clears dataType references.
 *
 * @param {object} args
 * @param {string} args.modelId - Model ID
 * @param {string} args.packageId - Package ID
 * @returns {Promise<object>} Full exported project
 */
export async function deleteModelPackageAndExportProject({ modelId, packageId }) {
  const mid = String(modelId || "");
  const pid = String(packageId || "");
  if (!mid || !pid) {
    const err = new Error("modelId and packageId are required");
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

  const pkg = await prisma.packageModel.findFirst({
    where: { id: pid, modelId: mid },
    select: { id: true },
  });
  if (!pkg) {
    const err = new Error("Package not found");
    err.status = 404;
    throw err;
  }

  const packageIds = await collectModelPackageSubtreeIds(mid, pid);
  const classIds = await collectModelClassIdsForPackages(mid, packageIds);

  await prisma.$transaction(async (tx) => {
    await nullifyModelAttributesDataTypes(tx, mid, classIds);
    await deleteModelLinksForClasses(tx, mid, classIds);

    await tx.packageModel.delete({ where: { id: pid } });
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
 * Delete a package from a profile graph and return full exported Project.
 * Recursively removes all nested packages. Also removes links that involve
 * any class in the deleted package subtree and clears dataType references.
 *
 * @param {object} args
 * @param {string} args.profileId - Profile ID
 * @param {string} args.packageId - Package ID
 * @returns {Promise<object>} Full exported project
 */
export async function deleteProfilePackageAndExportProject({ profileId, packageId }) {
  const pid = String(profileId || "");
  const pkgId = String(packageId || "");
  if (!pid || !pkgId) {
    const err = new Error("profileId and packageId are required");
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

  const pkg = await prisma.packageProfile.findFirst({
    where: { id: pkgId, profileId: pid },
    select: { id: true },
  });
  if (!pkg) {
    const err = new Error("Package not found");
    err.status = 404;
    throw err;
  }

  const packageIds = await collectProfilePackageSubtreeIds(pid, pkgId);
  const classIds = await collectProfileClassIdsForPackages(pid, packageIds);

  await prisma.$transaction(async (tx) => {
    await nullifyProfileAttributesDataTypes(tx, pid, classIds);
    await deleteProfileLinksForClasses(tx, pid, classIds);

    await tx.packageProfile.delete({ where: { id: pkgId } });
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
 * Collect all package ids in a model subtree (root included).
 *
 * @param {string} modelId
 * @param {string} rootPackageId
 * @returns {Promise<string[]>}
 */
async function collectModelPackageSubtreeIds(modelId, rootPackageId) {
  const packages = await prisma.packageModel.findMany({
    where: { modelId: String(modelId) },
    select: { id: true, parentId: true },
  });

  return collectPackageSubtreeIds(packages, rootPackageId);
}

/**
 * Collect all package ids in a profile subtree (root included).
 *
 * @param {string} profileId
 * @param {string} rootPackageId
 * @returns {Promise<string[]>}
 */
async function collectProfilePackageSubtreeIds(profileId, rootPackageId) {
  const packages = await prisma.packageProfile.findMany({
    where: { profileId: String(profileId) },
    select: { id: true, parentId: true },
  });

  return collectPackageSubtreeIds(packages, rootPackageId);
}

/**
 * Build a subtree list of package ids using a flat package list.
 *
 * @param {Array<{id:string,parentId:string|null}>} packages
 * @param {string} rootPackageId
 * @returns {string[]}
 */
function collectPackageSubtreeIds(packages, rootPackageId) {
  const parentMap = new Map();
  for (const p of packages) {
    const parentId = p.parentId || null;
    if (!parentMap.has(parentId)) parentMap.set(parentId, []);
    parentMap.get(parentId).push(String(p.id));
  }

  const rootId = String(rootPackageId);
  const result = [];
  const stack = [rootId];
  const seen = new Set();

  while (stack.length) {
    const id = stack.pop();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);

    const children = parentMap.get(id) || [];
    for (const childId of children) stack.push(childId);
  }

  return result;
}

/**
 * Collect all class ids for model packages.
 *
 * @param {string} modelId
 * @param {string[]} packageIds
 * @returns {Promise<string[]>}
 */
async function collectModelClassIdsForPackages(modelId, packageIds) {
  if (!packageIds.length) return [];
  const rows = await prisma.classModel.findMany({
    where: { modelId: String(modelId), packageId: { in: packageIds } },
    select: { id: true },
  });
  return rows.map((r) => String(r.id));
}

/**
 * Collect all class ids for profile packages.
 *
 * @param {string} profileId
 * @param {string[]} packageIds
 * @returns {Promise<string[]>}
 */
async function collectProfileClassIdsForPackages(profileId, packageIds) {
  if (!packageIds.length) return [];
  const rows = await prisma.classProfile.findMany({
    where: { profileId: String(profileId), packageId: { in: packageIds } },
    select: { id: true },
  });
  return rows.map((r) => String(r.id));
}

/**
 * Clear dataType references to deleted classes for model attributes.
 *
 * @param {any} tx - Prisma transaction client
 * @param {string} modelId
 * @param {string[]} classIds
 */
async function nullifyModelAttributesDataTypes(tx, modelId, classIds) {
  if (!classIds.length) return;
  await tx.attributeModel.updateMany({
    where: { modelId: String(modelId), dataTypeId: { in: classIds } },
    data: { dataTypeId: null },
  });
}

/**
 * Clear dataType references to deleted classes for profile attributes.
 *
 * @param {any} tx - Prisma transaction client
 * @param {string} profileId
 * @param {string[]} classIds
 */
async function nullifyProfileAttributesDataTypes(tx, profileId, classIds) {
  if (!classIds.length) return;
  await tx.attributeProfile.updateMany({
    where: { profileId: String(profileId), dataTypeId: { in: classIds } },
    data: { dataTypeId: null },
  });
}

/**
 * Delete all association/generalization links for classes (model scope).
 *
 * @param {any} tx - Prisma transaction client
 * @param {string} modelId
 * @param {string[]} classIds
 */
async function deleteModelLinksForClasses(tx, modelId, classIds) {
  if (!classIds.length) return;

  const assocLinks = await tx.associationLinkModel.findMany({
    where: {
      modelId: String(modelId),
      linkEnd: { some: { linkEndClassId: { in: classIds } } },
    },
    select: { id: true },
  });
  const assocIds = assocLinks.map((l) => String(l.id)).filter(Boolean);
  if (assocIds.length) {
    await tx.associationLinkEndModel.deleteMany({
      where: { associationLinkId: { in: assocIds }, modelId: String(modelId) },
    });
    await tx.associationLinkModel.deleteMany({
      where: { id: { in: assocIds }, modelId: String(modelId) },
    });
  }

  const genLinks = await tx.generalizationLinkModel.findMany({
    where: {
      modelId: String(modelId),
      ends: { some: { classId: { in: classIds } } },
    },
    select: { id: true },
  });
  const genIds = genLinks.map((l) => String(l.id)).filter(Boolean);
  if (genIds.length) {
    await tx.generalizationClassRefModel.deleteMany({
      where: { generalizationLinkId: { in: genIds }, modelId: String(modelId) },
    });
    await tx.generalizationLinkModel.deleteMany({
      where: { id: { in: genIds }, modelId: String(modelId) },
    });
  }
}

/**
 * Delete all association/generalization links for classes (profile scope).
 *
 * @param {any} tx - Prisma transaction client
 * @param {string} profileId
 * @param {string[]} classIds
 */
async function deleteProfileLinksForClasses(tx, profileId, classIds) {
  if (!classIds.length) return;

  const assocLinks = await tx.associationLinkProfile.findMany({
    where: {
      profileId: String(profileId),
      linkEnd: { some: { linkEndClassId: { in: classIds } } },
    },
    select: { id: true },
  });
  const assocIds = assocLinks.map((l) => String(l.id)).filter(Boolean);
  if (assocIds.length) {
    await tx.associationLinkEndProfile.deleteMany({
      where: { associationLinkId: { in: assocIds }, profileId: String(profileId) },
    });
    await tx.associationLinkProfile.deleteMany({
      where: { id: { in: assocIds }, profileId: String(profileId) },
    });
  }

  const genLinks = await tx.generalizationLinkProfile.findMany({
    where: {
      profileId: String(profileId),
      ends: { some: { classId: { in: classIds } } },
    },
    select: { id: true },
  });
  const genIds = genLinks.map((l) => String(l.id)).filter(Boolean);
  if (genIds.length) {
    await tx.generalizationClassRefProfile.deleteMany({
      where: { generalizationLinkId: { in: genIds }, profileId: String(profileId) },
    });
    await tx.generalizationLinkProfile.deleteMany({
      where: { id: { in: genIds }, profileId: String(profileId) },
    });
  }
}
