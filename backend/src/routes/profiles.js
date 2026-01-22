import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, sendError } from "../utils/http.js";
import { importProfileRootPackages } from "../services/import-into-existing.js";
import { exportProject } from "../services/export-project.js";
import { deleteProfilePackageAndExportProject } from "../services/delete-package.js";
import { deleteProfileClassAndExportProject } from "../services/delete-class.js";
import { deleteProfileAttributeAndExportProject } from "../services/delete-attribute.js";
import { newId } from "../utils/id-generation.js";

export const profilesRouter = Router();

function normalizeName(name) {
  return String(name ?? "").trim().toLocaleLowerCase();
}

function normalizeAttrName(name) {
  return String(name ?? "").trim().toLocaleLowerCase();
}

async function assertUniqueSubpackageNameInProfile({ profileId, parentId, name, excludePackageId = null }) {
  const normalized = normalizeName(name);
  if (!normalized) return;

  const siblings = await prisma.packageProfile.findMany({
    where: { profileId: String(profileId), parentId: String(parentId) },
    select: { id: true, name: true },
  });

  const conflict = siblings.find((p) => {
    if (excludePackageId && String(p.id) === String(excludePackageId)) return false;
    return normalizeName(p.name) === normalized;
  });

  if (conflict) {
    const err = new Error("Package name already exists under this parent");
    err.status = 409;
    throw err;
  }
}

async function assertUniqueClassNameInProfile({ profileId, name, excludeClassId = null }) {
  const normalized = normalizeName(name);
  if (!normalized) return;

  const classes = await prisma.classProfile.findMany({
    where: { profileId: String(profileId) },
    select: { id: true, name: true },
  });

  const conflict = classes.find((c) => {
    if (excludeClassId && String(c.id) === String(excludeClassId)) return false;
    return normalizeName(c.name) === normalized;
  });

  if (conflict) {
    const err = new Error("Class name already exists in this profile");
    err.status = 409;
    throw err;
  }
}

async function assertUniqueDiagramNameInProfile({ profileId, name, excludeDiagramId = null }) {
  const normalized = normalizeName(name);
  if (!normalized) return;

  const diagrams = await prisma.diagramProfile.findMany({
    where: { profileId: String(profileId) },
    select: { id: true, diagramName: true },
  });

  const conflict = diagrams.find((d) => {
    if (excludeDiagramId && String(d.id) === String(excludeDiagramId)) return false;
    return normalizeName(d.diagramName) === normalized;
  });

  if (conflict) {
    const err = new Error("Diagram name already exists in this profile");
    err.status = 409;
    throw err;
  }
}

async function assertUniqueAttributeNameInProfileClass({
  profileId,
  classId,
  name,
  excludeAttributeId = null,
}) {
  const normalized = normalizeAttrName(name);
  if (!normalized) return;

  const attrs = await prisma.attributeProfile.findMany({
    where: { profileId: String(profileId), classId: String(classId) },
    select: { id: true, name: true },
  });

  const conflict = attrs.find((a) => {
    if (excludeAttributeId && String(a.id) === String(excludeAttributeId)) return false;
    return normalizeAttrName(a.name) === normalized;
  });

  if (conflict) {
    const err = new Error("Attribute name already exists in this class");
    err.status = 409;
    throw err;
  }
}

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

