import { prisma } from "../db.js";

function isRootPackageLike(rp) {
  return rp && typeof rp === "object" && Array.isArray(rp.packages);
}

function toStr(v) {
  if (v === undefined || v === null) return null;
  return String(v);
}

export async function importProject(project) {
  // Minimal validation; frontend can send canonical contract from docs/DATA_STRUCTURES.md
  const projectId = String(project.id);

  const models = Array.isArray(project.models) ? project.models : [];
  const profiles = Array.isArray(project.profiles) ? project.profiles : [];

  const result = await prisma.$transaction(async (tx) => {
    await tx.project.upsert({
      where: { id: projectId },
      create: {
        id: projectId,
        name: String(project.name || ""),
        description: project.description ?? null,
        version: String(project.version || "1.0"),
        createDate: String(project.createDate || new Date().toISOString()),
        modifyDate: String(project.modifyDate || new Date().toISOString()),
        accessRights: project.accessRights ?? null,
      },
      update: {
        name: String(project.name || ""),
        description: project.description ?? null,
        version: String(project.version || "1.0"),
        modifyDate: String(project.modifyDate || new Date().toISOString()),
        accessRights: project.accessRights ?? null,
      },
    });

    // Upsert models + profiles (without deep graphs yet)
    for (const model of models) {
      await tx.model.upsert({
        where: { id: String(model.id) },
        create: {
          id: String(model.id),
          projectId,
          name: String(model.name || ""),
          description: model.description ?? null,
          type: model.type ?? null,
          version: String(model.version || "1.0"),
          createDate: String(model.createDate || new Date().toISOString()),
          modifyDate: String(model.modifyDate || new Date().toISOString()),
          legalState: model.legalState ?? null,
          legalAct: model.legalAct ?? null,
          accessRights: model.accessRights ?? null,
        },
        update: {
          projectId,
          name: String(model.name || ""),
          description: model.description ?? null,
          type: model.type ?? null,
          version: String(model.version || "1.0"),
          modifyDate: String(model.modifyDate || new Date().toISOString()),
          legalState: model.legalState ?? null,
          legalAct: model.legalAct ?? null,
          accessRights: model.accessRights ?? null,
        },
      });

      // Replace rootPackages graph for this model
      await tx.rootPackage.deleteMany({ where: { modelId: String(model.id) } });
      const rootPackages = Array.isArray(model.rootPackages) ? model.rootPackages : [];
      for (const rp of rootPackages) {
        if (!isRootPackageLike(rp)) continue;
        const createdRp = await tx.rootPackage.create({ data: { modelId: String(model.id) } });
        await importRootPackageGraph(tx, createdRp.id, rp);
      }
    }

    for (const profile of profiles) {
      await tx.profile.upsert({
        where: { id: String(profile.id) },
        create: {
          id: String(profile.id),
          projectId,
          name: String(profile.name || ""),
          description: profile.description ?? null,
          version: String(profile.version || "1.0"),
          createDate: String(profile.createDate || new Date().toISOString()),
          modifyDate: String(profile.modifyDate || new Date().toISOString()),
          legalState: profile.legalState ?? null,
          legalAct: profile.legalAct ?? null,
          accessRights: profile.accessRights ?? null,
        },
        update: {
          projectId,
          name: String(profile.name || ""),
          description: profile.description ?? null,
          version: String(profile.version || "1.0"),
          modifyDate: String(profile.modifyDate || new Date().toISOString()),
          legalState: profile.legalState ?? null,
          legalAct: profile.legalAct ?? null,
          accessRights: profile.accessRights ?? null,
        },
      });

      // Replace rootPackages graph for this profile
      await tx.rootPackage.deleteMany({ where: { profileId: String(profile.id) } });
      const rootPackages = Array.isArray(profile.rootPackages) ? profile.rootPackages : [];
      for (const rp of rootPackages) {
        if (!isRootPackageLike(rp)) continue;
        const createdRp = await tx.rootPackage.create({ data: { profileId: String(profile.id) } });
        await importRootPackageGraph(tx, createdRp.id, rp);
      }
    }

    return { ok: true, projectId };
  });

  return result;
}

async function importRootPackageGraph(tx, rootPackageId, rp) {
  // links lists (minimal fields)
  const gen = Array.isArray(rp.generalizationsList) ? rp.generalizationsList : [];
  const assoc = Array.isArray(rp.associationList) ? rp.associationList : [];

  if (gen.length) {
    await tx.generalizationLink.createMany({
      data: gen.map((g) => ({
        rootPackageId,
        sourceId: toStr(g?.sourceId),
        targetId: toStr(g?.targetId),
      })),
    });
  }

  if (assoc.length) {
    await tx.associationLink.createMany({
      data: assoc.map((a) => ({
        rootPackageId,
        sourceId: toStr(a?.sourceId),
        targetId: toStr(a?.targetId),
      })),
    });
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
    for (const a of attributes) {
      await tx.attribute.create({
        data: {
          id: String(a.id),
          classId,
          name: String(a.name || ""),
          type: a.type ?? null,
          multiplicity: a.multiplicity ?? null,
          documentation: a.documentation ?? null,
          documentationRu: a.documentationRu ?? null,
          details: a.details ?? null,
          modelId: a.modelId ?? null,
          profileId: a.profileId ?? null,
          refModelId: a.refModelId ?? null,
          refModelItemId: a.refModelItemId ?? null,
        },
      });
    }

    const links = Array.isArray(cls.links) ? cls.links : [];
    for (const l of links) {
      await tx.link.create({
        data: {
          id: String(l.id),
          classId,
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
        },
      });
    }

    const literals = Array.isArray(cls.literals) ? cls.literals : [];
    for (const lit of literals) {
      await tx.literal.create({
        data: {
          id: String(lit.id),
          classId,
          name: String(lit.name || ""),
          value: lit.value ?? null,
          documentation: lit.documentation ?? null,
          documentationRu: lit.documentationRu ?? null,
        },
      });
    }
  }

  const subPackages = Array.isArray(pkg.subPackages) ? pkg.subPackages : [];
  for (const child of subPackages) {
    await importPackageTree(tx, rootPackageId, pkgId, child);
  }
}
