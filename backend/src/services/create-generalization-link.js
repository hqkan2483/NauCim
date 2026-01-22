import { prisma } from "../db.js";
import { exportProject } from "./export-project.js";
import { newId } from "../utils/id-generation.js";
import { validateUniqueParentConstraint } from "./update-generalization-link.js";

/**
 * Create a new Generalization link (Model/Profile) and return full exported Project.
 *
 * Business rules:
 * - modelId xor profileId is required to pick scope
 * - parent.classId and child.classId are required
 * - editingClassId (if provided) must match parent/child
 * - child must not already have another parent (unique parent constraint)
 */
export async function createGeneralizationLinkAndExportProject({
  modelId = "",
  profileId = "",
  editingClassId = "",
  payload,
}) {
  const mid = String(modelId || "");
  const pid = String(profileId || "");

  if (!mid && !pid) {
    const err = new Error("modelId or profileId is required for creating a link");
    err.status = 400;
    throw err;
  }
  if (mid && pid) {
    const err = new Error("Provide either modelId or profileId, not both");
    err.status = 400;
    throw err;
  }

  const parentClassId = String(payload?.parent?.classId || "");
  const childClassId = String(payload?.child?.classId || "");
  if (!parentClassId || !childClassId) {
    const err = new Error("parent.classId and child.classId are required");
    err.status = 400;
    throw err;
  }

  if (editingClassId) {
    const ec = String(editingClassId);
    const matchesIncoming = ec === parentClassId || ec === childClassId;
    if (!matchesIncoming) {
      const err = new Error("editingClassId must match parent.classId or child.classId");
      err.status = 400;
      throw err;
    }
  }

  await validateUniqueParentConstraint({
    linkId: "", // new link, so skip self exclusion
    parentClassId,
    childClassId,
    modelId: mid,
    profileId: pid,
  });

  const linkId = newId("gen");

  await prisma.$transaction(async (tx) => {
    if (mid) {
      await assertClassExistsInModel(tx, mid, parentClassId);
      await assertClassExistsInModel(tx, mid, childClassId);

      await tx.generalizationLinkModel.create({
        data: {
          id: linkId,
          modelId: mid,
          linkType: String(payload?.linkType || "Generalization"),
          documentation: payload?.documentation ?? null,
          documentationRu: payload?.documentationRu ?? null,
          details: payload?.details ?? null,
          stereotype: String(payload?.stereotype ?? ""),
        },
      });

      await tx.generalizationClassRefModel.createMany({
        data: [
          { generalizationLinkId: linkId, modelId: mid, role: "parent", classId: parentClassId },
          { generalizationLinkId: linkId, modelId: mid, role: "child", classId: childClassId },
        ],
      });
    } else {
      await assertClassExistsInProfile(tx, pid, parentClassId);
      await assertClassExistsInProfile(tx, pid, childClassId);

      await tx.generalizationLinkProfile.create({
        data: {
          id: linkId,
          profileId: pid,
          linkType: String(payload?.linkType || "Generalization"),
          documentation: payload?.documentation ?? null,
          documentationRu: payload?.documentationRu ?? null,
          details: payload?.details ?? null,
          stereotype: String(payload?.stereotype ?? ""),
        },
      });

      await tx.generalizationClassRefProfile.createMany({
        data: [
          { generalizationLinkId: linkId, profileId: pid, role: "parent", classId: parentClassId },
          { generalizationLinkId: linkId, profileId: pid, role: "child", classId: childClassId },
        ],
      });
    }
  });

  const projectId = await resolveProjectId(mid, pid);
  const exported = await exportProject(projectId);
  if (!exported) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }

  return exported;
}

async function resolveProjectId(modelId, profileId) {
  if (modelId) {
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      select: { projectId: true },
    });
    return model?.projectId || null;
  }

  if (profileId) {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { projectId: true },
    });
    return profile?.projectId || null;
  }

  return null;
}

async function assertClassExistsInModel(tx, modelId, classId) {
  const cls = await tx.classModel.findFirst({ where: { id: String(classId), modelId: String(modelId) }, select: { id: true } });
  if (!cls) {
    const err = new Error(`Class not found in model: ${classId}`);
    err.status = 400;
    throw err;
  }
}

async function assertClassExistsInProfile(tx, profileId, classId) {
  const cls = await tx.classProfile.findFirst({ where: { id: String(classId), profileId: String(profileId) }, select: { id: true } });
  if (!cls) {
    const err = new Error(`Class not found in profile: ${classId}`);
    err.status = 400;
    throw err;
  }
}
