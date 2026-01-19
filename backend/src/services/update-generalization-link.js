import { prisma } from "../db.js";
import { exportProject } from "./export-project.js";

/**
 * Update an existing Generalization link (Model/Profile) and return full exported Project.
 *
 * Business rules:
 * - The link must exist.
 * - If `editingClassId` is provided, it must match one of:
 *   - incoming payload parent.classId / child.classId
 *   - existing DB ends (before update)
 * - `className` values in payload are ignored.
 *
 * @param {object} args
 * @param {string} args.linkId
 * @param {string} [args.modelId]
 * @param {string} [args.profileId]
 * @param {string} [args.editingClassId]
 * @param {object} args.payload GeneralizationLink
 */
export async function updateGeneralizationLinkAndExportProject({
  linkId,
  modelId = "",
  profileId = "",
  editingClassId = "",
  payload,
}) {
  const id = String(linkId || "");
  if (!id) {
    const err = new Error("linkId is required");
    err.status = 400;
    throw err;
  }

  const requestedParentId = String(payload?.parent?.classId || "");
  const requestedChildId = String(payload?.child?.classId || "");
  if (!requestedParentId || !requestedChildId) {
    const err = new Error("parent.classId and child.classId are required");
    err.status = 400;
    throw err;
  }

  if (editingClassId) {
    const ec = String(editingClassId);
    const matchesIncoming = ec === requestedParentId || ec === requestedChildId;
    if (!matchesIncoming) {
      const err = new Error("editingClassId must match parent.classId or child.classId");
      err.status = 400;
      throw err;
    }
  }

  const scope = await resolveGeneralizationScope({ id, modelId, profileId });
  if (!scope) {
    const err = new Error("Generalization link not found");
    err.status = 404;
    throw err;
  }

  // Extra safety validation: ensure the editing class belongs to this link.
  if (editingClassId) {
    const ec = String(editingClassId);
    const hasEnd = scope.ends.some((e) => String(e?.classId || "") === ec);
    if (!hasEnd) {
      const err = new Error("editingClassId is not an end of this link");
      err.status = 400;
      throw err;
    }
  }

  await prisma.$transaction(async (tx) => {
    if (scope.kind === "model") {
      await updateGeneralizationLinkModel(tx, {
        linkId: id,
        modelId: scope.modelId,
        payload,
        parentClassId: requestedParentId,
        childClassId: requestedChildId,
      });
    } else {
      await updateGeneralizationLinkProfile(tx, {
        linkId: id,
        profileId: scope.profileId,
        payload,
        parentClassId: requestedParentId,
        childClassId: requestedChildId,
      });
    }
  });

  const projectId = scope.projectId;
  const exported = await exportProject(projectId);
  if (!exported) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }

  return exported;
}

/**
 * Resolve where the generalization link lives (model or profile).
 * If modelId/profileId provided, they are used for disambiguation.
 *
 * @param {object} args
 * @param {string} args.id
 * @param {string} args.modelId
 * @param {string} args.profileId
 * @returns {Promise<null|{kind:'model', modelId:string, projectId:string, ends:Array}|{kind:'profile', profileId:string, projectId:string, ends:Array}>}
 */
async function resolveGeneralizationScope({ id, modelId, profileId }) {
  const mid = String(modelId || "");
  const pid = String(profileId || "");

  if (mid && pid) {
    const err = new Error("Provide either modelId or profileId, not both");
    err.status = 400;
    throw err;
  }

  if (mid) {
    const g = await prisma.generalizationLinkModel.findFirst({
      where: { id, modelId: mid },
      select: {
        id: true,
        modelId: true,
        model: { select: { projectId: true } },
        ends: { select: { role: true, classId: true } },
      },
    });
    if (!g) return null;
    return { kind: "model", modelId: g.modelId, projectId: g.model.projectId, ends: g.ends || [] };
  }

  if (pid) {
    const g = await prisma.generalizationLinkProfile.findFirst({
      where: { id, profileId: pid },
      select: {
        id: true,
        profileId: true,
        profile: { select: { projectId: true } },
        ends: { select: { role: true, classId: true } },
      },
    });
    if (!g) return null;
    return { kind: "profile", profileId: g.profileId, projectId: g.profile.projectId, ends: g.ends || [] };
  }

  // No hint: try model first, then profile.
  const gm = await prisma.generalizationLinkModel.findUnique({
    where: { id },
    select: {
      modelId: true,
      model: { select: { projectId: true } },
      ends: { select: { role: true, classId: true } },
    },
  });
  if (gm) {
    return { kind: "model", modelId: gm.modelId, projectId: gm.model.projectId, ends: gm.ends || [] };
  }

  const gp = await prisma.generalizationLinkProfile.findUnique({
    where: { id },
    select: {
      profileId: true,
      profile: { select: { projectId: true } },
      ends: { select: { role: true, classId: true } },
    },
  });
  if (gp) {
    return { kind: "profile", profileId: gp.profileId, projectId: gp.profile.projectId, ends: gp.ends || [] };
  }

  return null;
}

