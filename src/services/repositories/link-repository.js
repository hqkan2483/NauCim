/**
 * Link Repository - Data Layer
 * Handles data operations for links via backend API.
 */

import { 
  updateGeneralizationLink as backendUpdateGeneralizationLink,
  updateAssociationLink as backendUpdateAssociationLink
} from "../backend/link-backend-service.js";

/**
 * Update GeneralizationLink and return full updated project.
 *
 * @param {object} args
 * @returns {Promise<object>} Full exported project
 */
export async function updateGeneralizationLink(args) {
  return await backendUpdateGeneralizationLink(args);
}

/**
 * Update AssociationLink and return full updated project.
 *
 * @param {object} args
 * @returns {Promise<object>} Full exported project
 */
export async function updateAssociationLink(args) {
  return await backendUpdateAssociationLink(args);
}

