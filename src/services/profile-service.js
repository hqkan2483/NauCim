import { generateUUID } from "../utils/uuid.js";
import {
  getProfiles as repoGetProfiles,
  getProfile as repoGetProfile,
  getProfileHeader as repoGetProfileHeader,
  createProfile as repoCreateProfile,
  updateProfile as repoUpdateProfile,
  deleteProfile as repoDeleteProfile,
  importProfileRootPackages as repoImportProfileRootPackages,
} from "./repositories/profile-repository.js";
import {
  validateCreateProfilePayload,
  validateUpdateProfilePayload,
} from "./business/profile-validator.js";
import { getProjectById } from "./project-service.js";

// ============================================================
// PROFILE SERVICE - Service Layer
// Manages Profile Business Operations
// ============================================================

/**
 * Get all profiles for a project
 * @param {string} projectId
 * @returns {Promise<Array>} Array of profiles
 */
async function getProfiles(projectId) {
  if (!projectId) return [];
  try {
    return await repoGetProfiles(String(projectId));
  } catch (error) {
    console.error(`[getProfiles] Failed for project ${projectId}:`, error);
    return [];
  }
}

/**
 * Get single profile by ID
 * @param {string} projectId
 * @param {string} profileId
 * @returns {Promise<object|null>} Profile object or null
 */
async function getProfile(projectId, profileId) {
  if (!projectId || !profileId) return null;
  try {
    // First try to get from project (to ensure it belongs to project)
    const project = await getProjectById(projectId);
    if (project && project.profiles) {
      const profile = project.profiles.find((p) => String(p.id) === String(profileId));
      if (profile) return profile;
    }
    // Fallback to direct repository call
    return await repoGetProfile(String(profileId));
  } catch (error) {
    console.error(`[getProfile] Failed for profile ${profileId}:`, error);
    return null;
  }
}

/**
 * Get profile header by ID (everything except rootPackages)
 * @param {string} projectId
 * @param {string} profileId
 * @returns {Promise<object|null>} Profile header or null
 */
async function getProfileHeader(projectId, profileId) {
  if (!projectId || !profileId) return null;
  try {
    const header = await repoGetProfileHeader(String(profileId));
    if (!header) return null;
    if (String(header.projectId) !== String(projectId)) {
      console.warn(
        `[getProfileHeader] Profile ${profileId} does not belong to project ${projectId}`
      );
      return null;
    }
    return header;
  } catch (error) {
    console.error(`[getProfileHeader] Failed for profile ${profileId}:`, error);
    return null;
  }
}

/**
 * Check if profile name is unique within project
 * @param {string} projectId
 * @param {string} name - Profile name to check
 * @param {string} excludeId - Profile ID to exclude from check (for edit)
 * @returns {Promise<boolean>} true if name is unique
 */
async function isProfileNameUnique(projectId, name, excludeId = null) {
  if (!projectId) return false;
  try {
    const profiles = await repoGetProfiles(String(projectId));
    const trimmedName = name.trim().toLowerCase();

    return !profiles.some((p) => {
      // Skip the profile being edited
      if (excludeId && String(p.id) === String(excludeId)) {
        return false;
      }
      return p.name.trim().toLowerCase() === trimmedName;
    });
  } catch (error) {
    console.error(`[isProfileNameUnique] Failed for project ${projectId}:`, error);
    return false;
  }
}

/**
 * Create new profile
 * @param {string} projectId
 * @param {object} payload - { name, description?, version? }
 * @returns {Promise<object|null>} Created profile or null
 */
