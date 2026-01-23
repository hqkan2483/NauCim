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
    orderBy: {name: "asc" },
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
    orderBy: { name: "asc" },
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

  const [packages, classNameById, generalizationsList, associationList] = await Promise.all([
    isModel ? exportPackagesTreeModel(id) : exportPackagesTreeProfile(id),
    isModel
      ? prisma.classModel
          .findMany({ where: { modelId: id }, select: { id: true, name: true } })
          .then((rows) => new Map((rows || []).map((c) => [String(c.id), String(c.name ?? "")])))
      : prisma.classProfile
          .findMany({ where: { profileId: id }, select: { id: true, name: true } })
          .then((rows) => new Map((rows || []).map((c) => [String(c.id), String(c.name ?? "")])))
          .catch(() => new Map()),
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
        parent: mapGeneralizationEnd(g.ends, "parent", classNameById),
        child: mapGeneralizationEnd(g.ends, "child", classNameById),
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
          linkEndClassName: classNameById.get(String(e.linkEndClassId)) ?? "",
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

function mapGeneralizationEnd(ends, role, classNameById) {
  const e = Array.isArray(ends) ? ends.find((x) => x?.role === role) : null;
  const classId = e?.classId ?? null;
  const nameFromClass =
    classId && classNameById && typeof classNameById.get === "function" ? classNameById.get(String(classId)) : null;
  return {
    classId,
    className: nameFromClass ?? "",
  };
}

function sortClassLinks(list) {
  const arr = Array.isArray(list) ? [...list] : [];
  arr.sort((a, b) => {
    const aRole = String(a?.role ?? "");
    const bRole = String(b?.role ?? "");
    const roleCmp = aRole.localeCompare(bRole, undefined, { sensitivity: "base" });
    if (roleCmp !== 0) return roleCmp;

    const aName = String(a?.targetClassName ?? "");
    const bName = String(b?.targetClassName ?? "");
    return aName.localeCompare(bName, undefined, { sensitivity: "base" });
  });
  return arr;
}

async function exportPackagesTreeModel(modelId) {
  const [packages, classes, attributes, literals, diagrams, generalizationLinks, associationLinks] = await Promise.all([
    prisma.packageModel.findMany({
      where: { modelId },
      select: {
        id: true,
        parentId: true,
        name: true,
        type: true,
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
        dataTypeId: true,
        stereotype: true,
        multiplicity: true,
        documentation: true,
        documentationRu: true,
        details: true,
        initialValue: true,
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
    prisma.diagramModel.findMany({
      where: { modelId },
      select: {
        id: true,
        packageId: true,
        diagramType: true,
        diagramName: true,
        documentation: true,
        details: true,
        diagramBody: true,
      },
    }),
    prisma.generalizationLinkModel.findMany({
      where: { modelId },
      select: {
        id: true,
        linkType: true,
        documentation: true,
        documentationRu: true,
        details: true,
        ends: {
          select: {
            role: true,
            classId: true,
          },
        },
      },
    }),
    prisma.associationLinkModel.findMany({
      where: { modelId },
      select: {
        id: true,
        linkType: true,
        linkEnd: {
          select: {
            linkEndName: true,
            linkEndClassId: true,
            multiplicity: true,
            documentation: true,
            documentationRu: true,
            details: true,
          },
        },
      },
    }),
  ]);

  const classesByPackage = new Map();
  for (const c of classes) {
    const list = classesByPackage.get(c.packageId) || [];
    list.push(c);
    classesByPackage.set(c.packageId, list);
  }

  const classNameById = new Map();
  for (const c of classes) {
    classNameById.set(c.id, c.name);
  }

  const generalizationLinksByClassId = new Map();
  for (const g of generalizationLinks) {
    const ends = Array.isArray(g?.ends) ? g.ends : [];
    for (const e of ends) {
      if (!e?.classId) continue;
      const other = ends.find((x) => x?.classId && x.classId !== e.classId) || null;
      if (!other?.classId) continue;

      const list = generalizationLinksByClassId.get(e.classId) || [];
      list.push({
        linkId: g.id,
        relationKind: g.linkType,
        role: e.role,
        targetClassId: other.classId,
        targetClassName: classNameById.get(other.classId) ?? "",
        targetClassRoleName: null,
        srcClassRoleName: null,
        targetDescription: g.documentation ?? null,
        targetDocumentationRu: g.documentationRu ?? null,
        targetDetails: g.details ?? null,
        multiplicity: "1",
      });
      generalizationLinksByClassId.set(e.classId, list);
    }
  }

  const associationLinksByClassId = new Map();
  for (const a of associationLinks) {
    const ends = Array.isArray(a?.linkEnd) ? a.linkEnd : [];
    for (const e of ends) {
      const srcClassId = e?.linkEndClassId;
      if (!srcClassId) continue;

      const other = ends.find((x) => x?.linkEndClassId && x.linkEndClassId !== srcClassId) || null;
      if (!other?.linkEndClassId) continue;

      const list = associationLinksByClassId.get(srcClassId) || [];
      list.push({
        linkId: a.id,
        relationKind: a.linkType,
        role: "unspecified",
        targetClassId: other.linkEndClassId,
        targetClassName: classNameById.get(other.linkEndClassId) ?? "",
        targetClassRoleName: other.linkEndName ?? null,
        srcClassRoleName: e.linkEndName ?? null,
        targetDescription: other.documentation ?? null,
        targetDocumentationRu: other.documentationRu ?? null,
        targetDetails: other.details ?? null,
        multiplicity: other.multiplicity ?? null,
      });
      associationLinksByClassId.set(srcClassId, list);
    }
  }

  const attrsByClass = groupBy(attributes, (a) => a.classId);
  const litsByClass = groupBy(literals, (l) => l.classId);
  const diagramsByPackage = groupBy(diagrams, (d) => d.packageId);

  const nodesById = new Map();
  for (const p of packages) {
    nodesById.set(p.id, {
      id: p.id,
      name: p.name,
      type: p.type ?? "Package",
      parentPackageId: p.parentId ?? null,
      documentation: p.documentation ?? null,
      documentationRu: p.documentationRu ?? null,
      details: p.details ?? null,
      modelId,
      profileId: null,
      diagrams: [],
      classes: [],
      subPackages: [],
    });
  }

  for (const [packageId, list] of diagramsByPackage.entries()) {
    const pkgNode = nodesById.get(packageId);
    if (!pkgNode) continue;
    pkgNode.diagrams = list.map(mapDiagram);
  }

  for (const [packageId, clsList] of classesByPackage.entries()) {
    const pkgNode = nodesById.get(packageId);
    if (!pkgNode) continue;

    pkgNode.classes = clsList.map((c) => ({
      id: c.id,
      // `packageId` is part of the canonical export contract; it matches Prisma ClassModel/ClassProfile.packageId.
      // UI uses it to determine parent package context without tree traversal.
      packageId: c.packageId ?? null,
      name: c.name,
      type: c.type ?? "Class",
      stereotype: c.stereotype ?? null,
      documentation: c.documentation ?? null,
      documentationRu: c.documentationRu ?? null,
      details: c.details ?? null,
      isAbstract: c.isAbstract ?? null,
      attributes: (attrsByClass.get(c.id) || []).map((a) => ({
        ...mapAttr(a, { classNameById }),
        modelId,
        profileId: null,
      })),
      links: sortClassLinks([
        ...(generalizationLinksByClassId.get(c.id) || []),
        ...(associationLinksByClassId.get(c.id) || []),
      ]),
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
  const [packages, classes, attributes, literals, diagrams, generalizationLinks, associationLinks] = await Promise.all([
    prisma.packageProfile.findMany({
      where: { profileId },
      select: {
        id: true,
        parentId: true,
        name: true,
        type: true,
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
        dataTypeId: true,
        stereotype: true,
        multiplicity: true,
        documentation: true,
        documentationRu: true,
        details: true,
        initialValue: true,
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
    prisma.diagramProfile.findMany({
      where: { profileId },
      select: {
        id: true,
        packageId: true,
        diagramType: true,
        diagramName: true,
        documentation: true,
        details: true,
        diagramBody: true,
      },
    }),
    prisma.generalizationLinkProfile.findMany({
      where: { profileId },
      select: {
        id: true,
        linkType: true,
        documentation: true,
        documentationRu: true,
        details: true,
        ends: {
          select: {
            role: true,
            classId: true,
          },
        },
      },
    }),
    prisma.associationLinkProfile.findMany({
      where: { profileId },
      select: {
        id: true,
        linkType: true,
        linkEnd: {
          select: {
            linkEndName: true,
            linkEndClassId: true,
            multiplicity: true,
            documentation: true,
            documentationRu: true,
            details: true,
          },
        },
      },
    }),
  ]);

  const classesByPackage = new Map();
  for (const c of classes) {
    const list = classesByPackage.get(c.packageId) || [];
    list.push(c);
    classesByPackage.set(c.packageId, list);
  }

  const classNameById = new Map();
  for (const c of classes) {
    classNameById.set(c.id, c.name);
  }

  const generalizationLinksByClassId = new Map();
  for (const g of generalizationLinks) {
    const ends = Array.isArray(g?.ends) ? g.ends : [];
    for (const e of ends) {
      if (!e?.classId) continue;
      const other = ends.find((x) => x?.classId && x.classId !== e.classId) || null;
      if (!other?.classId) continue;

      const list = generalizationLinksByClassId.get(e.classId) || [];
      list.push({
        linkId: g.id,
        relationKind: g.linkType,
        role: e.role,
        targetClassId: other.classId,
        targetClassName: classNameById.get(other.classId) ?? "",
        targetClassRoleName: null,
        srcClassRoleName: null,
        targetDescription: g.documentation ?? null,
        targetDocumentationRu: g.documentationRu ?? null,
        targetDetails: g.details ?? null,
        multiplicity: "1",
      });
      generalizationLinksByClassId.set(e.classId, list);
    }
  }

  const associationLinksByClassId = new Map();
  for (const a of associationLinks) {
    const ends = Array.isArray(a?.linkEnd) ? a.linkEnd : [];
    for (const e of ends) {
      const srcClassId = e?.linkEndClassId;
      if (!srcClassId) continue;

      const other = ends.find((x) => x?.linkEndClassId && x.linkEndClassId !== srcClassId) || null;
      if (!other?.linkEndClassId) continue;

      const list = associationLinksByClassId.get(srcClassId) || [];
      list.push({
        linkId: a.id,
        relationKind: a.linkType,
        role: "unspecified",
        targetClassId: other.linkEndClassId,
        targetClassName: classNameById.get(other.linkEndClassId) ?? "",
        targetClassRoleName: other.linkEndName ?? null,
        srcClassRoleName: e.linkEndName ?? null,
        targetDescription: other.documentation ?? null,
        targetDocumentationRu: other.documentationRu ?? null,
        targetDetails: other.details ?? null,
        multiplicity: other.multiplicity ?? null,
      });
      associationLinksByClassId.set(srcClassId, list);
    }
  }

  const attrsByClass = groupBy(attributes, (a) => a.classId);
  const litsByClass = groupBy(literals, (l) => l.classId);
  const diagramsByPackage = groupBy(diagrams, (d) => d.packageId);

  const nodesById = new Map();
  for (const p of packages) {
    nodesById.set(p.id, {
      id: p.id,
      name: p.name,
      type: p.type ?? "Package",
      parentPackageId: p.parentId ?? null,
      documentation: p.documentation ?? null,
      documentationRu: p.documentationRu ?? null,
      details: p.details ?? null,
      modelId: null,
      profileId,
      diagrams: [],
      classes: [],
      subPackages: [],
    });
  }

  for (const [packageId, list] of diagramsByPackage.entries()) {
    const pkgNode = nodesById.get(packageId);
    if (!pkgNode) continue;
    pkgNode.diagrams = list.map(mapDiagram);
  }

  for (const [packageId, clsList] of classesByPackage.entries()) {
    const pkgNode = nodesById.get(packageId);
    if (!pkgNode) continue;

    pkgNode.classes = clsList.map((c) => ({
      id: c.id,
      packageId: c.packageId ?? null,
      name: c.name,
      type: c.type ?? "Class",
      stereotype: c.stereotype ?? null,
      documentation: c.documentation ?? null,
      documentationRu: c.documentationRu ?? null,
      details: c.details ?? null,
      isAbstract: c.isAbstract ?? null,
      attributes: (attrsByClass.get(c.id) || []).map((a) => ({
        ...mapAttr(a, { classNameById }),
        modelId: null,
        profileId,
      })),
      links: sortClassLinks([
        ...(generalizationLinksByClassId.get(c.id) || []),
        ...(associationLinksByClassId.get(c.id) || []),
      ]),
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

function mapAttr(a, { classNameById = null } = {}) {
  const dataTypeId = a?.dataTypeId ?? null;
  const dataType = dataTypeId && classNameById ? classNameById.get(dataTypeId) || "" : "";

  return {
    id: a.id,
    // `classId` is part of the canonical export contract for Attribute; it matches Prisma AttributeModel/AttributeProfile.classId.
    // UI uses it to identify the parent class without traversing the exported tree.
    classId: a.classId,
    name: a.name,
    dataType,
    dataTypeId,
    stereotype: a.stereotype ?? "",
    multiplicity: a.multiplicity ?? null,
    documentation: a.documentation ?? null,
    documentationRu: a.documentationRu ?? null,
    details: a.details ?? null,
    initialValue: a.initialValue ?? "",
    modelId: a.modelId ?? null,
    profileId: a.profileId ?? null,
    refModelId: a.refModelId ?? null,
    refModelItemId: a.refModelItemId ?? null,
  };
}

function mapLiteral(lit) {
  return {
    id: lit.id,
    // `classId` is part of the canonical export contract for Literal; it matches Prisma LiteralModel/LiteralProfile.classId.
    // UI uses it to identify the parent class without traversing the exported tree.
    classId: lit.classId,
    name: lit.name,
    initialValue: lit.value ?? null,
    documentation: lit.documentation ?? null,
    documentationRu: lit.documentationRu ?? null,
  };
}

function mapDiagram(d) {
  return {
    id: d.id,
    // `packageId` is part of the canonical export contract; it allows UI to locate the parent package
    // without tree traversal. Source of truth: DiagramModel/DiagramProfile.packageId in Prisma.
    packageId: d.packageId ?? null,
    diagramType: d.diagramType ?? "",
    diagramName: d.diagramName ?? "",
    documentation: d.documentation ?? null,
    details: d.details ?? null,
    diagramBody: d.diagramBody ?? null,
  };
}
