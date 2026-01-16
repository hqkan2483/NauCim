import { newId } from "../utils/id-generation.js";

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
    const srcId = toNonEmptyStr(g?.srcId) || toNonEmptyStr(g?.linkId);
    const linkId = toNonEmptyStr(g?.linkId) || newId("gen");

    const parentClassId = toNonEmptyStr(g?.parent?.classId);
    const parentClassName = toNonEmptyStr(g?.parent?.className) || "";
    const childClassId = toNonEmptyStr(g?.child?.classId);
    const childClassName = toNonEmptyStr(g?.child?.className) || "";

    if (!parentClassId || !childClassId) continue;

    await tx.generalizationLinkModel.create({
      data: {
        id: linkId,
        srcId,
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
    const srcId = toNonEmptyStr(a?.srcId) || toNonEmptyStr(a?.linkId);
    const linkId = toNonEmptyStr(a?.linkId) || newId("assoc");

    await tx.associationLinkModel.create({
      data: {
        id: linkId,
        srcId,
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
      const srcId = toNonEmptyStr(e?.srcId) || toNonEmptyStr(e?.linkEndId);
      const linkEndId = toNonEmptyStr(e?.linkEndId) || newId("end");
      const endClassId = toNonEmptyStr(e?.linkEndClassId);
      const endClassName = toNonEmptyStr(e?.linkEndClassName) || "";
      if (!endClassId) continue;

      await tx.associationLinkEndModel.create({
        data: {
          linkEndId,
          srcId,
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
    const srcId = toNonEmptyStr(g?.srcId) || toNonEmptyStr(g?.linkId);
    const linkId = toNonEmptyStr(g?.linkId) || newId("gen");

    const parentClassId = toNonEmptyStr(g?.parent?.classId);
    const parentClassName = toNonEmptyStr(g?.parent?.className) || "";
    const childClassId = toNonEmptyStr(g?.child?.classId);
    const childClassName = toNonEmptyStr(g?.child?.className) || "";

    if (!parentClassId || !childClassId) continue;

    await tx.generalizationLinkProfile.create({
      data: {
        id: linkId,
        srcId,
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
    const srcId = toNonEmptyStr(a?.srcId) || toNonEmptyStr(a?.linkId);
    const linkId = toNonEmptyStr(a?.linkId) || newId("assoc");

    await tx.associationLinkProfile.create({
      data: {
        id: linkId,
        srcId,
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
      const srcId = toNonEmptyStr(e?.srcId) || toNonEmptyStr(e?.linkEndId);
      const linkEndId = toNonEmptyStr(e?.linkEndId) || newId("end");
      const endClassId = toNonEmptyStr(e?.linkEndClassId);
      const endClassName = toNonEmptyStr(e?.linkEndClassName) || "";
      if (!endClassId) continue;

      await tx.associationLinkEndProfile.create({
        data: {
          linkEndId,
          srcId,
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
  const srcId = toNonEmptyStr(pkg?.srcId) || toNonEmptyStr(pkg?.id);
  const pkgId = toNonEmptyStr(pkg?.id) || newId("pkg");

  await tx.packageModel.create({
    data: {
      id: pkgId,
      srcId,
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
    const srcId = toNonEmptyStr(cls?.srcId) || toNonEmptyStr(cls?.id);
    const classId = toNonEmptyStr(cls?.id) || newId("cls");
    await tx.classModel.create({
      data: {
        id: classId,
        srcId,
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
      const srcId = toNonEmptyStr(attr?.srcId) || toNonEmptyStr(attr?.id);
      await tx.attributeModel.create({
        data: {
          id: toNonEmptyStr(attr?.id) || newId("attr"),
          srcId,
          modelId,
          classId,
          name: String(attr.name || ""),
          dataTypeId: toNonEmptyStr(attr?.dataTypeId),
          stereotype: attr.stereotype ?? null,
          multiplicity: attr.multiplicity ?? null,
          documentation: attr.documentation ?? null,
          documentationRu: attr.documentationRu ?? null,
          details: attr.details ?? null,
          initialValue: attr.initialValue ?? null,
          refModelId: attr.refModelId ?? null,
          refModelItemId: attr.refModelItemId ?? null,
        },
      });
    }


    const literals = Array.isArray(cls.literals) ? cls.literals : [];
    for (const literal of literals) {
      const srcId = toNonEmptyStr(literal?.srcId) || toNonEmptyStr(literal?.id);
      await tx.literalModel.create({
        data: {
          id: toNonEmptyStr(literal?.id) || newId("lit"),
          srcId,
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
  const srcId = toNonEmptyStr(pkg?.srcId) || toNonEmptyStr(pkg?.id);
  const pkgId = toNonEmptyStr(pkg?.id) || newId("pkg");

  await tx.packageProfile.create({
    data: {
      id: pkgId,
      srcId,
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
    const srcId = toNonEmptyStr(cls?.srcId) || toNonEmptyStr(cls?.id);
    const classId = toNonEmptyStr(cls?.id) || newId("cls");
    await tx.classProfile.create({
      data: {
        id: classId,
        srcId,
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
      const srcId = toNonEmptyStr(attr?.srcId) || toNonEmptyStr(attr?.id);
      await tx.attributeProfile.create({
        data: {
          id: toNonEmptyStr(attr?.id) || newId("attr"),
          srcId,
          profileId,
          classId,
          name: String(attr.name || ""),
          dataTypeId: toNonEmptyStr(attr?.dataTypeId),
          stereotype: attr.stereotype ?? null,
          multiplicity: attr.multiplicity ?? null,
          documentation: attr.documentation ?? null,
          documentationRu: attr.documentationRu ?? null,
          details: attr.details ?? null,
          initialValue: attr.initialValue ?? null,
          refModelId: attr.refModelId ?? null,
          refModelItemId: attr.refModelItemId ?? null,
        },
      });
    }


    const literals = Array.isArray(cls.literals) ? cls.literals : [];
    for (const literal of literals) {
      const srcId = toNonEmptyStr(literal?.srcId) || toNonEmptyStr(literal?.id);
      await tx.literalProfile.create({
        data: {
          id: toNonEmptyStr(literal?.id) || newId("lit"),
          srcId,
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
