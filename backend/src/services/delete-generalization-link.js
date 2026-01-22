import { prisma } from "../db.js";
import { exportProject } from "./export-project.js";
import { resolveGeneralizationScope } from "./link-scope.js";

/**
 * Delete a Generalization link (Model/Profile) and return full exported Project.
 * Also deletes related GeneralizationClassRef rows explicitly.
 *
 * @param {object} args
 * @param {string} args.linkId - Link ID to delete
 * @param {string} [args.modelId] - Optional model ID for disambiguation
 * @param {string} [args.profileId] - Optional profile ID for disambiguation
 * @param {string} [args.editingClassId] - Optional class ID for extra safety validation
 * @returns {Promise<object>} Full exported project
 */
export async function deleteGeneralizationLinkAndExportProject({
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

  const scope = await resolveGeneralizationScope({ id, modelId, profileId });
  if (!scope) {
    const err = new Error("Generalization link not found");
    err.status = 404;
    throw err;
  }

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
      await tx.generalizationClassRefModel.deleteMany({
        where: { generalizationLinkId: id, modelId: scope.modelId },
      });
      await tx.generalizationLinkModel.delete({ where: { id } });
    } else {
      await tx.generalizationClassRefProfile.deleteMany({
        where: { generalizationLinkId: id, profileId: scope.profileId },
      });
      await tx.generalizationLinkProfile.delete({ where: { id } });
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
