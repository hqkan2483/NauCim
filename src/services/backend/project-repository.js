import { isBackendEnabled } from "../persistence/persistence-config.js";
import {
  listProjects as backendListProjects,
  exportProject as backendExportProject,
  importProject as backendImportProject,
  deleteProject as backendDeleteProject,
} from "./project-backend-service.js";

// Thin façade to keep call sites stable.
export const ProjectRepository = {
  isBackendEnabled,
  list: () => backendListProjects(),
  load: (projectId) => backendExportProject(projectId),
  save: (project) => backendImportProject(project),
  import: (project) => backendImportProject(project),
  export: (projectId) => backendExportProject(projectId),
  delete: (projectId) => backendDeleteProject(projectId),
};
