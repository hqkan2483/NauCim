import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "../db.js";
import { exportProject } from "./export-project.js";
import {
  clearModelGraph,
  clearProfileGraph,
  importModelGraph,
  importProfileGraph,
  isRootPackageLike,
} from "./import-root-package-graph.js";

function normalizeRootPackages(payload) {
  if (payload === null || payload === undefined) return null;

  // Accept:
  // - rootPackage object
  // - rootPackages array
  // - file JSON that is rootPackages array (common for models-data/*.json)
  if (Array.isArray(payload)) {
    const list = payload.filter(Boolean);
    // New contract: exactly one rootPackage per import
    if (list.length !== 1) return null;
    if (!list.every(isRootPackageLike)) return null;
    return list;
  }

  if (isRootPackageLike(payload)) return [payload];

  return null;
}

async function readJsonFromPath(filePath) {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("Path is required");
  }

  const p = filePath.trim();
  if (!p) throw new Error("Path is required");

  // Basic sanity: must be a .json file
  if (path.extname(p).toLowerCase() !== ".json") {
    throw new Error("File must be a .json");
  }

  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw);
}

function newId(prefix) {
  return `${prefix}_${randomUUID()}`;
}

function buildIdMapsForRootPackage(rp) {
  const packageIdMap = new Map();
  const classIdMap = new Map();

  function walkPackage(pkg) {
    if (!pkg || typeof pkg !== "object") return;
    const oldPkgId = String(pkg.id);
    if (!packageIdMap.has(oldPkgId)) packageIdMap.set(oldPkgId, newId("pkg"));

    const classes = Array.isArray(pkg.classes) ? pkg.classes : [];
    for (const cls of classes) {
      if (!cls || typeof cls !== "object") continue;
      const oldClassId = String(cls.id);
      if (!classIdMap.has(oldClassId)) classIdMap.set(oldClassId, newId("cls"));
    }

    const subPackages = Array.isArray(pkg.subPackages) ? pkg.subPackages : [];
    for (const sp of subPackages) {
      walkPackage(sp);
    }
  }

  const topPackages = Array.isArray(rp?.packages) ? rp.packages : [];
  for (const pkg of topPackages) walkPackage(pkg);

  return { packageIdMap, classIdMap };
}

function remapRootPackageGraph(rp, { targetModelId = null, targetProfileId = null }) {
  const maps = buildIdMapsForRootPackage(rp);
  const { packageIdMap, classIdMap } = maps;

  const remapClassId = (id) => {
    if (id === undefined || id === null) return null;
    const key = String(id);
    return classIdMap.get(key) ?? key;
  };

  function remapPackage(pkg) {
    const newPkgId = packageIdMap.get(String(pkg.id)) ?? newId("pkg");

    const remappedClasses = (Array.isArray(pkg.classes) ? pkg.classes : []).map((cls) => {
      const newClassId = classIdMap.get(String(cls.id)) ?? newId("cls");

      const remappedAttributes = (Array.isArray(cls.attributes) ? cls.attributes : []).map((a) => ({
        ...a,
        id: newId("attr"),
        modelId: targetModelId ?? null,
        profileId: targetProfileId ?? null,
      }));

      const remappedLinks = (Array.isArray(cls.links) ? cls.links : []).map((l) => ({
        ...l,
        id: newId("link"),
        sourceClassId: l?.sourceClassId ? remapClassId(l.sourceClassId) : l?.sourceClassId ?? null,
        targetClassId: l?.targetClassId ? remapClassId(l.targetClassId) : l?.targetClassId ?? null,
        modelId: targetModelId ?? null,
        profileId: targetProfileId ?? null,
      }));

      const remappedLiterals = (Array.isArray(cls.literals) ? cls.literals : []).map((lit) => ({
        ...lit,
        id: newId("lit"),
        modelId: targetModelId ?? null,
        profileId: targetProfileId ?? null,
      }));

      return {
        ...cls,
        id: newClassId,
        modelId: targetModelId ?? null,
        profileId: targetProfileId ?? null,
        attributes: remappedAttributes,
        links: remappedLinks,
        literals: remappedLiterals,
      };
    });

    const remappedSubPackages = (Array.isArray(pkg.subPackages) ? pkg.subPackages : []).map(remapPackage);

    return {
      ...pkg,
      id: newPkgId,
      modelId: targetModelId ?? null,
      profileId: targetProfileId ?? null,
      classes: remappedClasses,
      subPackages: remappedSubPackages,
    };
  }

  const remappedGeneralizationsList = (Array.isArray(rp?.generalizationsList) ? rp.generalizationsList : []).map((g) => ({
    ...g,
    linkId: newId("gen"),
    parent: g?.parent
      ? { ...g.parent, classId: g.parent.classId ? remapClassId(g.parent.classId) : g.parent.classId ?? null }
      : g?.parent ?? null,
    child: g?.child
      ? { ...g.child, classId: g.child.classId ? remapClassId(g.child.classId) : g.child.classId ?? null }
      : g?.child ?? null,
  }));

  const remappedAssociationList = (Array.isArray(rp?.associationList) ? rp.associationList : []).map((a) => ({
    ...a,
    linkId: newId("assoc"),
    linkEnd: (Array.isArray(a?.linkEnd) ? a.linkEnd : []).map((e) => ({
      ...e,
      linkEndId: newId("end"),
      linkEndClassId: e?.linkEndClassId ? remapClassId(e.linkEndClassId) : e?.linkEndClassId ?? null,
    })),
  }));

  return {
    ...rp,
    generalizationsList: remappedGeneralizationsList,
    associationList: remappedAssociationList,
    packages: (Array.isArray(rp?.packages) ? rp.packages : []).map(remapPackage),
  };
}

