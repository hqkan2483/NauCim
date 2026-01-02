/**
 * Build title attribute with documentation and documentationRu
 * @param {string} documentation - Documentation text
 * @param {string} documentationRu - Russian documentation text
 * @param {string} name - Name fallback
 * @returns {string} Title attribute value
 */
function buildTitleAttribute(documentation, documentationRu, name) {
  if (documentation || documentationRu) {
    if (documentation && documentationRu) {
      return `${documentation}\n${documentationRu}`;
    }
    return documentation || documentationRu;
  }
  return name || '';
}

export { buildTitleAttribute };
