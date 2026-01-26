import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { importProject } from "../src/services/import-project.js";

function isProjectLike(v) {
  return v && typeof v === "object" && typeof v.id === "string" && (Array.isArray(v.models) || Array.isArray(v.profiles));
}

function deriveIdFromFilename(filePath) {
  const base = path.basename(filePath).replace(/\.json$/i, "");
  return base.replace(/-model$/i, "").replace(/[^a-zA-Z0-9_-]+/g, "_");
}

function wrapModelDataAsProject(modelData, filePath) {
  const now = new Date().toISOString();
  const derived = deriveIdFromFilename(filePath);

  const rootPackages = modelData.map((rp) => ({
    packages: Array.isArray(rp?.packages) ? rp.packages : [],
    generalizationsList: Array.isArray(rp?.generalizationsList) ? rp.generalizationsList : [],
    associationList: Array.isArray(rp?.associationList) ? rp.associationList : [],
  }));

  // Minimal normalization to match backend importer expectations.
  // Note: link structures (generalizationsList/associationList) are empty unless present in the source.
  const normalizeAttribute = (a) => ({
    id: String(a?.id ?? `attr_${randomUUID()}`),
    name: String(a?.name ?? ""),
    type: a?.type ?? a?.dataType ?? null,
    multiplicity: a?.multiplicity ?? null,
    documentation: a?.documentation ?? null,
    documentationRu: a?.documentationRu ?? null,
    details: a?.details ?? null,
    modelId: a?.modelId ?? null,
    profileId: a?.profileId ?? null,
    refModelId: a?.refModelId ?? null,
    refModelItemId: a?.refModelItemId ?? null,
  });

  const normalizeClass = (c) => ({
    id: String(c?.id ?? `class_${randomUUID()}`),
    name: String(c?.name ?? ""),
    type: c?.type ?? "Class",
    stereotype: c?.stereotype ?? null,
    documentation: c?.documentation ?? null,
    documentationRu: c?.documentationRu ?? null,
    details: c?.details ?? null,
    isAbstract: c?.isAbstract ?? null,
    modelId: c?.modelId ?? null,
    profileId: c?.profileId ?? null,
    refModelId: c?.refModelId ?? null,
    refModelItemId: c?.refModelItemId ?? null,
    attributes: Array.isArray(c?.attributes) ? c.attributes.map(normalizeAttribute) : [],
    // The legacy per-class links in model-data files do NOT match backend Link table shape.
    // Keep empty here; prefer canonical association/generalization lists.
    links: [],
    literals: Array.isArray(c?.literals) ? c.literals : [],
  });

  const normalizePackageTree = (p) => ({
    id: String(p?.id ?? `pkg_${randomUUID()}`),
    name: String(p?.name ?? ""),
    type: p?.type ?? "Package",
    documentation: p?.documentation ?? null,
    documentationRu: p?.documentationRu ?? null,
    details: p?.details ?? null,
    modelId: p?.modelId ?? null,
    profileId: p?.profileId ?? null,
    classes: Array.isArray(p?.classes) ? p.classes.map(normalizeClass) : [],
    subPackages: Array.isArray(p?.subPackages) ? p.subPackages.map(normalizePackageTree) : [],
  });

  const normalizedRootPackages = rootPackages.map((rp) => ({
    ...rp,
    packages: rp.packages.map(normalizePackageTree),
  }));

  return {
    id: `project_${derived}`,
    name: `Imported ${derived}`,
    description: `Imported from ${path.basename(filePath)}`,
    version: "1.0",
    createDate: now,
    modifyDate: now,
    accessRights: "custom",
    models: [
      {
        id: derived || `model_${randomUUID()}`,
        projectId: `project_${derived}`,
        name: derived || "Imported model",
        description: null,
        type: "UML",
        version: "1.0",
        createDate: now,
        modifyDate: now,
        legalState: null,
        legalAct: null,
        accessRights: "custom",
        rootPackages: normalizedRootPackages,
      },
    ],
    profiles: [],
  };
}

async function main() {
  const filePathArg = process.argv[2];
  if (!filePathArg) {
    console.error("Usage: node scripts/import-json-file.js <path-to-json>");
    process.exit(1);
  }

  // Resolve relative paths from the current working directory.
  const absFilePath = path.isAbsolute(filePathArg) ? filePathArg : path.resolve(process.cwd(), filePathArg);

  const rawText = await fs.readFile(absFilePath, "utf8");
  const data = JSON.parse(rawText);

  const project = isProjectLike(data)
    ? data
    : Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === "object" && Array.isArray(data[0].packages)
      ? wrapModelDataAsProject(data, absFilePath)
      : null;

  if (!project) {
    console.error("Unsupported JSON shape. Provide a Project JSON (docs/DATA_STRUCTURES.md) or a *-model.json array with {packages:[...]} objects.");
    process.exit(2);
  }

  const result = await importProject(project);
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
