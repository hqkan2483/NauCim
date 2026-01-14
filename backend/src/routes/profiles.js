import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, sendError } from "../utils/http.js";
import { importProfileRootPackages } from "../services/import-into-existing.js";

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

// Import rootPackages into existing profile (replaces current graph)
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
