/**
 * Modal Loader - Dynamically load modal HTML templates
 */

const MODAL_TEMPLATES_PATH = "./src/ui/templates/modals/";

/**
 * Load modal HTML from template file
 * @param {string} modalName - Name of the modal (e.g., 'new-project-modal')
 * @returns {Promise<boolean>} - true if loaded successfully
 */
export async function loadModal(modalName) {
  try {
    const response = await fetch(`${MODAL_TEMPLATES_PATH}${modalName}.html`);

    if (!response.ok) {
      console.error(`❌ Failed to load modal:  ${modalName} (${response.status})`);
      return false;
    }

    const html = await response.text();

    // Insert modal HTML into body
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html.trim();

    const modalElement = tempDiv.firstElementChild;
    if (modalElement) {
      // Check if modal already exists
      const existingModal = document.getElementById(modalElement.id);
      if (existingModal) {
        return true;
      }

      document.body.appendChild(modalElement);
      return true;
    } else {
      console.error(`❌ Invalid modal HTML: ${modalName}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error loading modal ${modalName}:`, error);
    return false;
  }
}

/**
 * Load multiple modals
 * @param {string[]} modalNames - Array of modal names
 * @returns {Promise<boolean>} - true if all loaded successfully
 */
export async function loadModals(modalNames) {
  const promises = modalNames.map((name) => loadModal(name));
  const results = await Promise.all(promises);
  return results.every((result) => result === true);
}