async function createProfile(projectId, payload) {
  if (!projectId) {
    console.error("[createProfile] Project ID is required");
    return null;
  }

  // Validate payload
  const validation = validateCreateProfilePayload(payload);
  if (!validation.valid) {
    console.error("[createProfile]", validation.error);
    return null;
  }

  // Verify project exists
  const project = await getProjectById(String(projectId));
  if (!project) {
    console.error(`[createProfile] Project not found: ${projectId}`);
    return null;
  }

  const trimmedName = payload.name.trim();

  // Check name uniqueness
  const isUnique = await isProfileNameUnique(projectId, trimmedName);
  if (!isUnique) {
    console.error(`[createProfile] Profile name "${trimmedName}" already exists in this project`);
    return null;
  }

  // Prepare profile data
  const newProfile = {
    id: generateUUID(),
    projectId: String(projectId),
    name: trimmedName,
    description: payload.description ? payload.description.trim() : "",
    version: payload.version ? payload.version.trim() : "0.1",
    createDate: new Date().toISOString(),
    modifyDate: new Date().toISOString(),
    legalState: "project",
    accessRights: "readWrite",
  };

  try {
    const created = await repoCreateProfile(newProfile);
    return created;
  } catch (error) {
    console.error("[createProfile] Failed to create profile:", error);
    // Check for duplicate name error from backend
    if (error.status === 409 || error.details?.name) {
      console.error(`[createProfile] Profile name "${trimmedName}" already exists in this project`);
    }
    return null;
  }
}

/**
 * Update profile
 * @param {string} projectId
 * @param {string} profileId
 * @param {object} updates - Fields to update
 * @returns {Promise<object|null>} Updated profile or null
 */
async function updateProfile(projectId, profileId, updates) {
  if (!projectId || !profileId) {
    console.error("[updateProfile] Project ID and Profile ID are required");
    return null;
  }

  // Validate payload
  const validation = validateUpdateProfilePayload(updates);
  if (!validation.valid) {
    console.error("[updateProfile]", validation.error);
    return null;
  }

  // Get existing profile
  const existingProfile = await getProfile(projectId, profileId);
  if (!existingProfile) {
    console.error(`[updateProfile] Profile not found: ${profileId}`);
    return null;
  }

  // Validate name if provided
  if (updates.name !== undefined) {
    const trimmedName = updates.name.trim();

    // Check uniqueness if name changed
    if (trimmedName.toLowerCase() !== existingProfile.name.trim().toLowerCase()) {
      const isUnique = await isProfileNameUnique(projectId, trimmedName, profileId);
      if (!isUnique) {
        console.error(`[updateProfile] Profile name "${trimmedName}" already exists in this project`);
        return null;
      }
    }

    updates.name = trimmedName;
  }

  // Prepare update data
  const updateData = {
    ...updates,
    modifyDate: new Date().toISOString(),
  };

  try {
    const updated = await repoUpdateProfile(String(profileId), updateData);
    return updated;
  } catch (error) {
    console.error(`[updateProfile] Failed to update profile ${profileId}:`, error);
    // Check for duplicate name error from backend
    if (error.status === 409 || error.details?.name) {
      console.error(`[updateProfile] Profile name "${updates.name}" already exists in this project`);
    }
    return null;
  }
}

/**
 * Delete profile
 * @param {string} projectId
 * @param {string} profileId
 * @returns {Promise<boolean>} true if deleted, false otherwise
 */
async function deleteProfile(projectId, profileId) {
  if (!projectId || !profileId) {
    console.error("[deleteProfile] Project ID and Profile ID are required");
    return false;
  }

  try {
    const deleted = await repoDeleteProfile(String(profileId));
    if (deleted) {
      return true;
    }
    return false;
  } catch (error) {
    console.error(`[deleteProfile] Failed to delete profile ${profileId}:`, error);
    return false;
  }
}

/**
 * Import rootPackages into an existing profile (replaces current graph)
 * Returns full updated project (as returned by backend export)
 */
async function importProfileRootPackages(projectId, profileId, payload) {
  if (!projectId || !profileId) {
    console.error("[importProfileRootPackages] Project ID and Profile ID are required");
    return null;
  }

  // Ensure profile belongs to project
  const profile = await getProfile(projectId, profileId);
  if (!profile) {
    console.error(`[importProfileRootPackages] Profile not found: ${profileId}`);
    return null;
  }

  try {
    return await repoImportProfileRootPackages(String(profileId), payload);
  } catch (error) {
    console.error(`[importProfileRootPackages] Failed for profile ${profileId}:`, error);
    return null;
  }
}

export {
  getProfiles,
  getProfile,
  getProfileHeader,
  createProfile,
  updateProfile,
  deleteProfile,
  importProfileRootPackages,
  isProfileNameUnique,
};
