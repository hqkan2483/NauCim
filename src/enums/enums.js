function getLegalStateValue(key) {
  const legalStateList = [{ project: "В разработке" }];
  if (! key) return "—";
  for (const item of legalStateList) {
    if (item[key]) return item[key];
  }
  return "—";
}

function getAccessRightValue(key) {
  const accessRightList = [
    { readOnly: "Только чтение" },
    { readWrite: "Чтение и запись" },
    { custom: "Различный для объектов" },
  ];
  if (!key) return "—";
  for (const item of accessRightList) {
    if (item[key]) return item[key];
  }
  return "—";
}
export { getLegalStateValue, getAccessRightValue };
