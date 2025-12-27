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

function getRoleLabel(role) {
  const roleMap = {
    'child': 'Потомок (наследуется от целевого класса)',
    'parent': 'Родитель (является базовым для целевого класса)',
    'unspecified': 'Неопределённая',
    'source': 'Источник',
    'target': 'Цель'
  };
  
  return roleMap[role] || role || "—";
}


export { getLegalStateValue, getAccessRightsValue, getRoleLabel};
