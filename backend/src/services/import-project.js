import { prisma } from "../db.js";
import { isRootPackageLike, importRootPackageGraph } from "./import-root-package-graph.js";

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
        const createdRp = await tx.rootPackage.create({
          data: { modelId: String(model.id) },
        });
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
        const createdRp = await tx.rootPackage.create({
          data: { profileId: String(profile.id) },
        });
        await importRootPackageGraph(tx, createdRp.id, rp);
      }
    }

    return { ok: true, projectId };
  });

  return result;
}
