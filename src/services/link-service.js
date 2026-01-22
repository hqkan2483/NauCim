import { 
  updateGeneralizationLink as repoUpdateGeneralizationLink,
  updateAssociationLink as repoUpdateAssociationLink,
  createGeneralizationLink as repoCreateGeneralizationLink,
  createAssociationLink as repoCreateAssociationLink,
  deleteGeneralizationLink as repoDeleteGeneralizationLink,
  deleteAssociationLink as repoDeleteAssociationLink
} from "./repositories/link-repository.js";

/**
 * Link Service - Service Layer
 * Coordinates link-related business operations.
 */

/**
 * Update an existing GeneralizationLink.
 * Frontend validation for unique parent constraint.
 * Backend returns the full updated project.
 *
 * @param {object} args
 * @param {string} args.linkId - ID of the generalization link to update
 * @param {string} [args.modelId] - Optional model ID
 * @param {string} [args.profileId] - Optional profile ID
 * @param {string} [args.editingClassId] - Optional editing class ID
 * @param {object} args.payload - GeneralizationLink data
 * @param {object} args.project - Current project data for validation
 * @returns {Promise<object>} Full exported project
 */
export async function updateGeneralizationLink(args) {
  if (!args?.linkId) throw new Error("linkId is required");
  if (!args?.payload) throw new Error("payload is required");
  
  // Frontend validation for unique parent constraint
  validateUniqueParent(args);
  
  return await repoUpdateGeneralizationLink(args);
}

/**
 * Create a new GeneralizationLink.
 */
export async function createGeneralizationLink(args) {
  if (!args?.payload) throw new Error("payload is required");
  validateUniqueParent({ ...args, linkId: "" });
  return await repoCreateGeneralizationLink(args);
}

/**
 * Update an existing AssociationLink.
 * Frontend validation for unique association names within a class.
 * Backend returns the full updated project.
 *
 * @param {object} args
 * @param {string} args.linkId - ID of the association link to update
 * @param {string} [args.modelId] - Optional model ID
 * @param {string} [args.profileId] - Optional profile ID
 * @param {string} [args.editingClassId] - Optional editing class ID
 * @param {object} args.payload - AssociationLink data
 * @param {object} args.project - Current project data for validation
 * @returns {Promise<object>} Full exported project
 */
export async function updateAssociationLink(args) {
  if (!args?.linkId) throw new Error("linkId is required");
  if (!args?.payload) throw new Error("payload is required");
  // Frontend validation for unique association names (other-end name uniqueness)
  validateUniqueAssociationNames(args);
  return await repoUpdateAssociationLink(args);
}

/**
 * Create a new AssociationLink.
 */
export async function createAssociationLink(args) {
  if (!args?.payload) throw new Error("payload is required");
  validateUniqueAssociationNames({ ...args, linkId: "" });
  return await repoCreateAssociationLink(args);
}

/**
 * Delete an existing GeneralizationLink.
 * Backend returns the full updated project.
 *
 * @param {object} args
 * @param {string} args.linkId
 * @param {string} [args.modelId]
 * @param {string} [args.profileId]
 * @param {string} [args.editingClassId]
 * @returns {Promise<object>} Full exported project
 */
export async function deleteGeneralizationLink(args) {
  if (!args?.linkId) throw new Error("linkId is required");
  return await repoDeleteGeneralizationLink(args);
}

/**
 * Delete an existing AssociationLink.
 * Backend returns the full updated project.
 *
 * @param {object} args
 * @param {string} args.linkId
 * @param {string} [args.modelId]
 * @param {string} [args.profileId]
 * @param {string} [args.editingClassId]
 * @returns {Promise<object>} Full exported project
 */
export async function deleteAssociationLink(args) {
  if (!args?.linkId) throw new Error("linkId is required");
  return await repoDeleteAssociationLink(args);
}

/**
 * Validate that association names are unique within each class (frontend validation).
 * Checks that no other association on the same class has the same linkEndName.
 *
 * @param {object} args
 * @param {string} args.linkId - Current link ID being updated
 * @param {object} args.payload - Association link payload
 * @param {object} args.project - Current project data
 */
