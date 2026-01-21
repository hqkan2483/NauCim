import { 
  updateGeneralizationLink as repoUpdateGeneralizationLink,
  updateAssociationLink as repoUpdateAssociationLink 
} from "./repositories/link-repository.js";

/**
 * Link Service - Service Layer
 * Coordinates link-related business operations.
 */

/**
 * Update an existing GeneralizationLink.
 * Backend returns the full updated project.
 *
 * @param {object} args
 * @returns {Promise<object>} Full exported project
 */
export async function updateGeneralizationLink(args) {
  if (!args?.linkId) throw new Error("linkId is required");
  return await repoUpdateGeneralizationLink(args);
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
  
  // Frontend validation for unique association names
  validateUniqueAssociationNames(args);
  
  return await repoUpdateAssociationLink(args);
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
function validateUniqueAssociationNames({ linkId, payload, project }) {
  if (!project || !payload?.linkEnd) return;
  
  const linkEnd = Array.isArray(payload.linkEnd) ? payload.linkEnd : [];
  if (linkEnd.length !== 2) {
    throw new Error("Association link must have exactly 2 linkEnd entries");
  }
  
  for (const end of linkEnd) {
    const classId = String(end?.linkEndClassId || "");
    const endName = String(end?.linkEndName || "").trim();
    
    if (!endName || !classId) continue; // Skip empty names
    
    // Find all association links involving this class
    const allLinks = findAllAssociationLinksForClass(project, classId);
    
    // Check if any other link has the same name
    for (const link of allLinks) {
      if (String(link.linkId) === String(linkId)) continue; // Skip current link
      
      const linkEnds = Array.isArray(link.linkEnd) ? link.linkEnd : [];
      for (const otherEnd of linkEnds) {
        const otherClassId = String(otherEnd?.linkEndClassId || "");
        const otherEndName = String(otherEnd?.linkEndName || "").trim();
        
        if (otherClassId === classId && otherEndName === endName) {
          throw new Error(
            `Association name "${endName}" is already used in this class. Each association must have a unique name within a class.`
          );
        }
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
  
  // Search in models
  if (Array.isArray(project?.models)) {
    for (const model of project.models) {
      if (Array.isArray(model?.associationLinks)) {
        for (const link of model.associationLinks) {
          const linkEnds = Array.isArray(link.linkEnd) ? link.linkEnd : [];
          const hasClass = linkEnds.some(end => String(end?.linkEndClassId || "") === classId);
          if (hasClass) links.push(link);
        }
      }
    }
  }
  
  // Search in profiles
  if (Array.isArray(project?.profiles)) {
    for (const profile of project.profiles) {
      if (Array.isArray(profile?.associationLinks)) {
        for (const link of profile.associationLinks) {
          const linkEnds = Array.isArray(link.linkEnd) ? link.linkEnd : [];
          const hasClass = linkEnds.some(end => String(end?.linkEndClassId || "") === classId);
          if (hasClass) links.push(link);
        }
      }
    }
  }
  
  return links;
}

