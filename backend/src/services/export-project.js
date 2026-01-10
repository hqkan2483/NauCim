import { prisma } from "../db.js";

export async function exportProject(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: String(projectId) },
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
  if (!project) return null;

  const models = await prisma.model.findMany({
    where: { projectId: String(projectId) },
    select: {
      id: true,
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
    orderBy: { modifyDate: "desc" },
  });

  const profiles = await prisma.profile.findMany({
    where: { projectId: String(projectId) },
    select: {
      id: true,
      name: true,
      description: true,
      version: true,
      createDate: true,
      modifyDate: true,
      legalState: true,
      legalAct: true,
      accessRights: true,
    },
    orderBy: { modifyDate: "desc" },
  });

  const exportedModels = [];
  for (const m of models) {
    const rootPackages = await exportRootPackagesFor({ modelId: m.id });
    exportedModels.push({
      ...m,
      relatedProfiles: [],
      rootPackages,
    });
  }

  const exportedProfiles = [];
  for (const p of profiles) {
    const rootPackages = await exportRootPackagesFor({ profileId: p.id });
    exportedProfiles.push({
      ...p,
      relatedModels: [],
      rootPackages,
    });
  }

  return {
    ...project,
    models: exportedModels,
    profiles: exportedProfiles,
  };
}

async function exportRootPackagesFor({ modelId = null, profileId = null }) {
  const where = modelId
    ? { modelId: String(modelId) }
    : { profileId: String(profileId) };

  const rootPackages = await prisma.rootPackage.findMany({
    where,
    select: { id: true },
  });

  const out = [];
  for (const rp of rootPackages) {
    const [packages, generalizationsList, associationList] = await Promise.all([
      exportPackagesTree(rp.id),
      prisma.generalizationLink.findMany({ where: { rootPackageId: rp.id } }),
      prisma.associationLink.findMany({ where: { rootPackageId: rp.id } }),
    ]);

    out.push({
      packages,
      generalizationsList: generalizationsList.map((g) => ({
        sourceId: g.sourceId,
        targetId: g.targetId,
      })),
      associationList: associationList.map((a) => ({
        sourceId: a.sourceId,
        targetId: a.targetId,
      })),
    });
  }

  return out;
}

async function exportPackagesTree(rootPackageId) {
  // Load all packages for rootPackage, then build adjacency tree in JS
  const packages = await prisma.package.findMany({
    where: { rootPackageId },
    select: {
      id: true,
      parentId: true,
      name: true,
      type: true,
      parentPackage: true,
      documentation: true,
      documentationRu: true,
      details: true,
      modelId: true,
      profileId: true,
    },
  });

  const classes = await prisma.class.findMany({
    where: {
      pkg: { rootPackageId },
    },
    select: {
      id: true,
      packageId: true,
      name: true,
      type: true,
      stereotype: true,
      documentation: true,
      documentationRu: true,
      details: true,
      isAbstract: true,
      modelId: true,
      profileId: true,
      refModelId: true,
      refModelItemId: true,
    },
  });

  const attributes = await prisma.attribute.findMany({
    where: {
      cls: { pkg: { rootPackageId } },
    },
  });

  const links = await prisma.link.findMany({
    where: {
      cls: { pkg: { rootPackageId } },
    },
  });

  const literals = await prisma.literal.findMany({
    where: {
      cls: { pkg: { rootPackageId } },
    },
  });

  const classesByPackage = new Map();
  for (const c of classes) {
    const list = classesByPackage.get(c.packageId) || [];
    list.push(c);
    classesByPackage.set(c.packageId, list);
  }

  const attrsByClass = groupBy(attributes, (a) => a.classId);
  const linksByClass = groupBy(links, (l) => l.classId);
  const litsByClass = groupBy(literals, (l) => l.classId);

  const nodesById = new Map();
  for (const p of packages) {
    nodesById.set(p.id, {
      id: p.id,
      name: p.name,
      type: p.type ?? "Package",
      parentPackage: p.parentPackage ?? null,
      documentation: p.documentation ?? null,
      documentationRu: p.documentationRu ?? null,
      details: p.details ?? null,
      modelId: p.modelId ?? null,
      profileId: p.profileId ?? null,
      classes: [],
      subPackages: [],
    });
  }

  // Fill classes
  for (const [packageId, clsList] of classesByPackage.entries()) {
    const pkgNode = nodesById.get(packageId);
    if (!pkgNode) continue;

    pkgNode.classes = clsList.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type ?? "Class",
      stereotype: c.stereotype ?? null,
      documentation: c.documentation ?? null,
      documentationRu: c.documentationRu ?? null,
      details: c.details ?? null,
      isAbstract: c.isAbstract ?? null,
      attributes: (attrsByClass.get(c.id) || []).map(mapAttr),
      links: (linksByClass.get(c.id) || []).map(mapLink),
      literals: (litsByClass.get(c.id) || []).map(mapLiteral),
      profileRelations: [],
      modelId: c.modelId ?? null,
      profileId: c.profileId ?? null,
      refModelId: c.refModelId ?? null,
      refModelItemId: c.refModelItemId ?? null,
    }));
  }

  // Build tree
  const top = [];
  for (const p of packages) {
    const node = nodesById.get(p.id);
    if (!node) continue;

    if (!p.parentId) {
      top.push(node);
      continue;
    }

    const parent = nodesById.get(p.parentId);
    if (parent) parent.subPackages.push(node);
    else top.push(node);
  }

  return top;
}

function groupBy(items, keyFn) {
  const m = new Map();
  for (const it of items) {
    const k = keyFn(it);
    const list = m.get(k) || [];
    list.push(it);
    m.set(k, list);
  }
  return m;
}

function mapAttr(a) {
  return {
    id: a.id,
    name: a.name,
    type: a.type ?? null,
    multiplicity: a.multiplicity ?? null,
    documentation: a.documentation ?? null,
    documentationRu: a.documentationRu ?? null,
    details: a.details ?? null,
    modelId: a.modelId ?? null,
    profileId: a.profileId ?? null,
    refModelId: a.refModelId ?? null,
    refModelItemId: a.refModelItemId ?? null,
  };
}

function mapLink(l) {
  return {
    id: l.id,
    name: l.name ?? null,
    type: l.type ?? null,
    multiplicity: l.multiplicity ?? null,
    documentation: l.documentation ?? null,
    documentationRu: l.documentationRu ?? null,
    details: l.details ?? null,
    modelId: l.modelId ?? null,
    profileId: l.profileId ?? null,
    refModelId: l.refModelId ?? null,
    refModelItemId: l.refModelItemId ?? null,
  };
}

function mapLiteral(lit) {
  return {
    id: lit.id,
    name: lit.name,
    value: lit.value ?? null,
    documentation: lit.documentation ?? null,
    documentationRu: lit.documentationRu ?? null,
  };
}