/**
 * Update GeneralizationLinkModel + its ends.
 *
 * @param {any} tx Prisma transaction client
 * @param {object} args
 * @param {string} args.linkId
 * @param {string} args.modelId
 * @param {object} args.payload
 * @param {string} args.parentClassId
 * @param {string} args.childClassId
 */
async function updateGeneralizationLinkModel(tx, { linkId, modelId, payload, parentClassId, childClassId }) {
  // Ensure referenced classes exist in this model.
  await assertClassExistsInModel(tx, modelId, parentClassId);
  await assertClassExistsInModel(tx, modelId, childClassId);

  await tx.generalizationLinkModel.update({
    where: { id: linkId },
    data: {
      documentation: payload?.documentation ?? null,
      documentationRu: payload?.documentationRu ?? null,
      details: payload?.details ?? null,
      stereotype: String(payload?.stereotype ?? ""),
    },
  });

  await upsertGeneralizationEndModel(tx, { linkId, modelId, role: "parent", classId: parentClassId });
  await upsertGeneralizationEndModel(tx, { linkId, modelId, role: "child", classId: childClassId });
}

/**
 * Update GeneralizationLinkProfile + its ends.
 *
 * @param {any} tx Prisma transaction client
 * @param {object} args
 * @param {string} args.linkId
 * @param {string} args.profileId
 * @param {object} args.payload
 * @param {string} args.parentClassId
 * @param {string} args.childClassId
 */
async function updateGeneralizationLinkProfile(tx, { linkId, profileId, payload, parentClassId, childClassId }) {
  // Ensure referenced classes exist in this profile.
  await assertClassExistsInProfile(tx, profileId, parentClassId);
  await assertClassExistsInProfile(tx, profileId, childClassId);

  await tx.generalizationLinkProfile.update({
    where: { id: linkId },
    data: {
      documentation: payload?.documentation ?? null,
      documentationRu: payload?.documentationRu ?? null,
      details: payload?.details ?? null,
      stereotype: String(payload?.stereotype ?? ""),
    },
  });

  await upsertGeneralizationEndProfile(tx, { linkId, profileId, role: "parent", classId: parentClassId });
  await upsertGeneralizationEndProfile(tx, { linkId, profileId, role: "child", classId: childClassId });
}

/**
 * Create or update a Generalization end row (Model).
 *
 * @param {any} tx Prisma transaction client
 * @param {object} args
 * @param {string} args.linkId
 * @param {string} args.modelId
 * @param {string} args.role 'parent' | 'child'
 * @param {string} args.classId
 */
async function upsertGeneralizationEndModel(tx, { linkId, modelId, role, classId }) {
  const result = await tx.generalizationClassRefModel.updateMany({
    where: { generalizationLinkId: linkId, modelId, role },
    data: { classId },
  });

  if (result.count === 0) {
    await tx.generalizationClassRefModel.create({
      data: {
        generalizationLinkId: linkId,
        modelId,
        role,
        classId,
      },
    });
  }
}

/**
 * Create or update a Generalization end row (Profile).
 *
 * @param {any} tx Prisma transaction client
 * @param {object} args
 * @param {string} args.linkId
 * @param {string} args.profileId
 * @param {string} args.role 'parent' | 'child'
 * @param {string} args.classId
 */
async function upsertGeneralizationEndProfile(tx, { linkId, profileId, role, classId }) {
  const result = await tx.generalizationClassRefProfile.updateMany({
    where: { generalizationLinkId: linkId, profileId, role },
    data: { classId },
  });

  if (result.count === 0) {
    await tx.generalizationClassRefProfile.create({
      data: {
        generalizationLinkId: linkId,
        profileId,
        role,
        classId,
      },
    });
  }
}

/**
 * Ensure a class exists inside a specific model.
 *
 * @param {any} tx Prisma transaction client
 * @param {string} modelId
 * @param {string} classId
 */
async function assertClassExistsInModel(tx, modelId, classId) {
  const c = await tx.classModel.findFirst({ where: { id: String(classId), modelId: String(modelId) }, select: { id: true } });
  if (!c) {
    const err = new Error(`Class not found in model: ${classId}`);
    err.status = 400;
    throw err;
  }
}

/**
 * Ensure a class exists inside a specific profile.
 *
 * @param {any} tx Prisma transaction client
 * @param {string} profileId
 * @param {string} classId
 */
async function assertClassExistsInProfile(tx, profileId, classId) {
  const c = await tx.classProfile.findFirst({ where: { id: String(classId), profileId: String(profileId) }, select: { id: true } });
  if (!c) {
    const err = new Error(`Class not found in profile: ${classId}`);
    err.status = 400;
    throw err;
  }
}
