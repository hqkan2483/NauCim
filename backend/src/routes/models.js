import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, sendError } from "../utils/http.js";

export const modelsRouter = Router();

const createModelSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.string().optional(),
  version: z.string().min(1).default("1.0"),
  createDate: z.string().min(1),
  modifyDate: z.string().min(1),
  legalState: z.string().optional(),
  legalAct: z.string().optional(),
  accessRights: z.string().optional(),
});

const updateModelSchema = createModelSchema.partial().extend({
  id: z.string().min(1).optional(),
  projectId: z.string().min(1).optional(),
});

// Get all models for a project
modelsRouter.get(
  "/project/:projectId",
  asyncHandler(async (req, res) => {
    const projectId = String(req.params.projectId);
    const models = await prisma.model.findMany({
      where: { projectId },
      orderBy: { modifyDate: "desc" },
    });
    res.json(models);
  })
);

// Get single model by ID
modelsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const model = await prisma.model.findUnique({
      where: { id },
    });
    if (!model) return sendError(res, 404, "Model not found");
    res.json(model);
  })
);

// Create new model
modelsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createModelSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid model", parsed.error.flatten());

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: parsed.data.projectId },
    });
    if (!project) return sendError(res, 404, "Project not found");

    // Check name uniqueness within project
    const existing = await prisma.model.findFirst({
      where: {
        projectId: parsed.data.projectId,
        name: parsed.data.name,
      },
    });
    if (existing) return sendError(res, 409, "Model name already exists in this project");

    const created = await prisma.model.create({ data: parsed.data });
    res.status(201).json(created);
  })
);

// Update model
modelsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const parsed = updateModelSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid model", parsed.error.flatten());

    // Check if model exists
    const existing = await prisma.model.findUnique({ where: { id } });
    if (!existing) return sendError(res, 404, "Model not found");

    // Check name uniqueness if name is being updated
    if (parsed.data.name && parsed.data.name !== existing.name) {
      const duplicate = await prisma.model.findFirst({
        where: {
          projectId: existing.projectId,
          name: parsed.data.name,
          id: { not: id },
        },
      });
      if (duplicate) return sendError(res, 409, "Model name already exists in this project");
    }

    const updated = await prisma.model.update({
      where: { id },
      data: parsed.data,
    });
    res.json(updated);
  })
);

// Delete model
modelsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    try {
      await prisma.model.delete({ where: { id } });
      res.status(204).end();
    } catch {
      return sendError(res, 404, "Model not found");
    }
  })
);
