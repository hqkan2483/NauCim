import { prisma } from "../db.js";
import { exportProject } from "./export-project.js";
import { newId } from "../utils/id-generation.js";
import { validateUniqueAssociationNames } from "./update-association-link.js";

/**
 * Create a new Association link (Model/Profile) and return full exported Project.
 *
 * Business rules:
 * - modelId xor profileId is required
 * - exactly 2 linkEnd entries required
 * - editingClassId (if provided) must be one of the ends
 * - association names must be unique per class
 */
export async function createAssociationLinkAndExportProject({
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

  if (editingClassId) {
    const ec = String(editingClassId);
    const matchesIncoming = ec === classId1 || ec === classId2;
    if (!matchesIncoming) {
      const err = new Error("editingClassId must match one of the linkEnd classIds");
      err.status = 400;
      throw err;
    }
  }

  const scope = await resolveAssociationScope(mid, pid, linkEnd);

  await validateUniqueAssociationNames({
    scope,
    linkId: "", // new link, no self exclusion
    linkEnd,
  });

  const linkId = newId("assoc");
  const resolvedEnds = linkEnd.map((end) => ({
    ...end,
    linkEndId: String(end?.linkEndId || newId("end")),
  }));

  await prisma.$transaction(async (tx) => {
    if (scope.kind === "model") {
      await assertClassExistsInModel(tx, scope.modelId, classId1);
      await assertClassExistsInModel(tx, scope.modelId, classId2);

      await tx.associationLinkModel.create({
        data: {
          id: linkId,
          modelId: scope.modelId,
          linkType: String(payload?.linkType || "Association"),
          documentation: payload?.documentation ?? null,
          documentationRu: payload?.documentationRu ?? null,
          details: payload?.details ?? null,
          stereotype: String(payload?.stereotype ?? ""),
        },
      });

      for (const end of resolvedEnds) {
        await tx.associationLinkEndModel.create({
          data: {
            linkEndId: String(end.linkEndId),
            associationLinkId: linkId,
            modelId: scope.modelId,
            linkEndName: String(end?.linkEndName || ""),
            linkEndClassId: String(end?.linkEndClassId || ""),
            multiplicity: String(end?.multiplicity ?? ""),
            documentation: end?.documentation ?? null,
            documentationRu: end?.documentationRu ?? null,
            details: end?.details ?? null,
            stereotype: String(end?.stereotype ?? ""),
          },
        });
      }
    } else {
      await assertClassExistsInProfile(tx, scope.profileId, classId1);
      await assertClassExistsInProfile(tx, scope.profileId, classId2);

      await tx.associationLinkProfile.create({
        data: {
          id: linkId,
          profileId: scope.profileId,
          linkType: String(payload?.linkType || "Association"),
          documentation: payload?.documentation ?? null,
          documentationRu: payload?.documentationRu ?? null,
          details: payload?.details ?? null,
          stereotype: String(payload?.stereotype ?? ""),
        },
      });

      for (const end of resolvedEnds) {
        await tx.associationLinkEndProfile.create({
          data: {
            linkEndId: String(end.linkEndId),
            associationLinkId: linkId,
            profileId: scope.profileId,
            linkEndName: String(end?.linkEndName || ""),
            linkEndClassId: String(end?.linkEndClassId || ""),
            multiplicity: String(end?.multiplicity ?? ""),
            documentation: end?.documentation ?? null,
            documentationRu: end?.documentationRu ?? null,
            details: end?.details ?? null,
            stereotype: String(end?.stereotype ?? ""),
          },
        });
      }
    }
  });

  const exported = await exportProject(scope.projectId);
  if (!exported) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }

  return exported;
}

async function resolveAssociationScope(modelId, profileId, linkEnd) {
  const mid = String(modelId || "");
  const pid = String(profileId || "");

  if (mid) {
    const model = await prisma.model.findUnique({
      where: { id: mid },
      select: { projectId: true },
    });
    if (!model) {
      const err = new Error("Model not found");
      err.status = 404;
      throw err;
    }
    return { kind: "model", modelId: mid, projectId: model.projectId, ends: linkEnd || [] };
  }

  if (pid) {
    const profile = await prisma.profile.findUnique({
      where: { id: pid },
      select: { projectId: true },
    });
    if (!profile) {
      const err = new Error("Profile not found");
      err.status = 404;
      throw err;
    }
    return { kind: "profile", profileId: pid, projectId: profile.projectId, ends: linkEnd || [] };
  }

  const err = new Error("modelId or profileId is required");
  err.status = 400;
  throw err;
}

async function assertClassExistsInModel(tx, modelId, classId) {
  const cls = await tx.classModel.findFirst({ where: { id: String(classId), modelId: String(modelId) }, select: { id: true } });
  if (!cls) {
    const err = new Error(`Class ${classId} not found in model ${modelId}`);
    err.status = 404;
    throw err;
  }
}

async function assertClassExistsInProfile(tx, profileId, classId) {
  const cls = await tx.classProfile.findFirst({ where: { id: String(classId), profileId: String(profileId) }, select: { id: true } });
  if (!cls) {
    const err = new Error(`Class ${classId} not found in profile ${profileId}`);
    err.status = 404;
    throw err;
  }
}
