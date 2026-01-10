import { Router } from "express";
import { asyncHandler, sendError } from "../utils/http.js";
import { importProject } from "../services/import-project.js";
import { exportProject } from "../services/export-project.js";

export const importExportRouter = Router();

importExportRouter.post(
  "/import/project",
  asyncHandler(async (req, res) => {
    const project = req.body;
    if (!project || typeof project !== "object") return sendError(res, 400, "Invalid body");

    const result = await importProject(project);
    res.status(201).json(result);
  })
);

importExportRouter.get(
  "/export/project/:id",
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const project = await exportProject(id);
    if (!project) return sendError(res, 404, "Project not found");
    res.json(project);
  })
);
