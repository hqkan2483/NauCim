import { initComparePage } from "./compare/compare-controller.js";

document.addEventListener("DOMContentLoaded", () => {
  initComparePage().catch((error) => {
    console.error("❌ Compare page init failed:", error);
    alert("Ошибка инициализации страницы сравнения: " + error.message);
  });
});
