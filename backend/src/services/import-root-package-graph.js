import { randomUUID } from "node:crypto";

export function isRootPackageLike(rp) {
  return rp && typeof rp === "object" && Array.isArray(rp.packages);
}

function toStr(v) {
  if (v === undefined || v === null) return null;
  return String(v);
}

function toNonEmptyStr(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

export async function clearModelGraph(tx, modelId) {
  const id = String(modelId);
  await tx.associationLinkEndModel.deleteMany({ where: { modelId: id } });
  await tx.associationLinkModel.deleteMany({ where: { modelId: id } });
  await tx.generalizationClassRefModel.deleteMany({ where: { modelId: id } });
  await tx.generalizationLinkModel.deleteMany({ where: { modelId: id } });
  await tx.literalModel.deleteMany({ where: { modelId: id } });
  await tx.linkModel.deleteMany({ where: { modelId: id } });
  await tx.attributeModel.deleteMany({ where: { modelId: id } });
  await tx.classModel.deleteMany({ where: { modelId: id } });
  await tx.packageModel.deleteMany({ where: { modelId: id } });
}

export async function clearProfileGraph(tx, profileId) {
  const id = String(profileId);
  await tx.associationLinkEndProfile.deleteMany({ where: { profileId: id } });
  await tx.associationLinkProfile.deleteMany({ where: { profileId: id } });
  await tx.generalizationClassRefProfile.deleteMany({ where: { profileId: id } });
  await tx.generalizationLinkProfile.deleteMany({ where: { profileId: id } });
  await tx.literalProfile.deleteMany({ where: { profileId: id } });
  await tx.linkProfile.deleteMany({ where: { profileId: id } });
  await tx.attributeProfile.deleteMany({ where: { profileId: id } });
  await tx.classProfile.deleteMany({ where: { profileId: id } });
  await tx.packageProfile.deleteMany({ where: { profileId: id } });
}

export async function importModelGraph(tx, modelId, rp) {
  const id = String(modelId);

  const topPackages = Array.isArray(rp?.packages) ? rp.packages : [];
  for (const pkg of topPackages) {
    await importPackageTreeModel(tx, id, null, pkg);
  }

  await importLinksModel(tx, id, rp);
}

export async function importProfileGraph(tx, profileId, rp) {
  const id = String(profileId);

  const topPackages = Array.isArray(rp?.packages) ? rp.packages : [];
  for (const pkg of topPackages) {
    await importPackageTreeProfile(tx, id, null, pkg);
  }

  await importLinksProfile(tx, id, rp);
}

async function importLinksModel(tx, modelId, rp) {
  const gen = Array.isArray(rp?.generalizationsList) ? rp.generalizationsList : [];
  const assoc = Array.isArray(rp?.associationList) ? rp.associationList : [];

  for (const g of gen) {
    const linkId = toNonEmptyStr(g?.linkId) || `gen_${randomUUID()}`;

    const parentClassId = toNonEmptyStr(g?.parent?.classId);
    const parentClassName = toNonEmptyStr(g?.parent?.className) || "";
    const childClassId = toNonEmptyStr(g?.child?.classId);
    const childClassName = toNonEmptyStr(g?.child?.className) || "";

    if (!parentClassId || !childClassId) continue;

    await tx.generalizationLinkModel.create({
      data: {
        id: linkId,
        modelId,
        linkType: toNonEmptyStr(g?.linkType) || "Generalization",
        documentation: toStr(g?.documentation),
        documentationRu: toStr(g?.documentationRu),
        details: toStr(g?.details),
        stereotype: toNonEmptyStr(g?.stereotype) || "",
      },
    });

    await tx.generalizationClassRefModel.createMany({
      data: [
        {
          generalizationLinkId: linkId,
          modelId,
          role: "parent",
          classId: parentClassId,
          className: parentClassName,
        },
        {
          generalizationLinkId: linkId,
          modelId,
          role: "child",
          classId: childClassId,
          className: childClassName,
        },
      ],
    });
  }

  for (const a of assoc) {
    const linkId = toNonEmptyStr(a?.linkId) || `assoc_${randomUUID()}`;

    await tx.associationLinkModel.create({
      data: {
        id: linkId,
        modelId,
        linkType: toNonEmptyStr(a?.linkType) || "Association",
        documentation: toStr(a?.documentation),
        documentationRu: toStr(a?.documentationRu),
        details: toStr(a?.details),
        stereotype: toNonEmptyStr(a?.stereotype) || "",
      },
    });

    const linkEnd = Array.isArray(a?.linkEnd) ? a.linkEnd : [];
    for (const e of linkEnd) {
      const linkEndId = toNonEmptyStr(e?.linkEndId) || `end_${randomUUID()}`;
      const endClassId = toNonEmptyStr(e?.linkEndClassId);
      const endClassName = toNonEmptyStr(e?.linkEndClassName) || "";
      if (!endClassId) continue;

      await tx.associationLinkEndModel.create({
        data: {
          linkEndId,
          associationLinkId: linkId,
          modelId,
          linkEndName: String(e?.linkEndName || ""),
          linkEndClassId: endClassId,
          linkEndClassName: endClassName,
          multiplicity: toNonEmptyStr(e?.multiplicity) || "",
          documentation: toStr(e?.documentation),
          documentationRu: toStr(e?.documentationRu),
          details: toStr(e?.details),
          stereotype: toNonEmptyStr(e?.stereotype) || "",
        },
      });
    }
  }
}

async function importLinksProfile(tx, profileId, rp) {
  const gen = Array.isArray(rp?.generalizationsList) ? rp.generalizationsList : [];
  const assoc = Array.isArray(rp?.associationList) ? rp.associationList : [];

  for (const g of gen) {
    const linkId = toNonEmptyStr(g?.linkId) || `gen_${randomUUID()}`;

    const parentClassId = toNonEmptyStr(g?.parent?.classId);
    const parentClassName = toNonEmptyStr(g?.parent?.className) || "";
    const childClassId = toNonEmptyStr(g?.child?.classId);
    const childClassName = toNonEmptyStr(g?.child?.className) || "";

    if (!parentClassId || !childClassId) continue;

    await tx.generalizationLinkProfile.create({
      data: {
        id: linkId,
        profileId,
        linkType: toNonEmptyStr(g?.linkType) || "Generalization",
        documentation: toStr(g?.documentation),
        documentationRu: toStr(g?.documentationRu),
        details: toStr(g?.details),
        stereotype: toNonEmptyStr(g?.stereotype) || "",
      },
    });

    await tx.generalizationClassRefProfile.createMany({
      data: [
        {
          generalizationLinkId: linkId,
          profileId,
          role: "parent",
          classId: parentClassId,
          className: parentClassName,
        },
        {
          generalizationLinkId: linkId,
          profileId,
          role: "child",
          classId: childClassId,
          className: childClassName,
        },
      ],
    });
  }

  for (const a of assoc) {
    const linkId = toNonEmptyStr(a?.linkId) || `assoc_${randomUUID()}`;

    await tx.associationLinkProfile.create({
      data: {
        id: linkId,
        profileId,
        linkType: toNonEmptyStr(a?.linkType) || "Association",
        documentation: toStr(a?.documentation),
        documentationRu: toStr(a?.documentationRu),
        details: toStr(a?.details),
        stereotype: toNonEmptyStr(a?.stereotype) || "",
      },
    });

    const linkEnd = Array.isArray(a?.linkEnd) ? a.linkEnd : [];
    for (const e of linkEnd) {
      const linkEndId = toNonEmptyStr(e?.linkEndId) || `end_${randomUUID()}`;
      const endClassId = toNonEmptyStr(e?.linkEndClassId);
      const endClassName = toNonEmptyStr(e?.linkEndClassName) || "";
      if (!endClassId) continue;

      await tx.associationLinkEndProfile.create({
        data: {
          linkEndId,
          associationLinkId: linkId,
          profileId,
          linkEndName: String(e?.linkEndName || ""),
          linkEndClassId: endClassId,
          linkEndClassName: endClassName,
          multiplicity: toNonEmptyStr(e?.multiplicity) || "",
          documentation: toStr(e?.documentation),
          documentationRu: toStr(e?.documentationRu),
          details: toStr(e?.details),
          stereotype: toNonEmptyStr(e?.stereotype) || "",
        },
      });
    }
  }
}

async function importPackageTreeModel(tx, modelId, parentId, pkg) {
  const pkgId = toNonEmptyStr(pkg?.id) || `pkg_${randomUUID()}`;

  await tx.packageModel.create({
    data: {
      id: pkgId,
      modelId,
      parentId,
      name: String(pkg.name || ""),
      type: pkg.type ?? null,
      parentPackage: pkg.parentPackage ?? null,
      documentation: pkg.documentation ?? null,
      documentationRu: pkg.documentationRu ?? null,
      details: pkg.details ?? null,
    },
  });

  const classes = Array.isArray(pkg.classes) ? pkg.classes : [];
  for (const cls of classes) {
    const classId = toNonEmptyStr(cls?.id) || `cls_${randomUUID()}`;
    await tx.classModel.create({
      data: {
        id: classId,
        modelId,
        packageId: pkgId,
        name: String(cls.name || ""),
        type: cls.type ?? null,
        stereotype: cls.stereotype ?? null,
        documentation: cls.documentation ?? null,
        documentationRu: cls.documentationRu ?? null,
        details: cls.details ?? null,
        isAbstract: cls.isAbstract ?? null,
        refModelId: cls.refModelId ?? null,
        refModelItemId: cls.refModelItemId ?? null,
      },
    });

    const attributes = Array.isArray(cls.attributes) ? cls.attributes : [];
    for (const attr of attributes) {
      await tx.attributeModel.create({
        data: {
          id: toNonEmptyStr(attr?.id) || `attr_${randomUUID()}`,
          modelId,
          classId,
          name: String(attr.name || ""),
          type: attr.type ?? null,
          multiplicity: attr.multiplicity ?? null,
          documentation: attr.documentation ?? null,
          documentationRu: attr.documentationRu ?? null,
          details: attr.details ?? null,
          refModelId: attr.refModelId ?? null,
          refModelItemId: attr.refModelItemId ?? null,
        },
      });
    }

    const links = Array.isArray(cls.links) ? cls.links : [];
    for (const link of links) {
      const linkRowId = toNonEmptyStr(link?.id) || toNonEmptyStr(link?.linkId) || `link_${randomUUID()}`;
      await tx.linkModel.create({
        data: {
          id: linkRowId,
          modelId,
          classId,
          name: link?.name === undefined ? null : toStr(link?.name),
          type: link.type ?? null,
          multiplicity: link.multiplicity ?? null,
          documentation: link.documentation ?? null,
          documentationRu: link.documentationRu ?? null,
          details: link.details ?? null,
          refModelId: link.refModelId ?? null,
          refModelItemId: link.refModelItemId ?? null,
        },
      });
    }

    const literals = Array.isArray(cls.literals) ? cls.literals : [];
    for (const literal of literals) {
      await tx.literalModel.create({
        data: {
          id: toNonEmptyStr(literal?.id) || `lit_${randomUUID()}`,
          modelId,
          classId,
          name: String(literal.name || ""),
          value: literal.value ?? null,
          documentation: literal.documentation ?? null,
          documentationRu: literal.documentationRu ?? null,
        },
      });
    }
  }

  const subPackages = Array.isArray(pkg.subPackages) ? pkg.subPackages : [];
  for (const sp of subPackages) {
    await importPackageTreeModel(tx, modelId, pkgId, sp);
  }
}

async function importPackageTreeProfile(tx, profileId, parentId, pkg) {
  const pkgId = toNonEmptyStr(pkg?.id) || `pkg_${randomUUID()}`;

  await tx.packageProfile.create({
    data: {
      id: pkgId,
      profileId,
      parentId,
      name: String(pkg.name || ""),
      type: pkg.type ?? null,
      parentPackage: pkg.parentPackage ?? null,
      documentation: pkg.documentation ?? null,
      documentationRu: pkg.documentationRu ?? null,
      details: pkg.details ?? null,
    },
  });

  const classes = Array.isArray(pkg.classes) ? pkg.classes : [];
  for (const cls of classes) {
    const classId = toNonEmptyStr(cls?.id) || `cls_${randomUUID()}`;
    await tx.classProfile.create({
      data: {
        id: classId,
        profileId,
        packageId: pkgId,
        name: String(cls.name || ""),
        type: cls.type ?? null,
        stereotype: cls.stereotype ?? null,
        documentation: cls.documentation ?? null,
        documentationRu: cls.documentationRu ?? null,
        details: cls.details ?? null,
        isAbstract: cls.isAbstract ?? null,
        refModelId: cls.refModelId ?? null,
        refModelItemId: cls.refModelItemId ?? null,
      },
    });

    const attributes = Array.isArray(cls.attributes) ? cls.attributes : [];
    for (const attr of attributes) {
      await tx.attributeProfile.create({
        data: {
          id: toNonEmptyStr(attr?.id) || `attr_${randomUUID()}`,
          profileId,
          classId,
          name: String(attr.name || ""),
          type: attr.type ?? null,
          multiplicity: attr.multiplicity ?? null,
          documentation: attr.documentation ?? null,
          documentationRu: attr.documentationRu ?? null,
          details: attr.details ?? null,
          refModelId: attr.refModelId ?? null,
          refModelItemId: attr.refModelItemId ?? null,
        },
      });
    }

    const links = Array.isArray(cls.links) ? cls.links : [];
    for (const link of links) {
      const linkRowId = toNonEmptyStr(link?.id) || toNonEmptyStr(link?.linkId) || `link_${randomUUID()}`;
      await tx.linkProfile.create({
        data: {
          id: linkRowId,
          profileId,
          classId,
          name: link?.name === undefined ? null : toStr(link?.name),
          type: link.type ?? null,
          multiplicity: link.multiplicity ?? null,
          documentation: link.documentation ?? null,
          documentationRu: link.documentationRu ?? null,
          details: link.details ?? null,
          refModelId: link.refModelId ?? null,
          refModelItemId: link.refModelItemId ?? null,
        },
      });
    }

    const literals = Array.isArray(cls.literals) ? cls.literals : [];
    for (const literal of literals) {
      await tx.literalProfile.create({
        data: {
          id: toNonEmptyStr(literal?.id) || `lit_${randomUUID()}`,
          profileId,
          classId,
          name: String(literal.name || ""),
          value: literal.value ?? null,
          documentation: literal.documentation ?? null,
          documentationRu: literal.documentationRu ?? null,
        },
      });
    }
  }

  const subPackages = Array.isArray(pkg.subPackages) ? pkg.subPackages : [];
  for (const sp of subPackages) {
    await importPackageTreeProfile(tx, profileId, pkgId, sp);
  }
}
