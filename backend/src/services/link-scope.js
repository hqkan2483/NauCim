import { prisma } from "../db.js";

/**
 * Resolve where the generalization link lives (model or profile).
 * If modelId/profileId provided, they are used for disambiguation.
 *
 * @param {object} args
 * @param {string} args.id - Link ID
 * @param {string} [args.modelId] - Optional model ID
 * @param {string} [args.profileId] - Optional profile ID
 * @returns {Promise<null|{kind:'model', modelId:string, projectId:string, ends:Array}|{kind:'profile', profileId:string, projectId:string, ends:Array}>}
 */
export async function resolveGeneralizationScope({ id, modelId = "", profileId = "" }) {
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
 * Resolve where the association link lives (model or profile).
 * If modelId/profileId provided, they are used for disambiguation.
 *
 * @param {object} args
 * @param {string} args.id - Link ID
 * @param {string} [args.modelId] - Optional model ID
 * @param {string} [args.profileId] - Optional profile ID
 * @returns {Promise<null|{kind:'model', modelId:string, projectId:string, ends:Array}|{kind:'profile', profileId:string, projectId:string, ends:Array}>}
 */
export async function resolveAssociationScope({ id, modelId = "", profileId = "" }) {
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
