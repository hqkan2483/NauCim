import { prisma } from "../db.js";
import { exportProject } from "./export-project.js";

/**
 * Update an existing Association link (Model/Profile) and return full exported Project.
 *
 * Business rules:
 * - The link must exist.
 * - If `editingClassId` is provided, it must match one of the linkEnd classIds.
 * - linkEnd must contain exactly 2 ends.
 * - Each end must have a unique linkEndName within its class (no duplicate association names).
 *
 * @param {object} args
 * @param {string} args.linkId - ID of the association link to update
 * @param {string} [args.modelId] - Optional model ID for disambiguation
 * @param {string} [args.profileId] - Optional profile ID for disambiguation
 * @param {string} [args.editingClassId] - Optional class ID being edited (for validation)
 * @param {object} args.payload - AssociationLink data
 */
export async function updateAssociationLinkAndExportProject({
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

  // Validate linkEnd array
  const linkEnd = Array.isArray(payload?.linkEnd) ? payload.linkEnd : [];
  if (linkEnd.length !== 2) {
    const err = new Error("Association link must have exactly 2 linkEnd entries");
    err.status = 400;
    throw err;
  }

  const [end1, end2] = linkEnd;
  const classId1 = String(end1?.linkEndClassId || "");
  const classId2 = String(end2?.linkEndClassId || "");
  
  if (!classId1 || !classId2) {
    const err = new Error("Both linkEnd entries must have linkEndClassId");
    err.status = 400;
    throw err;
  }

  // Validate editingClassId if provided
  if (editingClassId) {
    const ec = String(editingClassId);
    const matchesIncoming = ec === classId1 || ec === classId2;
    if (!matchesIncoming) {
      const err = new Error("editingClassId must match one of the linkEnd classIds");
      err.status = 400;
      throw err;
    }
  }

  // Resolve where the association link lives
  const scope = await resolveAssociationScope({ id, modelId, profileId });
  if (!scope) {
    const err = new Error("Association link not found");
    err.status = 404;
    throw err;
  }

  // Extra safety validation: ensure the editing class belongs to this link.
  if (editingClassId) {
    const ec = String(editingClassId);
    const hasEnd = scope.ends.some((e) => String(e?.linkEndClassId || "") === ec);
    if (!hasEnd) {
      const err = new Error("editingClassId is not an end of this link");
      err.status = 400;
      throw err;
    }
  }

  // Validate unique association names per class
  await validateUniqueAssociationNames({
    scope,
    linkId: id,
    linkEnd,
  });

  // Update in transaction
  await prisma.$transaction(async (tx) => {
    if (scope.kind === "model") {
      await updateAssociationLinkModel(tx, {
        linkId: id,
        modelId: scope.modelId,
        payload,
        linkEnd,
      });
    } else {
      await updateAssociationLinkProfile(tx, {
        linkId: id,
        profileId: scope.profileId,
        payload,
        linkEnd,
      });
    }
  });

  // Export and return full project
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
 * Validate that association names are unique within each class.
 * Checks that no other association on the same class has the same linkEndName.
 *
 * @param {object} args
 * @param {object} args.scope - Resolved scope (kind, modelId/profileId, projectId, ends)
 * @param {string} args.linkId - Current link ID being updated
 * @param {Array} args.linkEnd - Array of 2 linkEnd objects
 */
export async function validateUniqueAssociationNames({ scope, linkId, linkEnd }) {
  for (const end of linkEnd) {
    const classId = String(end?.linkEndClassId || "");
    const endName = String(end?.linkEndName || "").trim();
    
    if (!endName) continue; // Empty names are allowed, skip validation
    
    if (scope.kind === "model") {
      // Check if any other association end on this class has the same name
      const conflictingEnd = await prisma.associationLinkEndModel.findFirst({
        where: {
          modelId: scope.modelId,
          linkEndClassId: classId,
          linkEndName: endName,
          associationLinkId: { not: linkId }, // Exclude current link
        },
        select: { linkEndId: true, linkEndName: true },
      });
      
      if (conflictingEnd) {
        const err = new Error(
          `Association name "${endName}" is already used in this class. Each association must have a unique name within a class.`
        );
        err.status = 409; // Conflict
        throw err;
      }
    } else {
      // Profile
      const conflictingEnd = await prisma.associationLinkEndProfile.findFirst({
        where: {
          profileId: scope.profileId,
          linkEndClassId: classId,
          linkEndName: endName,
          associationLinkId: { not: linkId },
        },
        select: { linkEndId: true, linkEndName: true },
      });
      
      if (conflictingEnd) {
        const err = new Error(
          `Association name "${endName}" is already used in this class. Each association must have a unique name within a class.`
        );
        err.status = 409;
        throw err;
      }
    }
  }
}

/**
 * Resolve where the association link lives (model or profile).
 * If modelId/profileId provided, they are used for disambiguation.
 *
 * @param {object} args
 * @param {string} args.id - Link ID
 * @param {string} args.modelId - Optional model ID
 * @param {string} args.profileId - Optional profile ID
 * @returns {Promise<null|{kind:'model', modelId:string, projectId:string, ends:Array}|{kind:'profile', profileId:string, projectId:string, ends:Array}>}
 */
async function resolveAssociationScope({ id, modelId, profileId }) {
  const mid = String(modelId || "");
  const pid = String(profileId || "");

  if (mid && pid) {
    const err = new Error("Provide either modelId or profileId, not both");
    err.status = 400;
    throw err;
  }

  if (mid) {
    const a = await prisma.associationLinkModel.findFirst({
      where: { id, modelId: mid },
      select: {
        id: true,
        modelId: true,
        model: { select: { projectId: true } },
        linkEnd: { select: { linkEndId: true, linkEndClassId: true, linkEndName: true } },
      },
    });
    if (!a) return null;
    return { kind: "model", modelId: a.modelId, projectId: a.model.projectId, ends: a.linkEnd || [] };
  }

  if (pid) {
    const a = await prisma.associationLinkProfile.findFirst({
      where: { id, profileId: pid },
      select: {
        id: true,
        profileId: true,
        profile: { select: { projectId: true } },
        linkEnd: { select: { linkEndId: true, linkEndClassId: true, linkEndName: true } },
      },
    });
    if (!a) return null;
    return { kind: "profile", profileId: a.profileId, projectId: a.profile.projectId, ends: a.linkEnd || [] };
  }

  // No hint: try model first, then profile.
  const am = await prisma.associationLinkModel.findUnique({
    where: { id },
    select: {
      modelId: true,
      model: { select: { projectId: true } },
      linkEnd: { select: { linkEndId: true, linkEndClassId: true, linkEndName: true } },
    },
  });
  if (am) {
    return { kind: "model", modelId: am.modelId, projectId: am.model.projectId, ends: am.linkEnd || [] };
  }

  const ap = await prisma.associationLinkProfile.findUnique({
    where: { id },
    select: {
      profileId: true,
      profile: { select: { projectId: true } },
      linkEnd: { select: { linkEndId: true, linkEndClassId: true, linkEndName: true } },
    },
  });
  if (ap) {
    return { kind: "profile", profileId: ap.profileId, projectId: ap.profile.projectId, ends: ap.linkEnd || [] };
  }

  return null;
}

/**
 * Update AssociationLinkModel and its ends.
 *
 * @param {any} tx - Prisma transaction client
 * @param {object} args
 * @param {string} args.linkId - Link ID
 * @param {string} args.modelId - Model ID
 * @param {object} args.payload - Association link data
 * @param {Array} args.linkEnd - Array of 2 linkEnd objects
 */
async function updateAssociationLinkModel(tx, { linkId, modelId, payload, linkEnd }) {
  // Ensure referenced classes exist in this model
  for (const end of linkEnd) {
    const classId = String(end?.linkEndClassId || "");
    await assertClassExistsInModel(tx, modelId, classId);
  }

  // Update the main association link record
  await tx.associationLinkModel.update({
    where: { id: linkId },
    data: {
      documentation: payload?.documentation ?? null,
      documentationRu: payload?.documentationRu ?? null,
      details: payload?.details ?? null,
      stereotype: String(payload?.stereotype ?? ""),
    },
  });

  // Update each linkEnd
  for (const end of linkEnd) {
    await upsertAssociationLinkEndModel(tx, {
      linkId,
      modelId,
      endData: end,
    });
  }
}

/**
 * Update AssociationLinkProfile and its ends.
 *
 * @param {any} tx - Prisma transaction client
 * @param {object} args
 * @param {string} args.linkId - Link ID
 * @param {string} args.profileId - Profile ID
 * @param {object} args.payload - Association link data
 * @param {Array} args.linkEnd - Array of 2 linkEnd objects
 */
async function updateAssociationLinkProfile(tx, { linkId, profileId, payload, linkEnd }) {
  // Ensure referenced classes exist in this profile
  for (const end of linkEnd) {
    const classId = String(end?.linkEndClassId || "");
    await assertClassExistsInProfile(tx, profileId, classId);
  }

  // Update the main association link record
  await tx.associationLinkProfile.update({
    where: { id: linkId },
    data: {
      documentation: payload?.documentation ?? null,
      documentationRu: payload?.documentationRu ?? null,
      details: payload?.details ?? null,
      stereotype: String(payload?.stereotype ?? ""),
    },
  });

  // Update each linkEnd
  for (const end of linkEnd) {
    await upsertAssociationLinkEndProfile(tx, {
      linkId,
      profileId,
      endData: end,
    });
  }
}

/**
 * Create or update an AssociationLinkEnd row (Model).
 *
 * @param {any} tx - Prisma transaction client
 * @param {object} args
 * @param {string} args.linkId - Association link ID
 * @param {string} args.modelId - Model ID
 * @param {object} args.endData - LinkEnd data
 */
async function upsertAssociationLinkEndModel(tx, { linkId, modelId, endData }) {
  const linkEndId = String(endData?.linkEndId || "");
  
  if (!linkEndId) {
    const err = new Error("linkEndId is required for each linkEnd");
    err.status = 400;
    throw err;
  }

  const data = {
    associationLinkId: linkId,
    modelId,
    linkEndName: String(endData?.linkEndName || ""),
    linkEndClassId: String(endData?.linkEndClassId || ""),
    multiplicity: String(endData?.multiplicity ?? ""),
    documentation: endData?.documentation ?? null,
    documentationRu: endData?.documentationRu ?? null,
    details: endData?.details ?? null,
    stereotype: String(endData?.stereotype ?? ""),
  };

  // Try to update first
  const result = await tx.associationLinkEndModel.updateMany({
    where: { linkEndId },
    data,
  });

  // If not found, create new
  if (result.count === 0) {
    await tx.associationLinkEndModel.create({
      data: {
        linkEndId,
        ...data,
      },
    });
  }
}

/**
 * Create or update an AssociationLinkEnd row (Profile).
 *
 * @param {any} tx - Prisma transaction client
 * @param {object} args
 * @param {string} args.linkId - Association link ID
 * @param {string} args.profileId - Profile ID
 * @param {object} args.endData - LinkEnd data
 */
async function upsertAssociationLinkEndProfile(tx, { linkId, profileId, endData }) {
  const linkEndId = String(endData?.linkEndId || "");
  
  if (!linkEndId) {
    const err = new Error("linkEndId is required for each linkEnd");
    err.status = 400;
    throw err;
  }

  const data = {
    associationLinkId: linkId,
    profileId,
    linkEndName: String(endData?.linkEndName || ""),
    linkEndClassId: String(endData?.linkEndClassId || ""),
    multiplicity: String(endData?.multiplicity ?? ""),
    documentation: endData?.documentation ?? null,
    documentationRu: endData?.documentationRu ?? null,
    details: endData?.details ?? null,
    stereotype: String(endData?.stereotype ?? ""),
  };

  // Try to update first
  const result = await tx.associationLinkEndProfile.updateMany({
    where: { linkEndId },
    data,
  });

  // If not found, create new
  if (result.count === 0) {
    await tx.associationLinkEndProfile.create({
      data: {
        linkEndId,
        ...data,
      },
    });
  }
}

/**
 * Ensure a class exists inside a specific model.
 *
 * @param {any} tx - Prisma transaction client
 * @param {string} modelId - Model ID
 * @param {string} classId - Class ID
 */
async function assertClassExistsInModel(tx, modelId, classId) {
  const cls = await tx.classModel.findFirst({
    where: { id: classId, modelId },
    select: { id: true },
  });
  if (!cls) {
    const err = new Error(`Class ${classId} not found in model ${modelId}`);
    err.status = 404;
    throw err;
  }
}

/**
 * Ensure a class exists inside a specific profile.
 *
 * @param {any} tx - Prisma transaction client
 * @param {string} profileId - Profile ID
 * @param {string} classId - Class ID
 */
async function assertClassExistsInProfile(tx, profileId, classId) {
  const cls = await tx.classProfile.findFirst({
    where: { id: classId, profileId },
    select: { id: true },
  });
  if (!cls) {
    const err = new Error(`Class ${classId} not found in profile ${profileId}`);
    err.status = 404;
    throw err;
  }
}
