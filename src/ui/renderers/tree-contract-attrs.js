import { toIdString } from "../../utils/text-utils.js";

/**
 * Build canonical model/profile context attributes.
 * @param {{modelId?: string|number|null, profileId?: string|number|null}} ctx - Context ids.
 * @returns {string} HTML attributes.
 */
function buildContextDataAttrs(ctx = {}) {
  return `
    data-model-id="${toIdString(ctx.modelId)}"
    data-profile-id="${toIdString(ctx.profileId)}"
  `;
}

/**
 * Build canonical package node attributes per UI_DATA_ATTRIBUTES.md.
 * @param {Object} pkg - Package-like object (expects `id`).
 * @param {{modelId?: string|number|null, profileId?: string|number|null, parentPackageId?: string|number|null}} ctx - Context.
 * @returns {string} HTML attributes.
 */
function buildPackageContractAttrs(pkg, ctx = {}) {
  const packageId = toIdString(pkg?.id);
  const parentPackageId = toIdString(ctx.parentPackageId);
  const missingPkgIdMarker = packageId ? "" : 'data-contract-missing-package-id="1"';

  return `
    data-type="package"
    data-action="select-package"
    data-package-id="${packageId}"
    data-parent-package-id="${parentPackageId}"
    ${buildContextDataAttrs(ctx)}
    ${missingPkgIdMarker}
  `;
}

/**
 * Build canonical class node attributes per UI_DATA_ATTRIBUTES.md.
 *
 * Notes:
 * - `data-package-id` is the parent package id of the class.
 * - `packageId` can be provided via ctx for payloads where class doesn't carry it.
 *
 * @param {Object} cls - Class-like object.
 * @param {{modelId?: string|number|null, profileId?: string|number|null, packageId?: string|number|null}} ctx - Context.
 * @returns {string} HTML attributes.
 */
function buildClassContractAttrs(cls, ctx = {}) {
  const classId = toIdString(cls?.id);
  const packageId = toIdString(ctx.packageId ?? cls?.packageId);

  const isEnumeration =
    cls?.isEnumeration === true ||
    cls?.type === "Enumeration" ||
    cls?.type === "enumeration" ||
    String(cls?.stereotype || "").toLowerCase() === "enumeration";

  const isAbstract = cls?.isAbstract === true;
  const action = isEnumeration ? "select-enumeration" : "select-class";

  const missingPkgIdMarker = packageId ? "" : 'data-contract-missing-package-id="1"';

  return `
    data-type="class"
    data-action="${action}"
    data-class-id="${classId}"
    data-package-id="${packageId}"
    data-ref-model-id="${toIdString(cls?.refModelId)}"
    data-ref-model-item-id="${toIdString(cls?.refModelItemId)}"
    data-is-enumeration="${isEnumeration ? "1" : "0"}"
    data-is-abstract="${isAbstract ? "1" : "0"}"
    ${buildContextDataAttrs(ctx)}
    ${missingPkgIdMarker}
  `;
}

/**
 * Build canonical diagram node attributes per UI_DATA_ATTRIBUTES.md.
 * @param {Object} diagram - Diagram-like object.
 * @param {{modelId?: string|number|null, profileId?: string|number|null, packageId?: string|number|null}} ctx - Context.
 * @returns {string} HTML attributes.
 */
function buildDiagramContractAttrs(diagram, ctx = {}) {
  const diagramId = toIdString(diagram?.id);
  const packageId = toIdString(ctx.packageId ?? diagram?.packageId);
  const missingPkgIdMarker = packageId ? "" : 'data-contract-missing-package-id="1"';

  return `
    data-type="diagram"
    data-action="select-diagram"
    data-diagram-id="${diagramId}"
    data-package-id="${packageId}"
    ${buildContextDataAttrs(ctx)}
    ${missingPkgIdMarker}
  `;
}

/**
 * Build canonical attribute node attributes per UI_DATA_ATTRIBUTES.md.
 * @param {Object} attr - Attribute-like object.
 * @param {{modelId?: string|number|null, profileId?: string|number|null, classId?: string|number|null}} ctx - Context.
 * @returns {string} HTML attributes.
 */
function buildAttributeContractAttrs(attr, ctx = {}) {
  const attrId = toIdString(attr?.id);
  const classId = toIdString(attr?.classId ?? ctx.classId);

  return `
    data-type="attribute"
    data-action="select-attribute"
    data-attr-id="${attrId}"
    data-class-id="${classId}"
    ${buildContextDataAttrs(ctx)}
  `;
}

/**
 * Build canonical literal node attributes per UI_DATA_ATTRIBUTES.md.
 * @param {Object} literal - Literal-like object.
 * @param {{modelId?: string|number|null, profileId?: string|number|null, classId?: string|number|null}} ctx - Context.
 * @returns {string} HTML attributes.
 */
function buildLiteralContractAttrs(literal, ctx = {}) {
  const literalId = toIdString(literal?.id);
  const classId = toIdString(literal?.classId ?? ctx.classId);

  return `
    data-type="literal"
    data-action="select-literal"
    data-literal-id="${literalId}"
    data-class-id="${classId}"
    ${buildContextDataAttrs(ctx)}
  `;
}

/**
 * Build canonical link node attributes per UI_DATA_ATTRIBUTES.md.
 * @param {Object} link - Link-like object.
 * @param {{modelId?: string|number|null, profileId?: string|number|null, classId?: string|number|null}} ctx - Context.
 * @returns {string} HTML attributes.
 */
function buildLinkContractAttrs(link, ctx = {}) {
  const linkId = toIdString(link?.linkId ?? link?.id);
  const classId = toIdString(ctx.classId);

  return `
    data-type="link"
    data-action="select-link"
    data-link-id="${linkId}"
    data-class-id="${classId}"
    data-relation-kind="${toIdString(link?.relationKind)}"
    data-target-class-id="${toIdString(link?.targetClassId)}"
    ${buildContextDataAttrs(ctx)}
  `;
}

export {
  buildContextDataAttrs,
  buildPackageContractAttrs,
  buildClassContractAttrs,
  buildDiagramContractAttrs,
  buildAttributeContractAttrs,
  buildLiteralContractAttrs,
  buildLinkContractAttrs,
};