const createPackageSchema = z
  .object({
    name: z.string().min(1),
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

const createClassSchema = z
  .object({
    name: z.string().min(1),
    stereotype: z.string().nullable().optional(),
    documentation: z.string().nullable().optional(),
    documentationRu: z.string().nullable().optional(),
    details: z.string().nullable().optional(),
    isAbstract: z.boolean().nullable().optional(),
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

const createAttributeSchema = z
  .object({
    name: z.string().min(1),
    dataTypeId: z.string().min(1),
    stereotype: z.string().nullable().optional(),
    multiplicity: z.string().nullable().optional(),
    documentation: z.string().nullable().optional(),
    documentationRu: z.string().nullable().optional(),
    details: z.string().nullable().optional(),
    initialValue: z.string().nullable().optional(),
  })
  .passthrough();

const createDiagramSchema = z
  .object({
    diagramType: z.string().nullable().optional(),
    diagramName: z.string().min(1),
    documentation: z.string().nullable().optional(),
    details: z.string().nullable().optional(),
    diagramBody: z.string().nullable().optional(),
  })
  .passthrough();

const updateDiagramSchema = createDiagramSchema.partial();

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

    // Validate unique subpackage name under same parent (if name is being changed)
    if (data.name !== undefined) {
      const trimmed = String(data.name ?? "").trim();
      if (!trimmed) return sendError(res, 400, "Package name is required");

      const existingPkg = await prisma.packageProfile.findUnique({
        where: { id: packageId },
        select: { id: true, parentId: true },
      });

      if (existingPkg?.parentId) {
        try {
          await assertUniqueSubpackageNameInProfile({
            profileId,
            parentId: existingPkg.parentId,
            name: trimmed,
            excludePackageId: packageId,
          });
        } catch (e) {
          if (e?.status === 409) return sendError(res, 409, e.message);
          throw e;
        }
      }
    }

    await prisma.packageProfile.update({
      where: { id: packageId },
      data,
    });

    const project = await exportProject(profile.projectId);
    if (!project) return sendError(res, 404, "Project not found");
    res.json(project);
  })
);

/**
 * Delete a package from a profile graph and return a full exported Project.
 *
 * Request:
 * - Path params: :profileId, :packageId
 */
profilesRouter.delete(
  "/:profileId/packages/:packageId",
  asyncHandler(async (req, res) => {
    const profileId = String(req.params.profileId);
    const packageId = String(req.params.packageId);

    try {
      const project = await deleteProfilePackageAndExportProject({ profileId, packageId });
      res.json(project);
    } catch (e) {
      const status = Number(e?.status || 500);
      const msg = e?.message ? String(e.message) : "Failed to delete package";
      return sendError(res, status, msg);
    }
  })
);

// Create a nested package inside a profile package.
// Returns full updated project (export payload).
profilesRouter.post(
  "/:profileId/packages/:parentPackageId/subpackages",
  asyncHandler(async (req, res) => {
    const profileId = String(req.params.profileId);
    const parentPackageId = String(req.params.parentPackageId);

    const parsed = createPackageSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "Invalid package create", parsed.error.flatten());
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, projectId: true },
    });
    if (!profile) return sendError(res, 404, "Profile not found");

    const parent = await prisma.packageProfile.findFirst({
      where: { id: parentPackageId, profileId },
      select: { id: true },
    });
    if (!parent) return sendError(res, 404, "Package not found");

    const name = String(parsed.data.name ?? "").trim();
    if (!name) return sendError(res, 400, "Package name is required");

    try {
      await assertUniqueSubpackageNameInProfile({
        profileId,
        parentId: parentPackageId,
        name,
      });
    } catch (e) {
      if (e?.status === 409) return sendError(res, 409, e.message);
      throw e;
    }

    await prisma.packageProfile.create({
      data: {
        id: newId("pkg"),
        srcId: null,
        profileId,
        parentId: parentPackageId,
        name,
        type: null,
        parentPackage: null,
        documentation: parsed.data.documentation ?? null,
        documentationRu: parsed.data.documentationRu ?? null,
        details: parsed.data.details ?? null,
      },
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

    // Validate profile-wide unique class name (if name is being changed)
    if (parsed.data.name !== undefined) {
      const trimmed = String(parsed.data.name ?? "").trim();
      if (!trimmed) return sendError(res, 400, "Class name is required");
      try {
        await assertUniqueClassNameInProfile({
          profileId,
          name: trimmed,
          excludeClassId: classId,
        });
      } catch (e) {
        if (e?.status === 409) return sendError(res, 409, e.message);
        throw e;
      }
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

/**
 * Delete a class from a profile graph and return a full exported Project.
 *
 * Request:
 * - Path params: :profileId, :classId
 */
profilesRouter.delete(
  "/:profileId/classes/:classId",
  asyncHandler(async (req, res) => {
    const profileId = String(req.params.profileId);
    const classId = String(req.params.classId);

    try {
      const project = await deleteProfileClassAndExportProject({ profileId, classId });
      res.json(project);
    } catch (e) {
      const status = Number(e?.status || 500);
      const msg = e?.message ? String(e.message) : "Failed to delete class";
      return sendError(res, status, msg);
    }
  })
);

// Create a class inside a profile package.
// Returns full updated project (export payload).
profilesRouter.post(
  "/:profileId/packages/:packageId/classes",
  asyncHandler(async (req, res) => {
    const profileId = String(req.params.profileId);
    const packageId = String(req.params.packageId);

    const parsed = createClassSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "Invalid class create", parsed.error.flatten());
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, projectId: true },
    });
    if (!profile) return sendError(res, 404, "Profile not found");

    const pkg = await prisma.packageProfile.findFirst({
      where: { id: packageId, profileId },
      select: { id: true },
    });
    if (!pkg) return sendError(res, 404, "Package not found");

    const name = String(parsed.data.name ?? "").trim();
    if (!name) return sendError(res, 400, "Class name is required");

    try {
      await assertUniqueClassNameInProfile({ profileId, name });
    } catch (e) {
      if (e?.status === 409) return sendError(res, 409, e.message);
      throw e;
    }

    await prisma.classProfile.create({
      data: {
        id: newId("cls"),
        srcId: null,
        profileId,
        packageId,
        name,
        type: null,
        stereotype: parsed.data.stereotype ?? null,
        documentation: parsed.data.documentation ?? null,
        documentationRu: parsed.data.documentationRu ?? null,
        details: parsed.data.details ?? null,
        isAbstract: parsed.data.isAbstract ?? null,
        refModelId: null,
        refModelItemId: null,
      },
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
      select: { id: true, profileId: true, classId: true },
    });
    if (!existing) return sendError(res, 404, "Attribute not found");

    // Validate unique attribute name inside the same class (if name is being changed)
    if (parsed.data.name !== undefined) {
      const trimmed = String(parsed.data.name ?? "").trim();
      if (!trimmed) return sendError(res, 400, "Attribute name is required");

      try {
        await assertUniqueAttributeNameInProfileClass({
          profileId,
          classId: existing.classId,
          name: trimmed,
          excludeAttributeId: attributeId,
        });
      } catch (e) {
        if (e?.status === 409) return sendError(res, 409, e.message);
        throw e;
      }
    }

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

/**
 * Delete an attribute from a profile graph and return a full exported Project.
 *
 * Request:
 * - Path params: :profileId, :attributeId
 */
profilesRouter.delete(
  "/:profileId/attributes/:attributeId",
  asyncHandler(async (req, res) => {
    const profileId = String(req.params.profileId);
    const attributeId = String(req.params.attributeId);

    try {
      const project = await deleteProfileAttributeAndExportProject({ profileId, attributeId });
      res.json(project);
    } catch (e) {
      const status = Number(e?.status || 500);
      const msg = e?.message ? String(e.message) : "Failed to delete attribute";
      return sendError(res, status, msg);
    }
  })
);

// Create an attribute inside a profile class.
// Returns full updated project (export payload).
profilesRouter.post(
  "/:profileId/classes/:classId/attributes",
  asyncHandler(async (req, res) => {
    const profileId = String(req.params.profileId);
    const classId = String(req.params.classId);

    const parsed = createAttributeSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "Invalid attribute create", parsed.error.flatten());
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, projectId: true },
    });
    if (!profile) return sendError(res, 404, "Profile not found");

    const cls = await prisma.classProfile.findFirst({
      where: { id: classId, profileId },
      select: { id: true },
    });
    if (!cls) return sendError(res, 404, "Class not found");

    const normalizedName = String(parsed.data.name ?? "").trim();
    if (!normalizedName) return sendError(res, 400, "Attribute name is required");

    try {
      await assertUniqueAttributeNameInProfileClass({
        profileId,
        classId,
        name: normalizedName,
      });
    } catch (e) {
      if (e?.status === 409) return sendError(res, 409, e.message);
      throw e;
    }

    const normalizedDataTypeId = String(parsed.data.dataTypeId).trim();
    if (!normalizedDataTypeId) return sendError(res, 400, "dataTypeId is required");

    const existsType = await prisma.classProfile.findFirst({
      where: { id: normalizedDataTypeId, profileId },
      select: { id: true },
    });
    if (!existsType)
      return sendError(res, 400, "Invalid dataTypeId (class not found in profile)");

    await prisma.attributeProfile.create({
      data: {
        id: newId("attr"),
        srcId: null,
        profileId,
        classId,
        name: normalizedName,
        dataTypeId: normalizedDataTypeId,
        stereotype: parsed.data.stereotype ?? null,
        multiplicity: parsed.data.multiplicity ?? null,
        documentation: parsed.data.documentation ?? null,
        documentationRu: parsed.data.documentationRu ?? null,
        details: parsed.data.details ?? null,
        initialValue: parsed.data.initialValue ?? null,
        refModelId: null,
        refModelItemId: null,
      },
    });

    const project = await exportProject(profile.projectId);
    if (!project) return sendError(res, 404, "Project not found");
    res.json(project);
  })
);

