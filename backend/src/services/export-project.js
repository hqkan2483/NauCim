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
  if (!modelId && !profileId) return [];

  const isModel = Boolean(modelId);
  const id = String(isModel ? modelId : profileId);

  const [packages, generalizationsList, associationList] = await Promise.all([
    isModel ? exportPackagesTreeModel(id) : exportPackagesTreeProfile(id),
    isModel
      ? prisma.generalizationLinkModel.findMany({ where: { modelId: id }, include: { ends: true } })
      : prisma.generalizationLinkProfile.findMany({ where: { profileId: id }, include: { ends: true } }),
    isModel
      ? prisma.associationLinkModel.findMany({
          where: { modelId: id },
          include: { linkEnd: { orderBy: { linkEndId: "asc" } } },
        })
      : prisma.associationLinkProfile.findMany({
          where: { profileId: id },
          include: { linkEnd: { orderBy: { linkEndId: "asc" } } },
        }),
  ]);

  const hasAny =
    (Array.isArray(packages) && packages.length > 0) ||
    (Array.isArray(generalizationsList) && generalizationsList.length > 0) ||
    (Array.isArray(associationList) && associationList.length > 0);
  if (!hasAny) return [];

  return [
    {
      packages,
      generalizationsList: generalizationsList.map((g) => ({
        linkId: g.id,
        linkType: g.linkType,
        documentation: g.documentation ?? null,
        documentationRu: g.documentationRu ?? null,
        details: g.details ?? null,
        stereotype: g.stereotype ?? "",
        parent: mapGeneralizationEnd(g.ends, "parent"),
        child: mapGeneralizationEnd(g.ends, "child"),
      })),
      associationList: associationList.map((a) => ({
        linkId: a.id,
        linkType: a.linkType,
        documentation: a.documentation ?? null,
        documentationRu: a.documentationRu ?? null,
        details: a.details ?? null,
        stereotype: a.stereotype ?? "",
        linkEnd: (a.linkEnd || []).map((e) => ({
          linkEndId: e.linkEndId,
          linkEndName: e.linkEndName,
          linkEndClassId: e.linkEndClassId,
          linkEndClassName: e.linkEndClassName,
          multiplicity: e.multiplicity ?? null,
          documentation: e.documentation ?? null,
          documentationRu: e.documentationRu ?? null,
          details: e.details ?? null,
          stereotype: e.stereotype ?? "",
        })),
      })),
    },
  ];
}

function mapGeneralizationEnd(ends, role) {
  const e = Array.isArray(ends) ? ends.find((x) => x?.role === role) : null;
  return {
    classId: e?.classId ?? null,
    className: e?.className ?? "",
  };
}

async function exportPackagesTreeModel(modelId) {
  const [packages, classes, attributes, links, literals] = await Promise.all([
    prisma.packageModel.findMany({
      where: { modelId },
      select: {
        id: true,
        parentId: true,
        name: true,
        type: true,
        parentPackage: true,
        documentation: true,
        documentationRu: true,
        details: true,
      },
    }),
    prisma.classModel.findMany({
      where: { modelId },
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
        refModelId: true,
        refModelItemId: true,
      },
    }),
    prisma.attributeModel.findMany({
      where: { modelId },
      select: {
        id: true,
        classId: true,
        name: true,
        type: true,
        multiplicity: true,
        documentation: true,
        documentationRu: true,
        details: true,
        refModelId: true,
        refModelItemId: true,
      },
    }),
    prisma.linkModel.findMany({
      where: { modelId },
      select: {
        id: true,
        classId: true,
        name: true,
        type: true,
        multiplicity: true,
        documentation: true,
        documentationRu: true,
        details: true,
        refModelId: true,
        refModelItemId: true,
      },
    }),
    prisma.literalModel.findMany({
      where: { modelId },
      select: {
        id: true,
        classId: true,
        name: true,
        value: true,
        documentation: true,
        documentationRu: true,
      },
    }),
  ]);

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
      modelId,
      profileId: null,
      classes: [],
      subPackages: [],
    });
  }

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
      attributes: (attrsByClass.get(c.id) || []).map((a) => ({
        ...mapAttr(a),
        modelId,
        profileId: null,
      })),
      links: (linksByClass.get(c.id) || []).map((l) => ({
        ...mapLink(l),
        modelId,
        profileId: null,
      })),
      literals: (litsByClass.get(c.id) || []).map(mapLiteral),
      profileRelations: [],
      modelId,
      profileId: null,
      refModelId: c.refModelId ?? null,
      refModelItemId: c.refModelItemId ?? null,
    }));
  }

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

async function exportPackagesTreeProfile(profileId) {
  const [packages, classes, attributes, links, literals] = await Promise.all([
    prisma.packageProfile.findMany({
      where: { profileId },
      select: {
        id: true,
        parentId: true,
        name: true,
        type: true,
        parentPackage: true,
        documentation: true,
        documentationRu: true,
        details: true,
      },
    }),
    prisma.classProfile.findMany({
      where: { profileId },
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
        refModelId: true,
        refModelItemId: true,
      },
    }),
    prisma.attributeProfile.findMany({
      where: { profileId },
      select: {
        id: true,
        classId: true,
        name: true,
        type: true,
        multiplicity: true,
        documentation: true,
        documentationRu: true,
        details: true,
        refModelId: true,
        refModelItemId: true,
      },
    }),
    prisma.linkProfile.findMany({
      where: { profileId },
      select: {
        id: true,
        classId: true,
        name: true,
        type: true,
        multiplicity: true,
        documentation: true,
        documentationRu: true,
        details: true,
        refModelId: true,
        refModelItemId: true,
      },
    }),
    prisma.literalProfile.findMany({
      where: { profileId },
      select: {
        id: true,
        classId: true,
        name: true,
        value: true,
        documentation: true,
        documentationRu: true,
      },
    }),
  ]);

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
      modelId: null,
      profileId,
      classes: [],
      subPackages: [],
    });
  }

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
      attributes: (attrsByClass.get(c.id) || []).map((a) => ({
        ...mapAttr(a),
        modelId: null,
        profileId,
      })),
      links: (linksByClass.get(c.id) || []).map((l) => ({
        ...mapLink(l),
        modelId: null,
        profileId,
      })),
      literals: (litsByClass.get(c.id) || []).map(mapLiteral),
      profileRelations: [],
      modelId: null,
      profileId,
      refModelId: c.refModelId ?? null,
      refModelItemId: c.refModelItemId ?? null,
    }));
  }

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
