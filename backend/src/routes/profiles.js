import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, sendError } from "../utils/http.js";
import { importProfileRootPackages } from "../services/import-into-existing.js";
import { exportProject } from "../services/export-project.js";

export const profilesRouter = Router();

const createProfileSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().min(1).default("1.0"),
  createDate: z.string().min(1),
  modifyDate: z.string().min(1),
  legalState: z.string().optional(),
  legalAct: z.string().optional(),
  accessRights: z.string().optional(),
});

const updateProfileSchema = createProfileSchema.partial().extend({
  id: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
});

const importRootPackagesSchema = z
  .object({
    path: z.string().optional(),
    rootPackages: z.any().optional(),
    rootPackage: z.any().optional(),
  })
  .passthrough();

const updatePackageSchema = z
  .object({
    id: z.string().min(1).optional(),
    profileId: z.string().min(1).optional(),
    parentId: z.string().nullable().optional(),
    srcId: z.string().nullable().optional(),

    name: z.string().optional(),
    type: z.string().nullable().optional(),
    parentPackage: z.string().nullable().optional(),
    documentation: z.string().nullable().optional(),
    documentationRu: z.string().nullable().optional(),
    details: z.string().nullable().optional(),
  })
  .passthrough();

const updateClassSchema = z
  .object({
    id: z.string().min(1).optional(),
    profileId: z.string().min(1).optional(),
    packageId: z.string().min(1).optional(),
    srcId: z.string().nullable().optional(),

    name: z.string().optional(),
    type: z.string().nullable().optional(),
    stereotype: z.string().nullable().optional(),
    documentation: z.string().nullable().optional(),
    documentationRu: z.string().nullable().optional(),
    details: z.string().nullable().optional(),
    isAbstract: z.boolean().nullable().optional(),

    refModelId: z.string().nullable().optional(),
    refModelItemId: z.string().nullable().optional(),
  })
  .passthrough();

const updateAttributeSchema = z
  .object({
    id: z.string().min(1).optional(),
    profileId: z.string().min(1).optional(),
    classId: z.string().min(1).optional(),
    srcId: z.string().nullable().optional(),

    name: z.string().optional(),
    dataTypeId: z.string().nullable().optional(),
    stereotype: z.string().nullable().optional(),
    multiplicity: z.string().nullable().optional(),
    documentation: z.string().nullable().optional(),
    documentationRu: z.string().nullable().optional(),
    details: z.string().nullable().optional(),
    initialValue: z.string().nullable().optional(),

    refModelId: z.string().nullable().optional(),
    refModelItemId: z.string().nullable().optional(),
  })
  .passthrough();

// Get all profiles for a project
profilesRouter.get(
  "/project/:projectId",
  asyncHandler(async (req, res) => {
    const projectId = String(req.params.projectId);
    const profiles = await prisma.profile.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
    });
    res.json(profiles);
  })
);

// Get single profile by ID
profilesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const profile = await prisma.profile.findUnique({
      where: { id },
    });
    if (!profile) return sendError(res, 404, "Profile not found");
    res.json(profile);
  })
);

// Get profile header (everything except rootPackages)
profilesRouter.get(
  "/:id/header",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const profile = await prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        name: true,
        description: true,
        version: true,
        createDate: true,
        modifyDate: true,
        legalState: true,
        legalAct: true,
        accessRights: true,

        relatedModels: {
          select: {
            id: true,
            projectId: true,
            name: true,
            description: true,
            type: true,
            version: true,
            createDate: true,
            modifyDate: true,
            legalState: true,
            legalAct: true,
            accessRights: true,
          },
          orderBy: { name: "asc" },
        },
      },
    });
    if (!profile) return sendError(res, 404, "Profile not found");
    res.json(profile);
  })
);

