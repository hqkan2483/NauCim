import { prisma } from "../src/db.js";
import { exportProject } from "../src/services/export-project.js";

function* walkPackages(pkgs) {
  for (const pkg of pkgs || []) {
    yield pkg;
    yield* walkPackages(pkg.subPackages);
  }
}

function* walkClasses(pkgs) {
  for (const pkg of walkPackages(pkgs)) {
    for (const cls of pkg.classes || []) yield cls;
  }
}

const project = await prisma.project.findFirst({ select: { id: true } });
if (!project) {
  console.log("No projects in DB");
  await prisma.$disconnect();
  process.exit(0);
}

const counts = {
  classModel: await prisma.classModel.count(),
  classProfile: await prisma.classProfile.count(),
};

const exported = await exportProject(project.id);
const firstModel = exported.models?.[0];
const firstProfile = exported.profiles?.[0];

const modelClasses = firstModel ? Array.from(walkClasses(firstModel.rootPackages?.[0]?.packages)) : [];
const profileClasses = firstProfile ? Array.from(walkClasses(firstProfile.rootPackages?.[0]?.packages)) : [];

console.log("project", project.id);
console.log("counts", counts);
console.log("model classes exported", modelClasses.length);
console.log("profile classes exported", profileClasses.length);

const modelCls = modelClasses[0];
const profileCls = profileClasses[0];

console.log(
  "first model class profileRelations len",
  Array.isArray(modelCls?.profileRelations) ? modelCls.profileRelations.length : null
);
console.log(
  "first profile class ref",
  profileCls?.refModelId ?? null,
  profileCls?.refModelItemId ?? null
);

await prisma.$disconnect();
