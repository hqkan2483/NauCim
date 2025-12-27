/**
 * Helper:  Get legal state value
 */
function getLegalStateValue(key) {
  const legalStateList = [
    { project: "В разработке" },
    { draft: "Черновик" },
    { approved: "Утверждено" },
    { deprecated: "Устарело" }
  ];
  if (! key) return "—";
  for (const item of legalStateList) {
    if (item[key]) return item[key];
  }
  return "—";
}

/**
 * Helper: Get access rights value (updated for accessRights)
 */
function getAccessRightsValue(key) {
  const accessRightsList = [
    { readOnly: "Только чтение" },
    { readWrite: "Чтение и запись" },
    { custom: "Различный по объектам" }
  ];
  if (!key) return "—";
  for (const item of accessRightsList) {
    if (item[key]) return item[key];
  }
  return "—";
}

export { getLegalStateValue, getAccessRightsValue };