export async function importModelRootPackages({ modelId, path: filePath = null, rootPackages = null }) {
  const id = String(modelId);

  const existingModel = await prisma.model.findUnique({
    where: { id },
    select: { id: true, projectId: true },
  });
  if (!existingModel) {
    const err = new Error("Model not found");
    err.status = 404;
    throw err;
  }

  let normalized = normalizeRootPackages(rootPackages);

  if (normalized === null && typeof filePath === "string") {
    const json = await readJsonFromPath(filePath);

    if (json && typeof json === "object" && !Array.isArray(json) && Array.isArray(json.rootPackages)) {
      normalized = normalizeRootPackages(json.rootPackages);
    } else {
      normalized = normalizeRootPackages(json);
    }
  }

  if (normalized === null) {
    const err = new Error(
      "Invalid import payload: expected exactly one rootPackage (or rootPackages array with a single item), or path to .json"
    );
    err.status = 400;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await clearModelGraph(tx, id);

    for (const rp of normalized) {
      const rpToImport = remapRootPackageGraph(rp, { targetModelId: id, targetProfileId: null });
      await importModelGraph(tx, id, rpToImport);
    }

    await tx.model.update({
      where: { id },
      data: { modifyDate: new Date().toISOString() },
    });
  });

  const project = await exportProject(existingModel.projectId);
  if (!project) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }

  return project;
}

export async function importProfileRootPackages({ profileId, path: filePath = null, rootPackages = null }) {
  const id = String(profileId);

  const existingProfile = await prisma.profile.findUnique({
    where: { id },
    select: { id: true, projectId: true },
  });
  if (!existingProfile) {
    const err = new Error("Profile not found");
    err.status = 404;
    throw err;
  }

  let normalized = normalizeRootPackages(rootPackages);

  if (normalized === null && typeof filePath === "string") {
    const json = await readJsonFromPath(filePath);
    if (json && typeof json === "object" && !Array.isArray(json) && Array.isArray(json.rootPackages)) {
      normalized = normalizeRootPackages(json.rootPackages);
    } else {
      normalized = normalizeRootPackages(json);
    }
  }

  if (normalized === null) {
    const err = new Error(
      "Invalid import payload: expected exactly one rootPackage (or rootPackages array with a single item), or path to .json"
    );
    err.status = 400;
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await clearProfileGraph(tx, id);

    for (const rp of normalized) {
      const rpToImport = remapRootPackageGraph(rp, { targetModelId: null, targetProfileId: id });
      await importProfileGraph(tx, id, rpToImport);
    }

    await tx.profile.update({
      where: { id },
      data: { modifyDate: new Date().toISOString() },
    });
  });

  const project = await exportProject(existingProfile.projectId);
  if (!project) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }

  return project;
}
