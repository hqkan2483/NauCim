import { randomUUID } from "node:crypto";

function toOptionalString(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function newId(prefix) {
  return `${String(prefix)}_${randomUUID()}`;
}

export { newId, toOptionalString };
