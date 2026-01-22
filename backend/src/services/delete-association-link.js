import { prisma } from "../db.js";
import { exportProject } from "./export-project.js";
import { resolveAssociationScope } from "./link-scope.js";

/**
 * Delete an Association link (Model/Profile) and return full exported Project.
 * Also deletes related AssociationLinkEnd rows explicitly.
 *
 * @param {object} args
 * @param {string} args.linkId - Link ID to delete
 * @param {string} [args.modelId] - Optional model ID for disambiguation
 * @param {string} [args.profileId] - Optional profile ID for disambiguation
 * @param {string} [args.editingClassId] - Optional class ID for extra safety validation
 * @returns {Promise<object>} Full exported project
 */
export async function deleteAssociationLinkAndExportProject({
  linkId,
  modelId = "",
  profileId = "",
  editingClassId = "",
}) {
  const id = String(linkId || "");
  if (!id) {
    const err = new Error("linkId is required");
    err.status = 400;
    throw err;
  }

  const scope = await resolveAssociationScope({ id, modelId, profileId });
  if (!scope) {
    const err = new Error("Association link not found");
    err.status = 404;
    throw err;
  }

  if (editingClassId) {
    const ec = String(editingClassId);
    const hasEnd = scope.ends.some((e) => String(e?.linkEndClassId || "") === ec);
    if (!hasEnd) {
      const err = new Error("editingClassId is not an end of this link");
      err.status = 400;
      throw err;
    }
  }

  await prisma.$transaction(async (tx) => {
    if (scope.kind === "model") {
      await tx.associationLinkEndModel.deleteMany({
        where: { associationLinkId: id, modelId: scope.modelId },
      });
      await tx.associationLinkModel.delete({ where: { id } });
    } else {
      await tx.associationLinkEndProfile.deleteMany({
        where: { associationLinkId: id, profileId: scope.profileId },
      });
      await tx.associationLinkProfile.delete({ where: { id } });
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
