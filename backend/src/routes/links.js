import { Router } from "express";
import { z } from "zod";
import { asyncHandler, sendError } from "../utils/http.js";
import { updateGeneralizationLinkAndExportProject } from "../services/update-generalization-link.js";

export const linksRouter = Router();

const classRefSchema = z
  .object({
    classId: z.string().min(1),
    className: z.string().optional(), // ignored
  })
  .passthrough();

const generalizationLinkSchema = z
  .object({
    linkId: z.string().min(1),
    linkType: z.string().optional(),
    documentation: z.string().nullable().optional(),
    documentationRu: z.string().nullable().optional(),
    details: z.string().nullable().optional(),
    stereotype: z.string().optional(),
    parent: classRefSchema,
    child: classRefSchema,
  })
  .passthrough();

/**
 * Update an existing Generalization link and return a full exported Project.
 *
 * Request:
 * - Path param: :linkId
 * - Body: GeneralizationLink (per docs/DATA_STRUCTURES.md)
 * - Optional query params:
 *   - modelId / profileId: disambiguates where to update
 *   - editingClassId: used for extra safety validation
 */
linksRouter.put(
  "/generalization/:linkId",
  asyncHandler(async (req, res) => {
    const linkIdParam = String(req.params.linkId || "");

    const parsed = generalizationLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "Invalid GeneralizationLink", parsed.error.flatten());
    }

    const body = parsed.data;
    if (String(body.linkId) !== linkIdParam) {
      return sendError(res, 400, "linkId mismatch");
    }

    const modelId = req.query.modelId ? String(req.query.modelId) : "";
    const profileId = req.query.profileId ? String(req.query.profileId) : "";
    const editingClassId = req.query.editingClassId ? String(req.query.editingClassId) : "";

    try {
      const project = await updateGeneralizationLinkAndExportProject({
        linkId: linkIdParam,
        modelId,
        profileId,
        editingClassId,
        payload: body,
      });

      res.json(project);
    } catch (e) {
      const status = Number(e?.status || 500);
      const msg = e?.message ? String(e.message) : "Failed to update generalization link";
      return sendError(res, status, msg);
    }
  })
);
