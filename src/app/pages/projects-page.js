import {getAllProjects, getProjectById, getCurrentProject, appDataInit, createProject, updateProject, deleteProject,} from "../../services/project-service.js";
import { initModalSystem, bindModalTriggers, openModal, closeModal} from "../../ui/modal.js";
import { initSidebar } from "../../ui/sidebar/index.js";

// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  // инициализация модалок. она вешаестя на DOM, без данных.
  initModalSystem();
  bindModalTriggers(document);

  // инициализация сайдбара (только базовая, дерево проектов отдельно)
  initSidebar({})
});

console.log("Projects Page Module Loaded");