// Create a diagram inside a profile package.
// Returns full updated project (export payload).
profilesRouter.post(
  "/:profileId/packages/:packageId/diagrams",
  asyncHandler(async (req, res) => {
    const profileId = String(req.params.profileId);
    const packageId = String(req.params.packageId);

    const parsed = createDiagramSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "Invalid diagram create", parsed.error.flatten());
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, projectId: true },
    });
    if (!profile) return sendError(res, 404, "Profile not found");

    const pkg = await prisma.packageProfile.findFirst({
      where: { id: packageId, profileId },
      select: { id: true },
    });
    if (!pkg) return sendError(res, 404, "Package not found");

    const diagramName = String(parsed.data.diagramName ?? "").trim();
    if (!diagramName) return sendError(res, 400, "diagramName is required");

    try {
      await assertUniqueDiagramNameInProfile({ profileId, name: diagramName });
    } catch (e) {
      if (e?.status === 409) return sendError(res, 409, e.message);
      throw e;
    }

    await prisma.diagramProfile.create({
      data: {
        id: newId("dia"),
        srcId: null,
        profileId,
        packageId,
        diagramType: parsed.data.diagramType ?? null,
        diagramName,
        documentation: parsed.data.documentation ?? null,
        details: parsed.data.details ?? null,
        diagramBody: parsed.data.diagramBody ?? null,
      },
    });

    const project = await exportProject(profile.projectId);
    if (!project) return sendError(res, 404, "Project not found");
    res.json(project);
  })
);

