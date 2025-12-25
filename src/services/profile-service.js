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
  return project ?  project.profiles || [] : [];
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
 * Create new Profile
 * @param {string} projectId
 * @param {object} payload - { name, description, version, legalState, accessRight }
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

  const newProfile = {
    id: generateUUID(),
    name: payload.name.trim(),
    description: payload.description ?  payload.description.trim() : "",
    version: payload.version || "0.1",
    relatedModels: [],
    createDate: new Date().toISOString(),
    modifyDate: new Date().toISOString(),
    legalState: payload.legalState || "project",
    accessRight: payload. accessRight || "readWrite",
    rootPackages: [],
  };

  if (! project.profiles) {
    project.profiles = [];
  }

  project.profiles.push(newProfile);
  MemoryStore.updateProject(String(projectId), project);

  console.log(`✅ Profile created:  ${newProfile.name} (id: ${newProfile.id})`);
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
    console.error(`[updateProfile] Project not found: ${projectId}`);
    return null;
  }

  const profileIndex = project.profiles.findIndex((p) => String(p.id) === String(profileId));
  if (profileIndex === -1) {
    console.error(`[updateProfile] Profile not found: ${profileId}`);
    return null;
  }

  // Validate name
  if (updates.name && ! updates.name.trim()) {
    console.error("[updateProfile] Name cannot be empty");
    return null;
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

  console.error(`[deleteProfile] Profile not found: ${profileId}`);
  return false;
}


export { getProfiles, getProfile, createProfile, updateProfile, deleteProfile };