export function validateUniqueAssociationNames({ linkId, payload, project }) {
  if (!project || !payload?.linkEnd) return;

  const linkEnd = Array.isArray(payload.linkEnd) ? payload.linkEnd : [];
  if (linkEnd.length !== 2) {
    throw new Error("Association link must have exactly 2 linkEnd entries");
  }

  // For each class in the link, the name of the opposite end must be unique across its associations
  for (const end of linkEnd) {
    const classId = String(end?.linkEndClassId || "");
    const other = linkEnd.find((e) => e !== end) || null;
    const otherName = String(other?.linkEndName || "").trim();

    if (!classId || !otherName) continue;

    const allLinks = findAllAssociationLinksForClass(project, classId);
    for (const link of allLinks) {
      if (linkId && String(link.linkId) === String(linkId)) continue; // Skip current link when editing

      const otherEndName = getOtherEndNameFromLink(link, classId);
      if (!otherEndName) continue;

      if (otherEndName === otherName) {
        throw new Error(
          `Ассоциация для этого класса уже использует имя узла "${otherName}". Имена связей одного класса должны быть уникальны.`
        );
      }
    }
  }
}

/**
 * Find all association links for a given class ID in the project.
 *
 * @param {object} project - Project data
 * @param {string} classId - Class ID to search for
 * @returns {Array} Array of association links involving this class
 */
function findAllAssociationLinksForClass(project, classId) {
  const links = [];

  // 1) Модели/профили, где ассоциации лежат в корневых пакетах (associationList)
  const collectFromRootPackages = (rootPackages) => {
    if (!Array.isArray(rootPackages)) return;
    const rp = rootPackages[0];
    const assocList = Array.isArray(rp?.associationList) ? rp.associationList : [];
    for (const link of assocList) {
      const linkEnds = Array.isArray(link?.linkEnd) ? link.linkEnd : [];
      const hasClass = linkEnds.some((end) => String(end?.linkEndClassId || "") === classId);
      if (hasClass) links.push(link);
    }
  };

  if (Array.isArray(project?.models)) {
    for (const model of project.models) {
      collectFromRootPackages(model?.rootPackages);
    }
  }

  if (Array.isArray(project?.profiles)) {
    for (const profile of project.profiles) {
      collectFromRootPackages(profile?.rootPackages);
    }
  }

  // 2) Модели/профили, где ассоциации лежат отдельно в associationLinks
  if (Array.isArray(project?.models)) {
    for (const model of project.models) {
      if (Array.isArray(model?.associationLinks)) {
        for (const link of model.associationLinks) {
          const linkEnds = Array.isArray(link.linkEnd) ? link.linkEnd : [];
          const hasClass = linkEnds.some((end) => String(end?.linkEndClassId || "") === classId);
          if (hasClass) links.push(link);
        }
      }
    }
  }

  if (Array.isArray(project?.profiles)) {
    for (const profile of project.profiles) {
      if (Array.isArray(profile?.associationLinks)) {
        for (const link of profile.associationLinks) {
          const linkEnds = Array.isArray(link.linkEnd) ? link.linkEnd : [];
          const hasClass = linkEnds.some((end) => String(end?.linkEndClassId || "") === classId);
          if (hasClass) links.push(link);
        }
      }
    }
  }

  // 3) Ассоциации, встроенные в классы (export содержит cls.links)
  const classLinks = collectClassLinks(project, classId);
  links.push(...classLinks);

  return links;
}

function collectClassLinks(project, classId) {
  const result = [];

  const processPackages = (packages) => {
    if (!Array.isArray(packages)) return;
    for (const pkg of packages) {
      if (Array.isArray(pkg?.classes)) {
        for (const cls of pkg.classes) {
          if (String(cls?.id || "") !== classId) continue;
          if (Array.isArray(cls.links)) {
            for (const link of cls.links) {
              if (link?.relationKind === "Association") {
                result.push({
                  linkId: link.linkId,
                  targetClassRoleName: link.targetClassRoleName ?? link.srcClassRoleName ?? "",
                  linkEnd: [
                    { linkEndClassId: cls.id, linkEndName: link.srcClassRoleName ?? "" },
                    { linkEndClassId: link.targetClassId ?? "", linkEndName: link.targetClassRoleName ?? "" },
                  ],
                });
              }
            }
          }
        }
      }

      if (Array.isArray(pkg?.subPackages) && pkg.subPackages.length) {
        processPackages(pkg.subPackages);
      }
    }
  };

  if (Array.isArray(project?.models)) {
    for (const model of project.models) {
      const root = model?.rootPackages || [];
      processPackages(root);
    }
  }

  if (Array.isArray(project?.profiles)) {
    for (const profile of project.profiles) {
      const root = profile?.rootPackages || [];
      processPackages(root);
    }
  }

  return result;
}

