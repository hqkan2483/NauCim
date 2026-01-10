import { apiClient } from "./api-client.js";

export async function backendHealth() {
  return apiClient.get("/api/health");
}

export async function listProjects() {
  return apiClient.get("/api/projects");
}

export async function deleteProject(projectId) {
  return apiClient.del(`/api/projects/${encodeURIComponent(String(projectId))}`);
}

export async function importProject(project) {
  return apiClient.post("/api/import/project", project);
}

export async function exportProject(projectId) {
  return apiClient.get(`/api/export/project/${encodeURIComponent(String(projectId))}`);
}
