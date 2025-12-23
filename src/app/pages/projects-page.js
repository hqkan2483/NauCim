import {getAllProjects, getProjectById, getCurrentProject, appDataInit, createProject, updateProject, deleteProject,} from "../../services/project-service.js";
import { initModalSystem, bindModalTriggers, openModal, closeModal} from "../../ui/modal.js";

// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  // инициализация модалок. она вешаестя на DOM, без данных.
  initModalSystem();
  bindModalTriggers(document);

  

})

console.log("Projects Page Module Loaded");