// Create new profile
profilesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createProfileSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid profile", parsed.error.flatten());

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: parsed.data.projectId },
    });
    if (!project) return sendError(res, 404, "Project not found");

    // Check name uniqueness within project
    const existing = await prisma.profile.findFirst({
      where: {
        projectId: parsed.data.projectId,
        name: parsed.data.name,
      },
    });
    if (existing) return sendError(res, 409, "Profile name already exists in this project");

    const created = await prisma.profile.create({ data: parsed.data });
    res.status(201).json(created);
  })
);

// Update profile
profilesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid profile", parsed.error.flatten());

    // Check if profile exists
    const existing = await prisma.profile.findUnique({ where: { id } });
    if (!existing) return sendError(res, 404, "Profile not found");

    // Check name uniqueness if name is being updated
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const duplicate = await prisma.profile.findFirst({
        where: {
          projectId: existing.projectId,
          name: parsed.data.name,
          id: { not: id },
        },
      });
      if (duplicate) return sendError(res, 409, "Profile name already exists in this project");
    }

    const updated = await prisma.profile.update({
      where: { id },
      data: parsed.data,
    });
    res.json(updated);
  })
);

// Update a package inside a profile graph.
// Returns full updated project (export payload).
profilesRouter.put(
  "/:profileId/packages/:packageId",
  asyncHandler(async (req, res) => {
    const profileId = String(req.params.profileId);
    const packageId = String(req.params.packageId);
    const parsed = updatePackageSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "Invalid package update", parsed.error.flatten());
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, projectId: true },
    });
    if (!profile) return sendError(res, 404, "Profile not found");

    const existing = await prisma.packageProfile.findUnique({
      where: { id: packageId },
      select: { id: true, profileId: true },
    });
    if (!existing || String(existing.profileId) !== String(profileId)) {
      return sendError(res, 404, "Package not found");
    }

    const allowed = {
      name: parsed.data.name,
      documentation: parsed.data.documentation,
      documentationRu: parsed.data.documentationRu,
      details: parsed.data.details,
      type: parsed.data.type,
      parentPackage: parsed.data.parentPackage,
      parentId: parsed.data.parentId,
      srcId: parsed.data.srcId,
    };
    const data = Object.fromEntries(
      Object.entries(allowed).filter(([, v]) => v !== undefined)
    );

    await prisma.packageProfile.update({
      where: { id: packageId },
      data,
    });

    const project = await exportProject(profile.projectId);
    if (!project) return sendError(res, 404, "Project not found");
    res.json(project);
  })
);

// Update a class inside a profile graph.
// Returns full updated project (export payload).
profilesRouter.put(
  "/:profileId/classes/:classId",
  asyncHandler(async (req, res) => {
    const profileId = String(req.params.profileId);
    const classId = String(req.params.classId);
    const parsed = updateClassSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "Invalid class update", parsed.error.flatten());
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, projectId: true },
    });
    if (!profile) return sendError(res, 404, "Profile not found");

    const existing = await prisma.classProfile.findUnique({
      where: { id: classId },
      select: { id: true, profileId: true },
    });
    if (!existing || String(existing.profileId) !== String(profileId)) {
      return sendError(res, 404, "Class not found");
    }

    const allowed = {
      name: parsed.data.name,
      stereotype: parsed.data.stereotype,
      documentation: parsed.data.documentation,
      documentationRu: parsed.data.documentationRu,
      details: parsed.data.details,
      isAbstract: parsed.data.isAbstract,
      refModelId: parsed.data.refModelId,
      refModelItemId: parsed.data.refModelItemId,
      srcId: parsed.data.srcId,
    };
    const data = Object.fromEntries(
      Object.entries(allowed).filter(([, v]) => v !== undefined)
    );

    await prisma.classProfile.update({
      where: { id: classId },
      data,
    });

    const project = await exportProject(profile.projectId);
    if (!project) return sendError(res, 404, "Project not found");
    res.json(project);
  })
);

