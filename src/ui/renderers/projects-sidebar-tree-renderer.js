/**
 * Projects Sidebar Tree Renderer
 * Renders the projects list in the sidebar (projects with optional models/profiles counts).
 * Pure renderer: no DOM access, no event binding.
 */

/**
 * @param {Array} projects
 * @param {object} options
 * @param {string|null} options.currentProjectId
 * @param {Record<string, boolean>} options.expandedProjects
 * @returns {string}
 */
export function renderProjectsSidebarTree(
  projects,
  { currentProjectId = null, expandedProjects = {} } = {}
) {
  if (!projects || !Array.isArray(projects) || projects.length === 0) {
    return '<div class="nav-tree-item-link no-projects-tree">Нет проектов</div>';
  }

  return projects
    .map((project) => {
      const isExpanded = !!expandedProjects?.[project.id];
      const isCurrentProject = String(currentProjectId ?? "") === String(project.id ?? "");

      return `
      <div class="project-tree-item">
        <div class="project-tree-header ${isCurrentProject ? "active" : ""}">
          <button class="project-expand-btn"
                  data-project-id="${project.id}"
                  data-action="toggle-project"
                  aria-expanded="${isExpanded ? "true" : "false"}">
            <span class="tree-expand-icon">${isExpanded ? "▼" : "▶"}</span>
          </button>
          <span class="project-name"
                data-project-id="${project.id}"
                data-action="select-project"
                title="${project.name}">
            📦 ${project.name}
          </span>
        </div>
        ${
          isExpanded
            ? `
          <div class="project-structure">
            ${
              project.models && project.models.length > 0
                ? `
              <div class="structure-section">
                <div class="structure-title">📋 Модели (${project.models.length})</div>
                <div class="structure-items">
                  ${project.models
                    .map(
                      (model) => `
                    <div class="tree-structure-item">
                      <div class="tree-structure-header projects-page-tree">
                        <div class="tree-structure-name projects-page-tree"
                             data-action="select-model"
                             data-project-id="${project.id}"
                             data-model-id="${model.id || ""}">
                          🔷 ${model.name || "Модель без названия"}
                        </div>
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
            ${
              project.profiles && project.profiles.length > 0
                ? `
              <div class="structure-section">
                <div class="structure-title">⚙️ Профили (${project.profiles.length})</div>
                <div class="structure-items">
                  ${project.profiles
                    .map(
                      (profile) => `
                    <div class="tree-structure-item">
                      <div class="tree-structure-header projects-page-tree">
                        <div class="tree-structure-name projects-page-tree"
                             data-action="select-profile"
                             data-project-id="${project.id}"
                             data-profile-id="${profile.id || ""}">
                          ⚙️ ${profile.name || "Профиль без названия"}
                        </div>
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
            ${
              (!project.models || project.models.length === 0) &&
              (!project.profiles || project.profiles.length === 0)
                ? '<div class="structure-empty">Нет моделей и профилей</div>'
                : ""
            }
          </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");
}
