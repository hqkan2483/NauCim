import { initProfileEditorPage } from "./profile-editor/profile-editor-controller.js";

document.addEventListener("DOMContentLoaded", () => {
  initProfileEditorPage().catch((error) => {
    console.error("❌ Profile editor init failed:", error);
    alert("Ошибка инициализации редактора профиля: " + error.message);
  });
});