// Update an attribute inside a profile graph.
// Returns full updated project (export payload).
profilesRouter.put(
  "/:profileId/attributes/:attributeId",
  asyncHandler(async (req, res) => {
    const profileId = String(req.params.profileId);
    const attributeId = String(req.params.attributeId);
    const parsed = updateAttributeSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "Invalid attribute update", parsed.error.flatten());
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, projectId: true },
    });
    if (!profile) return sendError(res, 404, "Profile not found");

    const existing = await prisma.attributeProfile.findFirst({
      where: { id: attributeId, profileId },
      select: { id: true, profileId: true },
    });
    if (!existing) return sendError(res, 404, "Attribute not found");

    // Normalize dataTypeId (treat empty string as null)
    const rawDataTypeId = parsed.data.dataTypeId;
    const normalizedDataTypeId =
      rawDataTypeId === undefined || rawDataTypeId === null
        ? rawDataTypeId
        : String(rawDataTypeId).trim() || null;

    // Validate dataTypeId if provided (must exist in same profile)
    if (normalizedDataTypeId) {
      const existsType = await prisma.classProfile.findFirst({
        where: { id: String(normalizedDataTypeId), profileId },
        select: { id: true },
      });
      if (!existsType) return sendError(res, 400, "Invalid dataTypeId (class not found in profile)");
    }

    const allowed = {
      name: parsed.data.name,
      dataTypeId: normalizedDataTypeId,
      stereotype: parsed.data.stereotype,
      multiplicity: parsed.data.multiplicity,
      documentation: parsed.data.documentation,
      documentationRu: parsed.data.documentationRu,
      details: parsed.data.details,
      initialValue: parsed.data.initialValue,
      refModelId: parsed.data.refModelId,
      refModelItemId: parsed.data.refModelItemId,
      srcId: parsed.data.srcId,
    };
    const data = Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined));

    await prisma.attributeProfile.update({
      where: { id: attributeId },
      data,
    });

    const project = await exportProject(profile.projectId);
    if (!project) return sendError(res, 404, "Project not found");
    res.json(project);
  })
);

// Lookup classes/enumerations for data type selection (lightweight list).
// Returns only fields needed by UI picker.
profilesRouter.get(
  "/:profileId/classes/summary",
  asyncHandler(async (req, res) => {
    const profileId = String(req.params.profileId);

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true },
    });
    if (!profile) return sendError(res, 404, "Profile not found");

    const items = await prisma.classProfile.findMany({
      where: {
        profileId,
        OR: [{ type: null }, { type: { in: ["Class", "Enumeration"] } }],
      },
      select: {
        id: true,
        name: true,
        type: true,
        stereotype: true,
        documentation: true,
        documentationRu: true,
      },
      orderBy: { name: "asc" },
    });

    res.json(
      items.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type ?? "Class",
        stereotype: c.stereotype ?? "",
        documentation: c.documentation ?? null,
        documentationRu: c.documentationRu ?? null,
      }))
    );
  })
);

// Import rootPackage graph into existing profile (replaces current graph)
// Notes:
// - Before importing, backend deletes all existing graph records for this profile.
// - Input must represent exactly ONE rootPackage.
// Accepts either:
// - { rootPackage: { ... } } (recommended)
// - { rootPackages: [ { ... } ] } (must contain exactly one item)
// - { path: "C:/.../file.json" } (backend reads JSON from disk; file must contain one rootPackage)
profilesRouter.post(
  "/:id/import",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const parsed = importRootPackagesSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid import payload", parsed.error.flatten());

    try {
      const project = await importProfileRootPackages({
        profileId: id,
        path: parsed.data.path,
        rootPackages: parsed.data.rootPackages ?? parsed.data.rootPackage,
      });
      res.json(project);
    } catch (e) {
      const status = e?.status ? Number(e.status) : 500;
      const msg = e?.message ? String(e.message) : "Import failed";
      return sendError(res, status, msg);
    }
  })
);

// Delete profile
profilesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    try {
      await prisma.profile.delete({ where: { id } });
      res.status(204).end();
    } catch {
      return sendError(res, 404, "Profile not found");
    }
  })
);