function getOtherEndNameFromLink(link, classId) {
  if (link?.targetClassRoleName !== undefined) {
    return String(link.targetClassRoleName || "").trim();
  }

  const ends = Array.isArray(link?.linkEnd) ? link.linkEnd : [];
  const selfEnd = ends.find((e) => String(e?.linkEndClassId || "") === String(classId));
  const otherEnd = ends.find((e) => e !== selfEnd) || null;
  return String(otherEnd?.linkEndName || "").trim();
}

/**
 * Find all generalization links for a given class ID in the project.
 * Returns links where the class is either parent or child.
 *
 * @param {object} project - Project data
 * @param {string} classId - Class ID to search for
 * @returns {Array<{link: object, role: 'parent'|'child'|null}>} Array of generalization links with role information
 */
function findAllGeneralizationLinksForClass(project, classId) {
  const links = [];
  const cid = String(classId);

  // Search in models
  if (Array.isArray(project?.models)) {
    for (const model of project.models) {
      const rootPackage = model?.rootPackages?.[0];
      if (rootPackage && Array.isArray(rootPackage.generalizationsList)) {
        for (const link of rootPackage.generalizationsList) {
          const parentId = String(link?.parent?.classId || "");
          const childId = String(link?.child?.classId || "");
          
          if (parentId === cid) {
            links.push({ link, role: 'parent' });
          } else if (childId === cid) {
            links.push({ link, role: 'child' });
          }
        }
      }
    }
  }

  // Search in profiles
  if (Array.isArray(project?.profiles)) {
    for (const profile of project.profiles) {
      const rootPackage = profile?.rootPackages?.[0];
      if (rootPackage && Array.isArray(rootPackage.generalizationsList)) {
        for (const link of rootPackage.generalizationsList) {
          const parentId = String(link?.parent?.classId || "");
          const childId = String(link?.child?.classId || "");
          
          if (parentId === cid) {
            links.push({ link, role: 'parent' });
          } else if (childId === cid) {
            links.push({ link, role: 'child' });
          }
        }
      }
    }
  }

  return links;
}

/**
 * Validate that a class has only one parent (unique parent constraint).
 * Business rule: Each class can have only one parent in generalization hierarchy.
 *
 * Scenarios:
 * 1. If new role is 'child' - check that editingClassId doesn't already have another parent
 * 2. If new role is 'parent' - check that targetClassId doesn't already have another parent
 *
 * @param {object} args
 * @param {string} args.linkId - Current link ID being updated
 * @param {object} args.payload - Generalization link payload with parent/child
 * @param {object} args.project - Current project data
 * @param {string} [args.editingClassId] - The class being edited
 * @throws {Error} If validation fails
 */
function validateUniqueParent({ linkId, payload, project, editingClassId }) {
  if (!project || !payload) return;
  
  const parentClassId = String(payload?.parent?.classId || "");
  const childClassId = String(payload?.child?.classId || "");
  
  if (!parentClassId || !childClassId) {
    throw new Error("parent.classId and child.classId are required");
  }
  
  // Determine which class will be the child after update
  // The child is the one that will have a parent
  const classToValidate = childClassId;
  
  // Find all generalization links for the child class
  const allLinks = findAllGeneralizationLinksForClass(project, classToValidate);
  
  // Check if the child already has a parent (excluding current link)
  for (const { link, role } of allLinks) {
    const existingLinkId = String(link?.linkId || "");
    
    // Skip the link being edited
    if (linkId && existingLinkId === String(linkId)) continue;
    
    // If this class is a child in another link, it already has a parent
    if (role === 'child') {
      const existingParentId = String(link?.parent?.classId || "");
      throw new Error(
        `Класс уже имеет родителя. Каждый класс может иметь только одного родителя в иерархии наследования. Существующая связь с родителем: ${existingParentId}`
      );
    }
  }
}
