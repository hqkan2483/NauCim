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

export async function importRootPackageGraph(tx, rootPackageId, rp) {
  // links lists (canonical contract)
  const gen = Array.isArray(rp.generalizationsList) ? rp.generalizationsList : [];
  const assoc = Array.isArray(rp.associationList) ? rp.associationList : [];

  for (const g of gen) {
    const linkId = toNonEmptyStr(g?.linkId) || `gen_${randomUUID()}`;

    const parentClassId = toNonEmptyStr(g?.parent?.classId);
    const parentClassName = toNonEmptyStr(g?.parent?.className) || "";
    const childClassId = toNonEmptyStr(g?.child?.classId);
    const childClassName = toNonEmptyStr(g?.child?.className) || "";

    if (!parentClassId || !childClassId) continue;

    await tx.generalizationLink.create({
      data: {
        linkId,
        rootPackageId,
        linkType: toNonEmptyStr(g?.linkType) || "Generalization",
        documentation: toStr(g?.documentation),
        documentationRu: toStr(g?.documentationRu),
        details: toStr(g?.details),
        stereotype: toNonEmptyStr(g?.stereotype) || "",
      },
    });

    await tx.generalizationClassRef.createMany({
      data: [
        {
          generalizationLinkId: linkId,
          role: "parent",
          classId: parentClassId,
          className: parentClassName,
        },
        {
          generalizationLinkId: linkId,
          role: "child",
          classId: childClassId,
          className: childClassName,
        },
      ],
    });
  }

  for (const a of assoc) {
    const linkId = toNonEmptyStr(a?.linkId) || `assoc_${randomUUID()}`;

    await tx.associationLink.create({
      data: {
        linkId,
        rootPackageId,
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

      await tx.associationLinkEnd.create({
        data: {
          linkEndId,
          associationLinkId: linkId,
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

  const topPackages = Array.isArray(rp.packages) ? rp.packages : [];
  for (const pkg of topPackages) {
    await importPackageTree(tx, rootPackageId, null, pkg);
  }
}

async function importPackageTree(tx, rootPackageId, parentId, pkg) {
  const pkgId = String(pkg.id);

  await tx.package.create({
    data: {
      id: pkgId,
      rootPackageId,
      parentId,
      name: String(pkg.name || ""),
      type: pkg.type ?? null,
      parentPackage: pkg.parentPackage ?? null,
      documentation: pkg.documentation ?? null,
      documentationRu: pkg.documentationRu ?? null,
      details: pkg.details ?? null,
      modelId: pkg.modelId ?? null,
      profileId: pkg.profileId ?? null,
    },
  });

  const classes = Array.isArray(pkg.classes) ? pkg.classes : [];
  for (const cls of classes) {
    const classId = String(cls.id);
    await tx.class.create({
      data: {
        id: classId,
        packageId: pkgId,
        name: String(cls.name || ""),
        type: cls.type ?? null,
        stereotype: cls.stereotype ?? null,
        documentation: cls.documentation ?? null,
        documentationRu: cls.documentationRu ?? null,
        details: cls.details ?? null,
        isAbstract: cls.isAbstract ?? null,
        modelId: cls.modelId ?? null,
        profileId: cls.profileId ?? null,
        refModelId: cls.refModelId ?? null,
        refModelItemId: cls.refModelItemId ?? null,
      },
    });

    const attributes = Array.isArray(cls.attributes) ? cls.attributes : [];
    for (const attr of attributes) {
      await tx.attribute.create({
        data: {
          id: String(attr.id),
          classId,
          name: String(attr.name || ""),
          type: attr.type ?? null,
          multiplicity: attr.multiplicity ?? null,
          documentation: attr.documentation ?? null,
          documentationRu: attr.documentationRu ?? null,
          details: attr.details ?? null,
          modelId: attr.modelId ?? null,
          profileId: attr.profileId ?? null,
          refModelId: attr.refModelId ?? null,
          refModelItemId: attr.refModelItemId ?? null,
        },
      });
    }

    const links = Array.isArray(cls.links) ? cls.links : [];
    for (const link of links) {
      await tx.link.create({
        data: {
          id: String(link.id),
          classId,
          name: String(link.name || ""),
          type: link.type ?? null,
          multiplicity: link.multiplicity ?? null,
          documentation: link.documentation ?? null,
          documentationRu: link.documentationRu ?? null,
          details: link.details ?? null,
          modelId: link.modelId ?? null,
          profileId: link.profileId ?? null,
          refModelId: link.refModelId ?? null,
          refModelItemId: link.refModelItemId ?? null,
        },
      });
    }

    const literals = Array.isArray(cls.literals) ? cls.literals : [];
    for (const literal of literals) {
      await tx.literal.create({
        data: {
          id: String(literal.id),
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
    await importPackageTree(tx, rootPackageId, pkgId, sp);
  }
}
