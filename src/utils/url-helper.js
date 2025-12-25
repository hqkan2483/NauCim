/**
 * URL Helper - Parse and work with URL query parameters
 */

/**
 * Get query parameter from URL
 * @param {string} param - Parameter name
 * @returns {string|null} - Parameter value or null
 */
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

/**
 * Get all query parameters as object
 * @returns {Object} - Object with all query params
 */
function getAllQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const params = {};

  for (const [key, value] of urlParams) {
    params[key] = value;
  }

  return params;
}

/**
 * Set query parameter in URL (without page reload)
 * @param {string} param - Parameter name
 * @param {string} value - Parameter value
 */
function setQueryParam(param, value) {
  const url = new URL(window.location);
  url.searchParams.set(param, value);
  window.history.pushState({}, '', url);
}

/**
 * Remove query parameter from URL
 * @param {string} param - Parameter name
 */
function removeQueryParam(param) {
  const url = new URL(window.location);
  url.searchParams.delete(param);
  window.history.pushState({}, '', url);
}

export {
  getQueryParam,
  getAllQueryParams,
  setQueryParam,
  removeQueryParam
};