// Update a diagram inside a profile graph.
// Returns full updated project (export payload).
profilesRouter.put(
  "/:profileId/diagrams/:diagramId",
  asyncHandler(async (req, res) => {
    const profileId = String(req.params.profileId);
    const diagramId = String(req.params.diagramId);

    const parsed = updateDiagramSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "Invalid diagram update", parsed.error.flatten());
    }

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, projectId: true },
    });
    if (!profile) return sendError(res, 404, "Profile not found");

    const existing = await prisma.diagramProfile.findFirst({
      where: { id: diagramId, profileId },
      select: { id: true },
    });
    if (!existing) return sendError(res, 404, "Diagram not found");

    const allowed = {
      diagramType: parsed.data.diagramType,
      diagramName:
        parsed.data.diagramName === undefined
          ? undefined
          : String(parsed.data.diagramName ?? "").trim(),
      documentation: parsed.data.documentation,
      details: parsed.data.details,
      diagramBody: parsed.data.diagramBody,
    };

    if (allowed.diagramName !== undefined && !allowed.diagramName) {
      return sendError(res, 400, "diagramName is required");
    }

    if (allowed.diagramName !== undefined) {
      try {
        await assertUniqueDiagramNameInProfile({
          profileId,
          name: allowed.diagramName,
          excludeDiagramId: diagramId,
        });
      } catch (e) {
        if (e?.status === 409) return sendError(res, 409, e.message);
        throw e;
      }
    }

    const data = Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined));

    await prisma.diagramProfile.update({
      where: { id: diagramId },
      data,
    });

    const project = await exportProject(profile.projectId);
    if (!project) return sendError(res, 404, "Project not found");
    res.json(project);
  })
);

// Delete a diagram inside a profile graph.
// Returns full updated project (export payload).
profilesRouter.delete(
  "/:profileId/diagrams/:diagramId",
  asyncHandler(async (req, res) => {
    const profileId = String(req.params.profileId);
    const diagramId = String(req.params.diagramId);

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, projectId: true },
    });
    if (!profile) return sendError(res, 404, "Profile not found");

    const existing = await prisma.diagramProfile.findFirst({
      where: { id: diagramId, profileId },
      select: { id: true },
    });
    if (!existing) return sendError(res, 404, "Diagram not found");

    await prisma.diagramProfile.delete({ where: { id: diagramId } });

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
    const excludeRaw = req.query.excludeStereotypes ? String(req.query.excludeStereotypes) : "";
    const excludeStereotypes = excludeRaw
      ? excludeRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const includeTypesRaw = req.query.includeTypes ? String(req.query.includeTypes) : "";
    const includeTypes = includeTypesRaw
      ? includeTypesRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const excludeTypesRaw = req.query.excludeTypes ? String(req.query.excludeTypes) : "";
    const excludeTypes = excludeTypesRaw
      ? excludeTypesRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true },
    });
    if (!profile) return sendError(res, 404, "Profile not found");

    const baseTypes = includeTypes.length ? includeTypes : ["Class", "Enumeration"];

    const where = {
      profileId,
      OR: [{ type: null }, { type: { in: baseTypes } }],
    };

    if (excludeStereotypes.length) {
      // Include rows with NULL stereotype, and exclude explicit values.
      where.AND = [
        {
          OR: [{ stereotype: null }, { stereotype: { notIn: excludeStereotypes } }],
        },
      ];
    }

    if (excludeTypes.length) {
      where.AND = Array.isArray(where.AND) ? where.AND : [];
      where.AND.push({ OR: [{ type: null }, { type: { notIn: excludeTypes } }] });
    }

    const items = await prisma.classProfile.findMany({
      where,
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
