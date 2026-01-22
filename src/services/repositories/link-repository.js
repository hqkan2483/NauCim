/**
 * Link Repository - Data Layer
 * Handles data operations for links via backend API.
 */

import { 
  updateGeneralizationLink as backendUpdateGeneralizationLink,
  updateAssociationLink as backendUpdateAssociationLink,
  createGeneralizationLink as backendCreateGeneralizationLink,
  createAssociationLink as backendCreateAssociationLink,
  deleteGeneralizationLink as backendDeleteGeneralizationLink,
  deleteAssociationLink as backendDeleteAssociationLink
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

export async function createGeneralizationLink(args) {
  return await backendCreateGeneralizationLink(args);
}

export async function createAssociationLink(args) {
  return await backendCreateAssociationLink(args);
}

/**
 * Delete GeneralizationLink and return full updated project.
 *
 * @param {object} args
 * @returns {Promise<object>} Full exported project
 */
export async function deleteGeneralizationLink(args) {
  return await backendDeleteGeneralizationLink(args);
}

/**
 * Delete AssociationLink and return full updated project.
 *
 * @param {object} args
 * @returns {Promise<object>} Full exported project
 */
export async function deleteAssociationLink(args) {
  return await backendDeleteAssociationLink(args);
}

