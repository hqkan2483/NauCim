/**
 * Profile Repository - Data Layer
 * Handles all data operations for profiles via backend API
 */

import {
  listProfiles as backendListProfiles,
  getProfile as backendGetProfile,
  getProfileHeader as backendGetProfileHeader,
  createProfile as backendCreateProfile,
  updateProfile as backendUpdateProfile,
  deleteProfile as backendDeleteProfile,
} from "../backend/profile-backend-service.js";

/**
 * Get all profiles for a project
 * @param {string} projectId
 * @returns {Promise<Array>} Array of profiles
 */
export async function getProfiles(projectId) {
  if (!projectId) return [];
  try {
    const profiles = await backendListProfiles(projectId);
    return Array.isArray(profiles) ? profiles : [];
  } catch (error) {
    console.error(`[ProfileRepository] Failed to fetch profiles for project ${projectId}:`, error);
    throw error;
  }
}

/**
 * Get single profile by ID
 * @param {string} profileId
 * @returns {Promise<Object|null>} Profile object or null
 */
export async function getProfile(profileId) {
  if (!profileId) return null;
  try {
    const profile = await backendGetProfile(profileId);
    return profile || null;
  } catch (error) {
    if (error.status === 404) return null;
    console.error(`[ProfileRepository] Failed to fetch profile ${profileId}:`, error);
    throw error;
  }
}

/**
 * Get profile header by ID (everything except rootPackages)
 * @param {string} profileId
 * @returns {Promise<Object|null>}
 */
export async function getProfileHeader(profileId) {
  if (!profileId) return null;
  try {
    const profile = await backendGetProfileHeader(profileId);
    return profile || null;
  } catch (error) {
    if (error.status === 404) return null;
    console.error(`[ProfileRepository] Failed to fetch profile header ${profileId}:`, error);
    throw error;
  }
}

/**
 * Create new profile
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Created profile
 */
export async function createProfile(profileData) {
  try {
    const created = await backendCreateProfile(profileData);
    return created;
  } catch (error) {
    console.error("[ProfileRepository] Failed to create profile:", error);
    throw error;
  }
}

/**
 * Update profile
 * @param {string} profileId
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated profile
 */
export async function updateProfile(profileId, updates) {
  if (!profileId) throw new Error("Profile ID is required");
  try {
    const updated = await backendUpdateProfile(profileId, updates);
    return updated;
  } catch (error) {
    console.error(`[ProfileRepository] Failed to update profile ${profileId}:`, error);
    throw error;
  }
}

/**
 * Delete profile
 * @param {string} profileId
 * @returns {Promise<boolean>} true if deleted
 */
export async function deleteProfile(profileId) {
  if (!profileId) return false;
  try {
    await backendDeleteProfile(profileId);
    return true;
  } catch (error) {
    if (error.status === 404) return false;
    console.error(`[ProfileRepository] Failed to delete profile ${profileId}:`, error);
    throw error;
  }
}
