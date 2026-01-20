import { updateGeneralizationLink as repoUpdateGeneralizationLink } from "./repositories/link-repository.js";

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
