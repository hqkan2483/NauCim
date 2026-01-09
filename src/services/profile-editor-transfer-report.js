/**
 * Formats transfer report into a human-readable string.
 * UI decides how to present it (alert/toast/modal).
 */
export function formatTransferReport(
  report,
  { maxLines = 50, maxNotFound = 10 } = {}
) {
  if (!report) return "";

  const transferred = Array.isArray(report.transferred) ? report.transferred : [];
  const skipped = Array.isArray(report.skipped) ? report.skipped : [];
  const notFound = Array.isArray(report.notFound) ? report.notFound : [];

  const lines = [];

  lines.push("Перенос завершён.");
  lines.push(`Перенесено: ${transferred.length}`);

  transferred.slice(0, maxLines).forEach((t) => lines.push(`  + ${t}`));
  if (transferred.length > maxLines) {
    lines.push(`  ... и ещё ${transferred.length - maxLines}`);
  }

  lines.push("");
  lines.push(`Пропущено (совпадение по имени): ${skipped.length}`);
  skipped.slice(0, maxLines).forEach((s) => {
    const label = s?.path || s?.name || "(без имени)";
    const kind = s?.kind ? `${s.kind}: ` : "";
    const reason = s?.reason ? ` — ${s.reason}` : "";
    lines.push(`  - ${kind}${label}${reason}`);
  });
  if (skipped.length > maxLines) {
    lines.push(`  ... и ещё ${skipped.length - maxLines}`);
  }

  if (notFound.length > 0) {
    lines.push("");
    lines.push(`Не найдены по ключу: ${notFound.length}`);
    notFound
      .slice(0, maxNotFound)
      .forEach((k) => lines.push(`  ? ${k}`));
    if (notFound.length > maxNotFound) {
      lines.push(`  ... и ещё ${notFound.length - maxNotFound}`);
    }
  }

  return lines.join("\n");
}
