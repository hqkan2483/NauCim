import { MemoryStore } from "../store/memory-store.js";
import { generateUUID } from "../utils/uuid.js";

// ============================================================
// PROFILE SERVICE - Manages Profile Data Operations
// ============================================================

/**
 * Get all profiles for a project
 * @param {string} projectId
 * @returns {Array} - Array of profiles
 */
function getProfiles(projectId) {
  const project = MemoryStore.getProjectById(String(projectId));
  return project ? project.profiles || [] : [];
}

/**
 * Get single profile by ID
 * @param {string} projectId
 * @param {string} profileId
 * @returns {object|null} - Profile object or null
 */
function getProfile(projectId, profileId) {
  const profiles = getProfiles(projectId);
  return profiles.find((p) => String(p.id) === String(profileId)) || null;
}

/**
 * Check if profile name is unique within project
 * @param {string} projectId
 * @param {string} name - Profile name to check
 * @param {string} excludeId - Profile ID to exclude from check (for edit)
 * @returns {boolean} - true if name is unique
 */
function isProfileNameUnique(projectId, name, excludeId = null) {
  const profiles = getProfiles(projectId);
  const trimmedName = name.trim().toLowerCase();

  return !profiles.some((p) => {
    // Skip the profile being edited
    if (excludeId && String(p.id) === String(excludeId)) {
      return false;
    }
    return p.name.trim().toLowerCase() === trimmedName;
  });
}

/**
 * Create new profile
 * @param {string} projectId
 * @param {object} payload - { name, description, version }
 * @returns {object|null} - Created profile or null
 */
function createProfile(projectId, payload) {
  if (!payload || !payload.name || !payload.name.trim()) {
    console.error("[createProfile] Name is required");
    return null;
  }

  const project = MemoryStore.getProjectById(String(projectId));
  if (!project) {
    console.error(`[createProfile] Project not found: ${projectId}`);
    return null;
  }

  const trimmedName = payload.name.trim();

  // Validate name length
  if (trimmedName.length < 3) {
    console.error("[createProfile] Name must be at least 3 characters");
    return null;
  }

  // Validate name uniqueness
  if (!isProfileNameUnique(projectId, trimmedName)) {
    console.error(`[createProfile] Profile name "${trimmedName}" already exists in this project`);
    return null;
  }

  const newProfile = {
    id: generateUUID(),
    name: trimmedName,
    description: payload.description ?  payload.description.trim() : "",
    version: payload.version ?  payload.version.trim() : "0.1",
    createDate: new Date().toISOString(),
    modifyDate: new Date().toISOString(),
    legalState: "project",
    accessRights: "readWrite",
    relatedModels: [],
    rootPackages: [],
  };

  if (!project.profiles) {
    project.profiles = [];
  }

  project.profiles.push(newProfile);
  MemoryStore.updateProject(String(projectId), project);

  console.log(`✅ Profile created: ${newProfile.name} (id: ${newProfile.id})`);
  return newProfile;
}

/**
 * Update profile
 * @param {string} projectId
 * @param {string} profileId
 * @param {object} updates - Fields to update
 * @returns {object|null} - Updated profile or null
 */
function updateProfile(projectId, profileId, updates) {
  if (!profileId) {
    console.error("[updateProfile] Profile ID is required");
    return null;
  }

  const project = MemoryStore.getProjectById(String(projectId));
  if (!project) {
    console.error(`[updateProfile] Project not found:  ${projectId}`);
    return null;
  }

  const profileIndex = project.profiles.findIndex((p) => String(p.id) === String(profileId));
  if (profileIndex === -1) {
    console.error(`[updateProfile] Profile not found: ${profileId}`);
    return null;
  }

  // Validate name if provided
  if (updates.name !== undefined) {
    const trimmedName = updates.name.trim();

    if (trimmedName.length < 3) {
      console.error("[updateProfile] Name must be at least 3 characters");
      return null;
    }

    if (!isProfileNameUnique(projectId, trimmedName, profileId)) {
      console.error(`[updateProfile] Profile name "${trimmedName}" already exists in this project`);
      return null;
    }

    updates.name = trimmedName;
  }

  project.profiles[profileIndex] = {
    ...project.profiles[profileIndex],
    ...updates,
    id: project.profiles[profileIndex].id, // preserve ID
    modifyDate: new Date().toISOString(),
  };

  MemoryStore.updateProject(String(projectId), project);
  console.log(`✅ Profile updated: ${project.profiles[profileIndex].name} (id: ${profileId})`);

  return project.profiles[profileIndex];
}

/**
 * Delete profile
 * @param {string} projectId
 * @param {string} profileId
 * @returns {boolean} - true if deleted, false otherwise
 */
function deleteProfile(projectId, profileId) {
  if (!profileId) {
    console.error("[deleteProfile] Profile ID is required");
    return false;
  }

  const project = MemoryStore.getProjectById(String(projectId));
  if (!project) {
    console.error(`[deleteProfile] Project not found: ${projectId}`);
    return false;
  }

  const initialLength = project.profiles.length;
  project.profiles = project.profiles.filter((p) => String(p.id) !== String(profileId));

  if (project.profiles.length < initialLength) {
    MemoryStore.updateProject(String(projectId), project);
    console.log(`✅ Profile deleted (id: ${profileId})`);
    return true;
  }

  console.error(`[deleteProfile] Profile not found:  ${profileId}`);
  return false;
}

export { getProfiles, getProfile, createProfile, updateProfile, deleteProfile, isProfileNameUnique };
