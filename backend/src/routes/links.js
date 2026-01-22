import { Router } from "express";
import { z } from "zod";
import { asyncHandler, sendError } from "../utils/http.js";
import { updateGeneralizationLinkAndExportProject } from "../services/update-generalization-link.js";
import { updateAssociationLinkAndExportProject } from "../services/update-association-link.js";
import { createGeneralizationLinkAndExportProject } from "../services/create-generalization-link.js";
import { createAssociationLinkAndExportProject } from "../services/create-association-link.js";
import { deleteGeneralizationLinkAndExportProject } from "../services/delete-generalization-link.js";
import { deleteAssociationLinkAndExportProject } from "../services/delete-association-link.js";

export const linksRouter = Router();

const classRefSchema = z
  .object({
    classId: z.string().min(1),
    className: z.string().optional(), // ignored
  })
  .passthrough();

const generalizationLinkSchema = z
  .object({
    linkId: z.string().min(1).optional(),
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
    if (!body.linkId) {
      return sendError(res, 400, "linkId is required for update");
    }
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

const linkEndSchema = z
  .object({
    linkEndId: z.string().min(1).optional(),
    linkEndName: z.string(),
    linkEndClassId: z.string().min(1),
    linkEndClassName: z.string().optional(), // ignored
    multiplicity: z.string().optional(),
    documentation: z.string().nullable().optional(),
    documentationRu: z.string().nullable().optional(),
    details: z.string().nullable().optional(),
    stereotype: z.string().optional(),
  })
  .passthrough();

const associationLinkSchema = z
  .object({
    linkId: z.string().min(1).optional(),
    linkType: z.string().optional(),
    documentation: z.string().nullable().optional(),
    documentationRu: z.string().nullable().optional(),
    details: z.string().nullable().optional(),
    stereotype: z.string().optional(),
    linkEnd: z.array(linkEndSchema).length(2),
  })
  .passthrough();

/**
 * Create a new Generalization link and return a full exported Project.
 *
 * Request:
 * - Body: GeneralizationLink (parent/child classId required). linkId is ignored if provided.
 * - Query: modelId or profileId (required)
 */
linksRouter.post(
  "/generalization",
  asyncHandler(async (req, res) => {
    const parsed = generalizationLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "Invalid GeneralizationLink", parsed.error.flatten());
    }

    const body = parsed.data;
    const modelId = req.query.modelId ? String(req.query.modelId) : "";
    const profileId = req.query.profileId ? String(req.query.profileId) : "";
    const editingClassId = req.query.editingClassId ? String(req.query.editingClassId) : "";

    try {
      const project = await createGeneralizationLinkAndExportProject({
        modelId,
        profileId,
        editingClassId,
        payload: body,
      });

      res.json(project);
    } catch (e) {
      const status = Number(e?.status || 500);
      const msg = e?.message ? String(e.message) : "Failed to create generalization link";
      return sendError(res, status, msg);
    }
  })
);
/**
 * Create a new Association link and return a full exported Project.
 *
 * Request:
 * - Body: AssociationLink (2 linkEnd entries required). linkId is ignored if provided.
 * - Query: modelId or profileId (required)
 */
linksRouter.post(
  "/association",
  asyncHandler(async (req, res) => {
    const parsed = associationLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "Invalid AssociationLink", parsed.error.flatten());
    }

    const body = parsed.data;
    const modelId = req.query.modelId ? String(req.query.modelId) : "";
    const profileId = req.query.profileId ? String(req.query.profileId) : "";
    const editingClassId = req.query.editingClassId ? String(req.query.editingClassId) : "";

    try {
      const project = await createAssociationLinkAndExportProject({
        modelId,
        profileId,
        editingClassId,
        payload: body,
      });

      res.json(project);
    } catch (e) {
      const status = Number(e?.status || 500);
      const msg = e?.message ? String(e.message) : "Failed to create association link";
      return sendError(res, status, msg);
    }
  })
);

/**
 * Update an existing Association link and return a full exported Project.
 *
 * Request:
 * - Path param: :linkId
 * - Body: AssociationLink (per docs/DATA_STRUCTURES.md)
 * - Optional query params:
 *   - modelId / profileId: disambiguates where to update
 *   - editingClassId: used for extra safety validation
 */
linksRouter.put(
  "/association/:linkId",
  asyncHandler(async (req, res) => {
    const linkIdParam = String(req.params.linkId || "");

    const parsed = associationLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "Invalid AssociationLink", parsed.error.flatten());
    }

    const body = parsed.data;
    if (!body.linkId) {
      return sendError(res, 400, "linkId is required for update");
    }
    if (String(body.linkId) !== linkIdParam) {
      return sendError(res, 400, "linkId mismatch");
    }

    const modelId = req.query.modelId ? String(req.query.modelId) : "";
    const profileId = req.query.profileId ? String(req.query.profileId) : "";
    const editingClassId = req.query.editingClassId ? String(req.query.editingClassId) : "";

    try {
      const project = await updateAssociationLinkAndExportProject({
        linkId: linkIdParam,
        modelId,
        profileId,
        editingClassId,
        payload: body,
      });

      res.json(project);
    } catch (e) {
      const status = Number(e?.status || 500);
      const msg = e?.message ? String(e.message) : "Failed to update association link";
      return sendError(res, status, msg);
    }
  })
);

/**
 * Delete an existing Generalization link and return a full exported Project.
 *
 * Request:
 * - Path param: :linkId
 * - Optional query params:
 *   - modelId / profileId: disambiguates where to delete
 *   - editingClassId: used for extra safety validation
 */
linksRouter.delete(
  "/generalization/:linkId",
  asyncHandler(async (req, res) => {
    const linkIdParam = String(req.params.linkId || "");
    const modelId = req.query.modelId ? String(req.query.modelId) : "";
    const profileId = req.query.profileId ? String(req.query.profileId) : "";
    const editingClassId = req.query.editingClassId ? String(req.query.editingClassId) : "";

    try {
      const project = await deleteGeneralizationLinkAndExportProject({
        linkId: linkIdParam,
        modelId,
        profileId,
        editingClassId,
      });

      res.json(project);
    } catch (e) {
      const status = Number(e?.status || 500);
      const msg = e?.message ? String(e.message) : "Failed to delete generalization link";
      return sendError(res, status, msg);
    }
  })
);

/**
 * Delete an existing Association link and return a full exported Project.
 *
 * Request:
 * - Path param: :linkId
 * - Optional query params:
 *   - modelId / profileId: disambiguates where to delete
 *   - editingClassId: used for extra safety validation
 */
linksRouter.delete(
  "/association/:linkId",
  asyncHandler(async (req, res) => {
    const linkIdParam = String(req.params.linkId || "");
    const modelId = req.query.modelId ? String(req.query.modelId) : "";
    const profileId = req.query.profileId ? String(req.query.profileId) : "";
    const editingClassId = req.query.editingClassId ? String(req.query.editingClassId) : "";

    try {
      const project = await deleteAssociationLinkAndExportProject({
        linkId: linkIdParam,
        modelId,
        profileId,
        editingClassId,
      });

      res.json(project);
    } catch (e) {
      const status = Number(e?.status || 500);
      const msg = e?.message ? String(e.message) : "Failed to delete association link";
      return sendError(res, status, msg);
    }
  })
);

