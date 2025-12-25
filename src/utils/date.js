 function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU");
  } catch {
    return dateString;
  }
}

export { formatDate };
