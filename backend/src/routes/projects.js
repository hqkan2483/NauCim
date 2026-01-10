import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, sendError } from "../utils/http.js";

export const projectsRouter = Router();

const createProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().min(1).default("1.0"),
  createDate: z.string().min(1),
  modifyDate: z.string().min(1),
  accessRights: z.string().optional(),
});

const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().min(1).optional(),
});

projectsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const projects = await prisma.project.findMany({
      orderBy: { modifyDate: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        version: true,
        createDate: true,
        modifyDate: true,
        accessRights: true,
      },
    });
    res.json(projects);
  })
);

projectsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid project", parsed.error.flatten());

    const created = await prisma.project.create({ data: parsed.data });
    res.status(201).json(created);
  })
);

projectsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        models: { select: { id: true, name: true, version: true, type: true, modifyDate: true } },
        profiles: { select: { id: true, name: true, version: true, modifyDate: true } },
      },
    });
    if (!project) return sendError(res, 404, "Project not found");
    res.json(project);
  })
);

projectsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) return sendError(res, 400, "Invalid project", parsed.error.flatten());

    try {
      const updated = await prisma.project.update({
        where: { id },
        data: parsed.data,
      });
      res.json(updated);
    } catch {
      return sendError(res, 404, "Project not found");
    }
  })
);

projectsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    try {
      await prisma.project.delete({ where: { id } });
      res.status(204).end();
    } catch {
      return sendError(res, 404, "Project not found");
    }
  })
);
