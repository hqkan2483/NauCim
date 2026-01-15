/**
 * Project Validator - Business Logic Layer
 * Validation logic for projects
 */

/**
 * Validate project name
 * @param {string} name - Project name
 * @returns {{valid: boolean, error?: string}}
 */
export function validateProjectName(name) {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "Name is required" };
  }

  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: "Name must be at least 3 characters" };
  }

  return { valid: true };
}

/**
 * Validate project payload for creation
 * @param {Object} payload - { name, description?, version? }
 * @returns {{valid: boolean, error?: string}}
 */
export function validateCreateProjectPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Invalid payload" };
  }

  const nameValidation = validateProjectName(payload.name);
  if (!nameValidation.valid) {
    return nameValidation;
  }

  return { valid: true };
}

/**
 * Validate project payload for update
 * @param {Object} payload - Update fields
 * @returns {{valid: boolean, error?: string}}
 */
export function validateUpdateProjectPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Invalid payload" };
  }

  if (payload.name !== undefined) {
    const nameValidation = validateProjectName(payload.name);
    if (!nameValidation.valid) {
      return nameValidation;
    }
  }

  return { valid: true };
}
