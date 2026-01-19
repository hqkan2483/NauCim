import { getProjectById, appDataInit } from "../../services/project-service.js";
import {
  getModels,
  getModel,
  getModelHeader,
  deleteModel,
} from "../../services/model-service.js";
import {
  getProfiles,
  getProfile,
  getProfileHeader,
  deleteProfile,
} from "../../services/profile-service.js";
import { getQueryParam } from "../../utils/url-helper.js";
import { initModalSystem, bindModalTriggers } from "../../ui/modal.js";
import { loadModals } from "../../ui/modal-loader.js";
import {
  initSidebarResize,
  initSidebarToggle,
  restoreSidebarState,
} from "../../ui/sidebar/index.js";
import {
  renderModelDetails,
  renderModelControls,
} from "../../ui/renderers/model-details-renderer.js";
import {
  renderProfileDetails,
  renderProfileControls,
} from "../../ui/renderers/profile-details-renderer.js";
import {
  initModelModal,
  clearNewModelModal,
  openEditModelModal,
} from "../../ui/components/model-modal.js";
import {
  initProfileModal,
  clearNewProfileModal,
  openEditProfileModal,
} from "../../ui/components/profile-modal.js";
import {
  initModelImportModal,
  openModelImportModal,
  initProfileImportModal,
  openProfileImportModal,
} from "../../ui/components/import-rootpackages-modal.js";
import {
  initAttributeModal,
  openEditAttributeModal,
  openCreateAttributeModal,
} from "../../ui/components/attribute-modal.js";
import {
  initLinkModal,
  openEditLinkModal,
} from "../../ui/components/link-modal.js";
import {
  renderProjectTree,
  toggleTreeItem,
  toggleProject,
} from "../../ui/renderers/project-tree-renderer.js";
import { renderPackageDetails } from "../../ui/renderers/package-details-renderer.js";
import { renderClassDetails } from "../../ui/renderers/class-details-renderer.js";
import { initDiagramMode } from "./project-details/diagram-mode.js";
import { showToast } from "../../ui/components/toast.js";
import {
  updateModelPackage as updateModelPackageInBackend,
  updateProfilePackage as updateProfilePackageInBackend,
  createModelSubpackage as createModelSubpackageInBackend,
  createProfileSubpackage as createProfileSubpackageInBackend,
} from "../../services/package-service.js";
import {
  updateModelClass as updateModelClassInBackend,
  updateProfileClass as updateProfileClassInBackend,
  createModelClass as createModelClassInBackend,
  createProfileClass as createProfileClassInBackend,
  invalidateModelClassesSummary,
  invalidateProfileClassesSummary,
} from "../../services/class-service.js";
import {
  createModelDiagram as createModelDiagramInBackend,
  createProfileDiagram as createProfileDiagramInBackend,
} from "../../services/diagram-service.js";
import { initPackageTreeContextMenu } from "../../ui/components/package-context-menu.js";
import {
  initCreatePackageModal,
  openCreatePackageModal,
} from "../../ui/components/create-package-modal.js";
import {
  initCreateClassModal,
  openCreateClassModal,
} from "../../ui/components/create-class-modal.js";
import {
  initCreateDiagramModal,
  openCreateDiagramModal,
} from "../../ui/components/create-diagram-modal.js";
import {
  getSubpackageNameSet,
  getClassNameSet,
  getDiagramNameSet,
  findSubpackageIdByName,
  findClassIdByName,
  findDiagramIdByName,
} from "../../utils/project-traversal.js";
import {
  updateModelAttribute as updateModelAttributeInBackend,
  updateProfileAttribute as updateProfileAttributeInBackend,
  createModelAttribute as createModelAttributeInBackend,
  createProfileAttribute as createProfileAttributeInBackend,
} from "../../services/attribute-service.js";

// ============================================================
// STATE
// ============================================================
let currentProjectId = null;
let selectedModelId = null;
let selectedProfileId = null;
let selectedTreeSnapshot = null;
let originalItemData = null;
let lastClassTabName = null;

// Diagram mode controller (Step 1)
let diagramMode = null;


// ============================================================
// INIT
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  await appDataInit();
  currentProjectId = getQueryParam("id");

  await loadModals([
    "new-model-modal",
    "edit-model-header-modal",
    "new-profile-modal",
    "edit-profile-header-modal",
    "import-model-modal",
    "import-profile-modal",
    "edit-attribute-modal",
    "data-type-picker-modal",
    "generalization-link-modal",
    "create-package-modal",
    "create-class-modal",
    "create-diagram-modal",
  ]);

  initModalSystem();
  bindModalTriggers(document);
  restoreSidebarState();
  initSidebarToggle();
  initSidebarResize();

  diagramMode = initDiagramMode({
    hideModelContainer,
    hideProfileContainer,
    showItemContainer,
    clearItemDetailsContent,
    getSelectedTreeType,
  });

  if (currentProjectId) {
    initModelModal(currentProjectId, {
      onCreate: async (newModel) => {
        await renderModelsContainer();
        await renderProjectTreeSidebar();
        await selectModel(newModel.id);
      },
      onUpdate: async (updatedModel) => {
        if (updatedModel?.id) selectedModelId = updatedModel.id;
        await refreshSelectedModelUI();
      },
    });

    initProfileModal(currentProjectId, {
      onCreate: async (newProfile) => {
        await renderProfilesContainer();
        await renderProjectTreeSidebar();
        await selectProfile(newProfile.id);
      },
      onUpdate: async (updatedProfile) => {
        if (updatedProfile?.id) selectedProfileId = updatedProfile.id;
        await refreshSelectedProfileUI();
      },
    });

    initModelImportModal(currentProjectId, {
      onImported: async (project, modelId) => {
        // Preserve selection + ensure model panel stays visible
        selectedModelId = modelId;
        selectedProfileId = null;
        selectedTreeSnapshot = { type: "model", modelId };

        await renderModelsContainer(project);
        await renderProfilesContainer(project);
        await renderProjectTreeSidebar(project);
        await refreshSelectedModelUI();

        if (diagramMode?.isEnabled()) {
          clearItemDetailsContent();
          diagramMode.sync({ clearItem: true });
        } else {
          hideItemContainer();
          showModelContainer();
          showProfileContainer();
        }
      },
    });

    initProfileImportModal(currentProjectId, {
      onImported: async (project, profileId) => {
        selectedProfileId = profileId;
        selectedModelId = null;
        selectedTreeSnapshot = { type: "profile", profileId };

        await renderModelsContainer(project);
        await renderProfilesContainer(project);
        await renderProjectTreeSidebar(project);
        await refreshSelectedProfileUI();

        if (diagramMode?.isEnabled()) {
          clearItemDetailsContent();
          diagramMode.sync({ clearItem: true });
        } else {
          hideItemContainer();
          showModelContainer();
          showProfileContainer();
        }
      },
    });

    initAttributeModal(currentProjectId, {
      onUpdate: async (attrId, updates) => {
        const project = await getProjectById(currentProjectId);
        if (!project) return;

        const tabToRestore = getActiveClassTabName() || lastClassTabName;

        const found = findAttributeWithParent(project, attrId);
        if (!found) return;

        const context = found.context;
        const modelId = found.modelId || "";
        const profileId = found.profileId || "";
        const classId = found.cls?.id;
        if (!classId) return;

        const originalAttrSnapshot = JSON.parse(JSON.stringify(found.attr));
        const originalClsSnapshot = JSON.parse(JSON.stringify(found.cls));

        try {
          const payload = {
            id: attrId,
            name: updates.name,
            dataTypeId: updates.dataTypeId,
            stereotype: updates.stereotype,
            multiplicity: updates.multiplicity,
            documentation: updates.documentation,
            documentationRu: updates.documentationRu,
            details: updates.details,
            initialValue: updates.initialValue,

            // Preserve external refs if present
            refModelId: found.attr?.refModelId ?? null,
            refModelItemId: found.attr?.refModelItemId ?? null,
          };

          const updatedProject =
            context === "model"
              ? await updateModelAttributeInBackend(
                  currentProjectId,
                  modelId,
                  attrId,
                  payload
                )
              : await updateProfileAttributeInBackend(
                  currentProjectId,
                  profileId,
                  attrId,
                  payload
                );

          if (!updatedProject) {
            throw new Error("Backend did not return updated project");
          }

          selectedTreeSnapshot = {
            type: "class",
            classId,
            modelId: context === "model" ? modelId : null,
            profileId: context === "profile" ? profileId : null,
            packageId: null,
          };

          await renderProjectTreeSidebar(updatedProject);
          const chain = findClassParentChain(
            updatedProject,
            classId,
            modelId,
            profileId,
            context
          );
          expandTreePath(chain);
          restoreSelectedTreeItemInTree();

          const updatedCls = findClassById(
            updatedProject,
            classId,
            modelId,
            profileId,
            context
          );

          const itemDetailsContent = document.getElementById("item-details-content");
          if (itemDetailsContent && updatedCls) {
            const clsView = {
              ...updatedCls,
              modelId: modelId || "",
              profileId: profileId || "",
            };
            originalItemData = JSON.parse(JSON.stringify(clsView));

            itemDetailsContent.innerHTML = renderClassDetails(clsView, {
              viewMode: getItemDetailsViewMode(),
            });
            restoreClassTab(tabToRestore);
          }

          showToast("Атрибут сохранён", { type: "success" });
        } catch (error) {
          console.error("[attributeModal.onUpdate] Save failed:", error);
          const msg = error?.message ? String(error.message) : "Ошибка сохранения";
          showToast(`Ошибка сохранения атрибута: ${msg}`, { type: "error" });

          // Restore class UI to original (no local mutation should have happened).
          const itemDetailsContent = document.getElementById("item-details-content");
          if (itemDetailsContent) {
            const clsView = {
              ...originalClsSnapshot,
              modelId: modelId || "",
              profileId: profileId || "",
            };
            itemDetailsContent.innerHTML = renderClassDetails(clsView, {
              viewMode: getItemDetailsViewMode(),
            });
            restoreClassTab(tabToRestore);
          }

          // Re-open modal so user does not lose edits context.
          const existingNames = (originalClsSnapshot?.attributes || [])
            .filter((a) => String(a?.id) !== String(attrId))
            .map((a) => a?.name)
            .filter(Boolean);

          openEditAttributeModal({
            ...originalAttrSnapshot,
            ...updates,
            modelId: modelId || null,
            profileId: profileId || null,
          }, { existingNames });
        }
      },

      onCreate: async ({ classId, context, updates }) => {
        const project = await getProjectById(currentProjectId);
        if (!project) return;

        const tabToRestore = "item-attributes";

        const foundClass = findClassWithContext(project, classId);
        if (!foundClass) return;

        const modelId = foundClass.modelId || context?.modelId || "";
        const profileId = foundClass.profileId || context?.profileId || "";

        try {
          const payload = {
            name: updates.name,
            dataTypeId: updates.dataTypeId,
            stereotype: updates.stereotype,
            multiplicity: updates.multiplicity,
            documentation: updates.documentation,
            documentationRu: updates.documentationRu,
            details: updates.details,
            initialValue: updates.initialValue,
          };

          const updatedProject = modelId
            ? await createModelAttributeInBackend(
                currentProjectId,
                modelId,
                classId,
                payload
              )
            : await createProfileAttributeInBackend(
                currentProjectId,
                profileId,
                classId,
                payload
              );

          if (!updatedProject) {
            throw new Error("Backend did not return updated project");
          }

          selectedTreeSnapshot = {
            type: "class",
            classId,
            modelId: modelId || null,
            profileId: profileId || null,
            packageId: null,
          };

          await renderProjectTreeSidebar(updatedProject);
          const chain = findClassParentChain(
            updatedProject,
            classId,
            modelId,
            profileId,
            modelId ? "model" : "profile"
          );
          expandTreePath(chain);
          restoreSelectedTreeItemInTree();

          const updatedCls = findClassById(
            updatedProject,
            classId,
            modelId,
            profileId,
            modelId ? "model" : "profile"
          );

          const itemDetailsContent = document.getElementById("item-details-content");
          if (itemDetailsContent && updatedCls) {
            const clsView = {
              ...updatedCls,
              modelId: modelId || "",
              profileId: profileId || "",
            };
            originalItemData = JSON.parse(JSON.stringify(clsView));
            itemDetailsContent.innerHTML = renderClassDetails(clsView, {
              viewMode: getItemDetailsViewMode(),
            });
            restoreClassTab(tabToRestore);
          }

          showToast("Атрибут добавлен", { type: "success" });
        } catch (error) {
          console.error("[attributeModal.onCreate] Create failed:", error);
          const msg = error?.message ? String(error.message) : "Ошибка добавления";
          showToast(`Ошибка добавления атрибута: ${msg}`, { type: "error" });
        }
      },
    });

    initLinkModal(currentProjectId, {
      onUpdate: async (linkId, classId, updates) => {
        const project = await getProjectById(currentProjectId);
        if (!project) return;

        const tabToRestore = getActiveClassTabName() || lastClassTabName;

        const found = findLinkWithParent(project, classId, linkId);
        if (!found) return;

        Object.assign(found.link, updates);

        const itemDetailsContent = document.getElementById("item-details-content");
        if (itemDetailsContent) {
          itemDetailsContent.innerHTML = renderClassDetails(found.cls, {
            viewMode: getItemDetailsViewMode(),
          });
          restoreClassTab(tabToRestore);
        }
      },
    });

    /**
     * Modal: create nested package (subpackage).
     * Persists through service layer; backend returns full updated project.
     */
    initCreatePackageModal(currentProjectId, {
      onCreate: async ({ parentPackageId, modelId = "", profileId = "", payload }) => {
        const context = modelId && modelId !== "" ? "model" : "profile";

        const updatedProject =
          context === "model"
            ? await createModelSubpackageInBackend(
                currentProjectId,
                modelId,
                parentPackageId,
                payload
              )
            : await createProfileSubpackageInBackend(
                currentProjectId,
                profileId,
                parentPackageId,
                payload
              );

        if (!updatedProject) {
          throw new Error("Backend did not return updated project");
        }

        const newPackageId = findSubpackageIdByName(updatedProject, {
          context,
          modelId,
          profileId,
          parentPackageId,
          name: payload?.name,
        });

        if (!newPackageId) {
          throw new Error("Не удалось найти созданный пакет в ответе сервера");
        }

        selectedTreeSnapshot = {
          type: "package",
          packageId: newPackageId,
          modelId: context === "model" ? modelId : null,
          profileId: context === "profile" ? profileId : null,
          classId: null,
          diagramId: null,
        };

        await renderProjectTreeSidebar(updatedProject);
        const chain = findPackageParentChain(
          updatedProject,
          newPackageId,
          modelId,
          profileId,
          context
        );
        expandTreePath(chain);
        restoreSelectedTreeItemInTree();

        await handleSelectPackage(newPackageId, modelId, profileId);
      },
    });

    /**
     * Modal: create class inside a package.
     * Persists through service layer; backend returns full updated project.
     */
    initCreateClassModal(currentProjectId, {
      onCreate: async ({ packageId, modelId = "", profileId = "", payload }) => {
        const context = modelId && modelId !== "" ? "model" : "profile";

        const updatedProject =
          context === "model"
            ? await createModelClassInBackend(
                currentProjectId,
                modelId,
                packageId,
                payload
              )
            : await createProfileClassInBackend(
                currentProjectId,
                profileId,
                packageId,
                payload
              );

        if (!updatedProject) {
          throw new Error("Backend did not return updated project");
        }

        const newClassId = findClassIdByName(updatedProject, {
          context,
          modelId,
          profileId,
          name: payload?.name,
        });

        if (!newClassId) {
          throw new Error("Не удалось найти созданный класс в ответе сервера");
        }

        selectedTreeSnapshot = {
          type: "class",
          classId: newClassId,
          modelId: context === "model" ? modelId : null,
          profileId: context === "profile" ? profileId : null,
          packageId: null,
          diagramId: null,
        };

        await renderProjectTreeSidebar(updatedProject);
        const chain = findClassParentChain(
          updatedProject,
          newClassId,
          modelId,
          profileId,
          context
        );
        expandTreePath(chain);
        restoreSelectedTreeItemInTree();

        await handleSelectClass(newClassId, modelId, profileId);
      },
    });

    /**
     * Modal: create diagram inside a package.
     * Persists through service layer; backend returns full updated project.
     */
    initCreateDiagramModal(currentProjectId, {
      onCreate: async ({ packageId, modelId = "", profileId = "", payload }) => {
        const context = modelId && modelId !== "" ? "model" : "profile";

        const updatedProject =
          context === "model"
            ? await createModelDiagramInBackend(
                currentProjectId,
                modelId,
                packageId,
                payload
              )
            : await createProfileDiagramInBackend(
                currentProjectId,
                profileId,
                packageId,
                payload
              );

        if (!updatedProject) {
          throw new Error("Backend did not return updated project");
        }

        const newDiagramId = findDiagramIdByName(updatedProject, {
          context,
          modelId,
          profileId,
          name: payload?.diagramName,
        });

        if (!newDiagramId) {
          throw new Error("Не удалось найти созданную диаграмму в ответе сервера");
        }

        selectedTreeSnapshot = {
          type: "diagram",
          diagramId: newDiagramId,
          modelId: context === "model" ? modelId : null,
          profileId: context === "profile" ? profileId : null,
          packageId: null,
          classId: null,
        };

        await renderProjectTreeSidebar(updatedProject);
        const chain = findDiagramParentChain(
          updatedProject,
          newDiagramId,
          modelId,
          profileId,
          context
        );
        expandTreePath(chain);
        restoreSelectedTreeItemInTree();

        await handleSelectDiagram(newDiagramId, modelId, profileId);
      },
    });
  }

  bindEvents();
  await checkProject();
  diagramMode?.restoreFromStorage();
});

// ============================================================
// EVENT BINDINGS
// ============================================================
function bindEvents() {
  const goToProjectsBtn = document.getElementById("go-to-projects-btn");
  if (goToProjectsBtn) {
    goToProjectsBtn.addEventListener("click", () => {
      window.location.href = "projects.html";
    });
  }

  const toggleDiagramBtn = document.getElementById("toggle-diagram-mode");
  if (toggleDiagramBtn) {
    toggleDiagramBtn.addEventListener("click", () => {
      diagramMode?.toggle();
      // If a class/package is already selected, re-render it in the new mode.
      rerenderSelectedItemDetailsForCurrentMode().catch(err => console.error("Failed to rerender:", err));
    });
  }

  document.addEventListener("modal:beforeopen", (e) => {
    const modalId = e.detail.modalId;
    if (modalId === "new-model-modal") {
      // todo: универсальная функция для очистки модальных форм
      clearNewModelModal();
    } else if (modalId === "new-profile-modal") {
      clearNewProfileModal();
    }
  });

  const projectStructureEl = document.getElementById(
    "current-project-structure"
  );
  if (projectStructureEl) {
    // Right-click context menu on package nodes.
    initPackageTreeContextMenu(projectStructureEl, {
      onCreatePackage: async ({ packageId, modelId = "", profileId = "" }) => {
        const project = await getProjectById(currentProjectId);
        if (!project) return;

        const context = modelId && modelId !== "" ? "model" : "profile";
        const existingSiblingNamesNormalized = getSubpackageNameSet(project, {
          context,
          modelId,
          profileId,
          parentPackageId: packageId,
        });

        openCreatePackageModal({
          parentPackageId: packageId,
          modelId,
          profileId,
          existingSiblingNamesNormalized,
        });
      },
      onCreateClass: async ({ packageId, modelId = "", profileId = "" }) => {
        const project = await getProjectById(currentProjectId);
        if (!project) return;

        const context = modelId && modelId !== "" ? "model" : "profile";
        const existingClassNamesNormalized = getClassNameSet(project, {
          context,
          modelId,
          profileId,
        });

        openCreateClassModal({
          packageId,
          modelId,
          profileId,
          existingClassNamesNormalized,
        });
      },
      onCreateDiagram: async ({ packageId, modelId = "", profileId = "" }) => {
        const project = await getProjectById(currentProjectId);
        if (!project) return;

        const context = modelId && modelId !== "" ? "model" : "profile";
        const existingDiagramNamesNormalized = getDiagramNameSet(project, {
          context,
          modelId,
          profileId,
        });

        openCreateDiagramModal({
          packageId,
          modelId,
          profileId,
          existingDiagramNamesNormalized,
        });
      },
      onDeletePackage: async () => {
        showToast("Удаление пакетов будет реализовано позже.", { type: "info" });
      },
    });

    projectStructureEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      // Toggle project
      const toggleProjectBtn = target.closest("[data-action='toggle-project']");
      if (toggleProjectBtn) {
        const projectId = toggleProjectBtn.getAttribute("data-project-id");
        if (projectId) {
          toggleProject(projectId);
          renderProjectTreeSidebar().catch(err => console.error("Failed to render tree:", err));
        }
        return;
      }

      // Toggle tree item
      const toggleItemBtn = target.closest("[data-action='toggle-tree-item']");
      if (toggleItemBtn) {
        const itemId = toggleItemBtn.getAttribute("data-item-id");
        if (itemId) {
          toggleTreeItem(itemId);
          renderProjectTreeSidebar().catch(err => console.error("Failed to render tree:", err));
        }
        return;
      }

      // Select model
      const selectModelEl = target.closest("[data-action='select-model']");
      if (selectModelEl) {
        setSelectedTreeItem(selectModelEl);
        const modelId = selectModelEl.getAttribute("data-model-id");
        if (modelId) selectModel(modelId);
        return;
      }

      // Select profile
      const selectProfileEl = target.closest("[data-action='select-profile']");
      if (selectProfileEl) {
        setSelectedTreeItem(selectProfileEl);
        const profileId = selectProfileEl.getAttribute("data-profile-id");
        if (profileId) selectProfile(profileId);
        return;
      }

      // Select package
      const selectPackageEl = target.closest("[data-action='select-package']");
      if (selectPackageEl) {
        setSelectedTreeItem(selectPackageEl);
        const packageId = selectPackageEl.getAttribute("data-package-id");
        const modelId = selectPackageEl.getAttribute("data-model-id");
        const profileId = selectPackageEl.getAttribute("data-profile-id");
        if (packageId) handleSelectPackage(packageId, modelId, profileId);
        return;
      }

      // Select diagram
      const selectDiagramEl = target.closest("[data-action='select-diagram']");
      if (selectDiagramEl) {
        setSelectedTreeItem(selectDiagramEl);
        const diagramId = selectDiagramEl.getAttribute("data-diagram-id");
        const modelId = selectDiagramEl.getAttribute("data-model-id");
        const profileId = selectDiagramEl.getAttribute("data-profile-id");
        if (diagramId) void handleSelectDiagram(diagramId, modelId, profileId);
        return;
      }

      // Select class
      const selectClassEl = target.closest("[data-action='select-class']");
      if (selectClassEl) {
        setSelectedTreeItem(selectClassEl);
        const classId = selectClassEl.getAttribute("data-class-id");
        const modelId = selectClassEl.getAttribute("data-model-id");
        const profileId = selectClassEl.getAttribute("data-profile-id");
        if (classId) handleSelectClass(classId, modelId, profileId);
        return;
      }

      // ✅ NEW: Select enumeration (class with type Enumeration)
      const selectEnumerationEl = target.closest(
        "[data-action='select-enumeration']"
      );
      if (selectEnumerationEl) {
        setSelectedTreeItem(selectEnumerationEl);
        const classId = selectEnumerationEl.getAttribute("data-class-id");
        const modelId = selectEnumerationEl.getAttribute("data-model-id");
        const profileId = selectEnumerationEl.getAttribute("data-profile-id");
        if (classId) handleSelectEnumeration(classId, modelId, profileId);
        return;
      }

      // Select attribute
      const selectAttributeEl = target.closest(
        "[data-action='select-attribute']"
      );
      if (selectAttributeEl) {
        const attrId = selectAttributeEl.getAttribute("data-attr-id");
        const parentClassId = selectAttributeEl.getAttribute("data-parent-class-id");
        const modelId = selectAttributeEl.getAttribute("data-model-id");
        const profileId = selectAttributeEl.getAttribute("data-profile-id");
        if (attrId) handleSelectAttribute(attrId, parentClassId, modelId, profileId);
        return;
      }

      // Select link
      const selectLinkEl = target.closest("[data-action='select-link']");
      if (selectLinkEl) {
        const linkId = selectLinkEl.getAttribute("data-link-id");
        const parentClassId = selectLinkEl.getAttribute("data-parent-class-id");
        const modelId = selectLinkEl.getAttribute("data-model-id");
        const profileId = selectLinkEl.getAttribute("data-profile-id");
        if (linkId) handleSelectLink(linkId, parentClassId, modelId, profileId);
        return;
      }

      // ✅ NEW: Select literal
      const selectLiteralEl = target.closest("[data-action='select-literal']");
      if (selectLiteralEl) {
        const literalId = selectLiteralEl.getAttribute("data-literal-id");
        const parentClassId = selectLiteralEl.getAttribute("data-parent-class-id");
        const modelId = selectLiteralEl.getAttribute("data-model-id");
        const profileId = selectLiteralEl.getAttribute("data-profile-id");
        if (literalId) handleSelectLiteral(literalId, parentClassId, modelId, profileId);
        return;
      }
    });
  }

  // Models list
  const modelsListEl = document.getElementById("models-list");
  if (modelsListEl) {
    modelsListEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;
      const selectEl = target.closest(".list-item");
      if (selectEl) {
        const modelId = selectEl.getAttribute("data-model-id");
        if (modelId) selectModel(modelId);
      }
    });
  }

  // Model controls
  const modelControlEl = document.getElementById("model-details-control");
  if (modelControlEl) {
    modelControlEl.addEventListener("click", async (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      const editBtn = target.closest("[data-action='edit-model-header']");
      if (editBtn) {
        await handleEditModel(editBtn.getAttribute("data-model-id"));
        return;
      }

      const importBtn = target.closest("[data-action='import-model']");
      if (importBtn) {
        handleImportModel(importBtn.getAttribute("data-model-id"));
        return;
      }

      const exportBtn = target.closest("[data-action='export-model']");
      if (exportBtn) {
        handleExportModel(exportBtn.getAttribute("data-model-id"));
        return;
      }

      const checkBtn = target.closest("[data-action='check-model']");
      if (checkBtn) {
        handleCheckModel(checkBtn.getAttribute("data-model-id"));
        return;
      }

      const deleteBtn = target.closest("[data-action='delete-model']");
      if (deleteBtn) {
        handleDeleteModel(deleteBtn.getAttribute("data-model-id"));
        return;
      }
    });
  }

  // Profiles list
  const profilesListEl = document.getElementById("profiles-list");
  if (profilesListEl) {
    profilesListEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;
      const selectEl = target.closest(".list-item");
      if (selectEl) {
        const profileId = selectEl.getAttribute("data-profile-id");
        if (profileId) selectProfile(profileId);
      }
    });
  }

  // Profile controls
  const profileControlEl = document.getElementById("profile-details-control");
  if (profileControlEl) {
    profileControlEl.addEventListener("click", (e) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target) return;

      const editHeaderBtn = target.closest("[data-action='edit-profile-header']");
      if (editHeaderBtn) {
        handleEditProfileHeader(editHeaderBtn.getAttribute("data-profile-id"));
        return;
      }

      const editBtn = target.closest("[data-action='edit-profile']");
      if (editBtn) {
        handleEditProfile(editBtn.getAttribute("data-profile-id"));
        return;
      }

      const importBtn = target.closest("[data-action='import-profile']");
      if (importBtn) {
        handleImportProfile(importBtn.getAttribute("data-profile-id"));
        return;
      }

      const exportBtn = target.closest("[data-action='export-profile']");
      if (exportBtn) {
        handleExportProfile(exportBtn.getAttribute("data-profile-id"));
        return;
      }

      const checkBtn = target.closest("[data-action='check-profile']");
      if (checkBtn) {
        handleCheckProfile(checkBtn.getAttribute("data-profile-id"));
        return;
      }

      const deleteBtn = target.closest("[data-action='delete-profile']");
      if (deleteBtn) {
        handleDeleteProfile(deleteBtn.getAttribute("data-profile-id"));
        return;
      }
    });
  }

  // Item details
  // ✅ Delegated events on item-details-content (STANDARD MODE)
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.addEventListener("click", handleItemDetailsClick);
    itemDetailsContent.addEventListener("submit", handleItemDetailsSubmit);
  }
}

// ============================================================
// PROJECT
// ============================================================
async function checkProject() {
  if (!currentProjectId) {
    showNoProjectWarning();
    return;
  }

  const project = await getProjectById(currentProjectId);
  if (!project) {
    showNoProjectWarning();
    return;
  }

  updatePageTitle(project);
  updateSidebarTitle(project);
  hideNoProjectWarning();
  await renderProjectTreeSidebar();
  await renderModelsContainer();
  await renderProfilesContainer();
}

function showNoProjectWarning() {
  document.getElementById("no-project-warning").classList.remove("hidden");
  document.getElementById("models-container").classList.add("hidden");
  document.getElementById("profiles-container").classList.add("hidden");
  document.getElementById("diagrams-container")?.classList.add("hidden");
  document.getElementById("diagram-resize-handle")?.classList.add("hidden");
  hideItemContainer();
}

function hideNoProjectWarning() {
  document.getElementById("no-project-warning").classList.add("hidden");
  if (diagramMode?.isEnabled()) {
    document.getElementById("models-container").classList.add("hidden");
    document.getElementById("profiles-container").classList.add("hidden");
    diagramMode.sync();
  } else {
    document.getElementById("models-container").classList.remove("hidden");
    document.getElementById("profiles-container").classList.remove("hidden");
    document.getElementById("diagrams-container")?.classList.add("hidden");
    document.getElementById("diagram-resize-handle")?.classList.add("hidden");
  }
}

function updatePageTitle(project) {
  const titleElement = document.getElementById("project-title");
  if (titleElement) titleElement.textContent = project.name;
}

function updateSidebarTitle(project) {
  const sidebarTitleElement = document.getElementById("sidebar-project-title");
  if (sidebarTitleElement) sidebarTitleElement.textContent = project.name;
}

async function renderProjectTreeSidebar(projectOverride = null) {
  const container = document.getElementById("current-project-structure");
  if (!container) return;

  const project = projectOverride || (await getProjectById(currentProjectId));
  if (!project) {
    container.innerHTML =
      '<div class="no-items text-muted">Проект не найден</div>';
    return;
  }

  container.innerHTML = renderProjectTree(project, currentProjectId);
  restoreSelectedTreeItemInTree();
}

function cssEscape(value) {
  if (globalThis.CSS && typeof globalThis.CSS.escape === "function") {
    return globalThis.CSS.escape(String(value));
  }
  // Minimal fallback (good enough for UUID-like ids)
  return String(value).replace(/"/g, "\\\"");
}

function snapshotTreeEl(el) {
  if (!(el instanceof HTMLElement)) return null;
  const type = el.getAttribute("data-type") || null;
  return {
    type,
    modelId: el.getAttribute("data-model-id") || null,
    profileId: el.getAttribute("data-profile-id") || null,
    packageId: el.getAttribute("data-package-id") || null,
    classId: el.getAttribute("data-class-id") || null,
    diagramId: el.getAttribute("data-diagram-id") || null,
  };
}

function restoreSelectedTreeItemInTree() {
  const container = document.getElementById("current-project-structure");
  if (!container) return;

  const snapshot =
    selectedTreeSnapshot ||
    (selectedModelId
      ? { type: "model", modelId: selectedModelId }
      : selectedProfileId
      ? { type: "profile", profileId: selectedProfileId }
      : null);

  if (!snapshot?.type) return;

  let selector = null;
  if (snapshot.type === "model" && snapshot.modelId) {
    selector = `.tree-structure-name[data-type="model"][data-model-id="${cssEscape(
      snapshot.modelId
    )}"]`;
  } else if (snapshot.type === "profile" && snapshot.profileId) {
    selector = `.tree-structure-name[data-type="profile"][data-profile-id="${cssEscape(
      snapshot.profileId
    )}"]`;
  } else if (snapshot.type === "package" && snapshot.packageId) {
    const ctxAttr = snapshot.modelId ? "data-model-id" : "data-profile-id";
    const ctxVal = snapshot.modelId || snapshot.profileId;
    if (ctxVal) {
      selector = `.tree-structure-name[data-type="package"][data-package-id="${cssEscape(
        snapshot.packageId
      )}"][${ctxAttr}="${cssEscape(ctxVal)}"]`;
    }
  } else if (snapshot.type === "class" && snapshot.classId) {
    const ctxAttr = snapshot.modelId ? "data-model-id" : "data-profile-id";
    const ctxVal = snapshot.modelId || snapshot.profileId;
    if (ctxVal) {
      selector = `.tree-structure-name[data-type="class"][data-class-id="${cssEscape(
        snapshot.classId
      )}"][${ctxAttr}="${cssEscape(ctxVal)}"]`;
    }
  } else if (snapshot.type === "diagram" && snapshot.diagramId) {
    const ctxAttr = snapshot.modelId ? "data-model-id" : "data-profile-id";
    const ctxVal = snapshot.modelId || snapshot.profileId;
    if (ctxVal) {
      selector = `.tree-structure-name[data-type="diagram"][data-diagram-id="${cssEscape(
        snapshot.diagramId
      )}"][${ctxAttr}="${cssEscape(ctxVal)}"]`;
    }
  }

  if (!selector) return;

  const el = container.querySelector(selector);
  if (!el) return;
  setSelectedTreeItem(el);
}

async function refreshSelectedModelUI() {
  if (!currentProjectId || !selectedModelId) return;

  const model =
    (await getModelHeader(currentProjectId, selectedModelId)) ||
    (await getModel(currentProjectId, selectedModelId));
  if (!model) return;

  const modelDetails = document.getElementById("model-details");
  const modelDetailsControl = document.getElementById("model-details-control");
  if (modelDetails) modelDetails.innerHTML = renderModelDetails(model);
  if (modelDetailsControl) modelDetailsControl.innerHTML = renderModelControls(model);

  // Update name in list without re-rendering
  const listNameEl = document.querySelector(
    `#models-list .list-item[data-model-id="${CSS.escape(String(selectedModelId))}"] .list-item-name`
  );
  if (listNameEl) listNameEl.textContent = model.name || "";

  // Update name in tree without re-rendering
  const treeNameEl = document.querySelector(
    `.tree-structure-name[data-type="model"][data-model-id="${CSS.escape(String(selectedModelId))}"]`
  );
  if (treeNameEl) {
    treeNameEl.textContent = model.name || "";
    treeNameEl.setAttribute("title", model.description || model.name || "");
    setSelectedTreeItem(treeNameEl);
  }
}

async function refreshSelectedProfileUI() {
  if (!currentProjectId || !selectedProfileId) return;

  const profile =
    (await getProfileHeader(currentProjectId, selectedProfileId)) ||
    (await getProfile(currentProjectId, selectedProfileId));
  if (!profile) return;

  const profileDetails = document.getElementById("profile-details");
  const profileDetailsControl = document.getElementById(
    "profile-details-control"
  );

  if (profileDetails) profileDetails.innerHTML = renderProfileDetails(profile);
  if (profileDetailsControl)
    profileDetailsControl.innerHTML = renderProfileControls(profile);

  // Update name in list without re-rendering
  const listNameEl = document.querySelector(
    `#profiles-list .list-item[data-profile-id="${CSS.escape(String(selectedProfileId))}"] .list-item-name`
  );
  if (listNameEl) listNameEl.textContent = profile.name || "";

  // Update name in tree without re-rendering
  const treeNameEl = document.querySelector(
    `.tree-structure-name[data-type="profile"][data-profile-id="${CSS.escape(String(selectedProfileId))}"]`
  );
  if (treeNameEl) {
    treeNameEl.textContent = profile.name || "";
    treeNameEl.setAttribute("title", profile.description || profile.name || "");
    setSelectedTreeItem(treeNameEl);
  }
}

// ============================================================
// MODELS
// ============================================================
async function renderModelsContainer(projectOverride = null) {
  const modelsList = document.getElementById("models-list");
  if (!modelsList) return;

  const models = projectOverride?.models
    ? [...projectOverride.models].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")))
    : await getModels(currentProjectId);

  if (!models || !Array.isArray(models) || models.length === 0) {
    modelsList.innerHTML = '<div class="no-items text-muted">Нет моделей</div>';
    return;
  }

  const html = models
    .map((m) => {
      const isSelected = String(selectedModelId) === String(m.id);
      return `
        <div class="list-item ${isSelected ? "selected" : ""}" data-model-id="${
        m.id
      }">
          <div class="list-item-content">
            <span class="list-item-icon">📦</span>
            <span class="list-item-name">${m.name}</span>
          </div>
        </div>
      `;
    })
    .join("");

  modelsList.innerHTML = html;

  if (!selectedModelId) {
    const modelDetails = document.getElementById("model-details");
    if (modelDetails) {
      modelDetails.innerHTML =
        '<div class="empty-state">Выберите модель для просмотра деталей</div>';
    }
  }
}

async function selectModel(modelId) {
  selectedModelId = modelId;
  await renderModelsContainer();

  const model = await getModel(currentProjectId, modelId);
  const modelDetails = document.getElementById("model-details");
  const modelDetailsControl = document.getElementById("model-details-control");

  if (modelDetails && model) modelDetails.innerHTML = renderModelDetails(model);
  if (modelDetailsControl && model)
    modelDetailsControl.innerHTML = renderModelControls(model);

  if (diagramMode?.isEnabled()) {
    // In diagram mode, models/profiles are not shown; item panel stays visible but empty.
    clearItemDetailsContent();
    diagramMode.sync({ clearItem: true });
  } else {
    hideItemContainer();
    showModelContainer();
    showProfileContainer();
  }

  const treeNameEl = document.querySelector(
    `.tree-structure-name[data-type="model"][data-model-id="${CSS.escape(String(modelId))}"]`
  );
  if (treeNameEl) setSelectedTreeItem(treeNameEl);
}

// ============================================================
// PROFILES
// ============================================================
async function renderProfilesContainer(projectOverride = null) {
  const profilesList = document.getElementById("profiles-list");
  if (!profilesList) return;

  const profiles = projectOverride?.profiles
    ? [...projectOverride.profiles].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")))
    : await getProfiles(currentProjectId);

  if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
    profilesList.innerHTML =
      '<div class="no-items text-muted">Нет профилей</div>';
    return;
  }

  const html = profiles
    .map((p) => {
      const isSelected = String(selectedProfileId) === String(p.id);
      return `
        <div class="list-item ${
          isSelected ? "selected" : ""
        }" data-profile-id="${p.id}">
          <div class="list-item-content">
            <span class="list-item-icon">⚙️</span>
            <span class="list-item-name">${p.name}</span>
          </div>
        </div>
      `;
    })
    .join("");

  profilesList.innerHTML = html;

  if (!selectedProfileId) {
    const profileDetails = document.getElementById("profile-details");
    if (profileDetails) {
      profileDetails.innerHTML =
        '<div class="empty-state">Выберите профиль для просмотра деталей</div>';
    }
  }
}

async function selectProfile(profileId) {
  selectedProfileId = profileId;
  await renderProfilesContainer();

  const profile = await getProfile(currentProjectId, profileId);
  const profileDetails = document.getElementById("profile-details");
  const profileDetailsControl = document.getElementById(
    "profile-details-control"
  );

  if (profileDetails && profile) profileDetails.innerHTML = renderProfileDetails(profile);
  if (profileDetailsControl && profile)
    profileDetailsControl.innerHTML = renderProfileControls(profile);

  if (diagramMode?.isEnabled()) {
    clearItemDetailsContent();
    diagramMode.sync({ clearItem: true });
  } else {
    hideItemContainer();
    showModelContainer();
    showProfileContainer();
  }

  const treeNameEl = document.querySelector(
    `.tree-structure-name[data-type="profile"][data-profile-id="${CSS.escape(String(profileId))}"]`
  );
  if (treeNameEl) setSelectedTreeItem(treeNameEl);
}

// ============================================================
// CONTAINERS VISIBILITY
// ============================================================
function showItemContainer() {
  const itemContainer = document.getElementById("item-container");
  if (itemContainer) itemContainer.classList.remove("hidden");
}

function hideItemContainer() {
  const itemContainer = document.getElementById("item-container");
  if (itemContainer) itemContainer.classList.add("hidden");
}

function showModelContainer() {
  const modelContainer = document.getElementById("models-container");
  if (modelContainer) modelContainer.classList.remove("hidden");
}

function hideModelContainer() {
  const modelContainer = document.getElementById("models-container");
  if (modelContainer) modelContainer.classList.add("hidden");
}

function showProfileContainer() {
  const profileContainer = document.getElementById("profiles-container");
  if (profileContainer) profileContainer.classList.remove("hidden");
}

function hideProfileContainer() {
  const profileContainer = document.getElementById("profiles-container");
  if (profileContainer) profileContainer.classList.add("hidden");
}

function clearItemDetailsContent() {
  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) itemDetailsContent.innerHTML = "";
}

function getSelectedTreeType() {
  const selected = document.querySelector(
    ".project-tree-item .tree-structure-name.selected"
  );
  if (!selected) return null;
  return selected.getAttribute("data-type") || null;
}

// ============================================================
// SELECT HANDLERS
// ============================================================
/**
 * Handles the selection of a package and displays its details in the appropriate panel.
 *
 * @param {string} packageId - The unique identifier of the package to select.
 * @param {string} [modelId=""] - The unique identifier of the parent model (optional).
 * @param {string} [profileId=""] - The unique identifier of the parent profile (optional).
 *
 * @returns {void}
 *
 */
async function handleSelectPackage(packageId, modelId = "", profileId = "") {
  const project = await getProjectById(currentProjectId);
  if (!project) return;

  const context =
    modelId && modelId !== ""
      ? "model"
      : profileId && profileId !== ""
      ? "profile"
      : null;

  if (! context) {
    console.error("Package must belong to either a model or profile");
    return;
  }

  const pkg = findPackageById(project, packageId, modelId, profileId, context);
  if (!pkg) {
    console.warn(`Package not found: ${packageId}`);
    return;
  }

  const pkgView = {
    ...pkg,
    modelId: modelId || "",
    profileId: profileId || "",
  };

  originalItemData = JSON.parse(JSON.stringify(pkgView));

  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderPackageDetails(pkgView, {
      viewMode: getItemDetailsViewMode(),
    });
  }

  showItemContainer();
  hideModelContainer();
  hideProfileContainer();
  if (diagramMode?.isEnabled()) diagramMode.sync();
}

/**
 * Handle select class from tree
 * @param {string} classId - Class ID
 * @param {string} modelId - Model ID
 * @param {string} profileId - Profile ID
 * @param {string} activeTab - Active tab name (optional)
 */
async function handleSelectClass(
  classId,
  modelId = "",
  profileId = "",
  activeTab = null
) {
  const project = await getProjectById(currentProjectId);
  if (!project) return;

  const context =
    modelId && modelId !== ""
      ? "model"
      : profileId && profileId !== ""
      ? "profile"
      : null;

  if (!context) {
    console.error("Class must belong to either a model or profile");
    return;
  }

  const cls = findClassById(project, classId, modelId, profileId, context);
  if (!cls) {
    console.warn(`Class not found: ${classId}`);
    return;
  }

  originalItemData = JSON.parse(JSON.stringify(cls));

  const tabToActivate =
    activeTab || (diagramMode?.isEnabled() ? "item-general" : "item-attributes");

  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderClassDetails(cls, {
      viewMode: getItemDetailsViewMode(),
    });
    activateTab(tabToActivate);
  }

  showItemContainer();
  hideModelContainer();
  hideProfileContainer();
  if (diagramMode?.isEnabled()) diagramMode.sync();
}

/**
 * Handle select enumeration from tree
 * Opens class with literals tab active
 */
function handleSelectEnumeration(classId, modelId = "", profileId = "") {
  // In diagram mode default to "Общая информация"; in standard mode open literals.
  const tab = diagramMode?.isEnabled() ? "item-general" : "item-literals";
  handleSelectClass(classId, modelId, profileId, tab);
}

/**
 * Handle select attribute from tree
 * Opens parent class with attributes tab active
 */
async function handleSelectAttribute(attrId, parentClassId = "", modelId = "", profileId = "") {
  if (parentClassId) {
    selectParentClassInTree({ id: parentClassId, modelId, profileId });
    await handleSelectClass(parentClassId, modelId, profileId, "item-attributes");
    return;
  }

  const project = await getProjectById(currentProjectId);
  if (!project) return;

  const parentClass = findClassByAttributeId(project, attrId);
  if (!parentClass) {
    console.warn(`Parent class not found for attribute: ${attrId}`);
    return;
  }

  const parentModelId = parentClass.modelId || "";
  const parentProfileId = parentClass.profileId || "";

  // ✅ Select parent class in tree
  selectParentClassInTree(parentClass);

  // Select parent class with attributes tab active
  handleSelectClass(parentClass.id, parentModelId, parentProfileId, "item-attributes");
}

/**
 * Handle select link from tree
 * Opens parent class with links tab active
 */
async function handleSelectLink(linkId, parentClassId = "", modelId = "", profileId = "") {
  if (parentClassId) {
    selectParentClassInTree({ id: parentClassId, modelId, profileId });
    await handleSelectClass(parentClassId, modelId, profileId, "item-links");
    return;
  }

  const project = await getProjectById(currentProjectId);
  if (!project) return;

  const parentClass = findClassByLinkId(project, linkId);
  if (!parentClass) {
    console.warn(`Parent class not found for link: ${linkId}`);
    return;
  }

  const parentModelId = parentClass.modelId || "";
  const parentProfileId = parentClass.profileId || "";

  // ✅ Select parent class in tree
  selectParentClassInTree(parentClass);

  // Select parent class with links tab active
  handleSelectClass(parentClass.id, parentModelId, parentProfileId, "item-links");
}

/**
 * Handle select literal from tree
 * Opens parent class with literals tab active
 */
async function handleSelectLiteral(literalId, parentClassId = "", modelId = "", profileId = "") {
  if (parentClassId) {
    selectParentClassInTree({ id: parentClassId, modelId, profileId });
    await handleSelectClass(parentClassId, modelId, profileId, "item-literals");
    return;
  }

  const project = await getProjectById(currentProjectId);
  if (!project) return;

  const parentClass = findClassByLiteralId(project, literalId);
  if (!parentClass) {
    console.warn(`Parent class not found for literal: ${literalId}`);
    return;
  }

  const parentModelId = parentClass.modelId || "";
  const parentProfileId = parentClass.profileId || "";

  // ✅ Select parent class in tree
  selectParentClassInTree(parentClass);

  // Select parent class with literals tab active
  handleSelectClass(parentClass.id, parentModelId, parentProfileId, "item-literals");
}

// ============================================================
// TAB ACTIVATION
// ============================================================

/**
 * Activate a specific tab in class details
 * @param {string} tabName - Tab name (item-attributes, item-links, item-literals)
 */
function activateTab(tabName) {
  // Wait for DOM to be ready
  requestAnimationFrame(() => {
    // If requested tab doesn't exist (e.g., Enumeration has only item-literals),
    // keep the renderer's default active tab/content.
    const targetTab = document.querySelector(`[data-section-tab="${tabName}"]`);
    const targetContent = document.querySelector(`[data-tab-content="${tabName}"]`);
    if (!targetTab || !targetContent) {
      return;
    }

    // Remove active class from all tabs
    document
      .querySelectorAll("[data-section-tab]")
      .forEach((tab) => tab.classList.remove("active"));

    // Add active class to specified tab
    targetTab.classList.add("active");

    // Hide all tab content
    document
      .querySelectorAll("[data-tab-content]")
      .forEach((content) => content.classList.remove("active"));

    // Show selected tab content
    targetContent.classList.add("active");

    // Hide all action buttons
    document
      .querySelectorAll(".tab-action-btn")
      .forEach((btn) => btn.classList.add("hidden"));

    // Show corresponding action button
    const selectedActionBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedActionBtn) {
      selectedActionBtn.classList.remove("hidden");
    }
  });
}

// ============================================================
// ITEM DETAILS CLICK HANDLER
// ============================================================
function handleItemDetailsClick(e) {
  const target = e.target instanceof HTMLElement ? e.target : null;
  if (!target) return;

  // Navigate to target class from links table
  const navigateToTargetClassEl = target.closest(
    "[data-action='navigate-to-target-class']"
  );
  if (navigateToTargetClassEl) {
    const classId = navigateToTargetClassEl.getAttribute("data-target-class-id");
    const modelId = navigateToTargetClassEl.getAttribute("data-model-id");
    const profileId = navigateToTargetClassEl.getAttribute("data-profile-id");
    if (! classId) {
      alert("Целевой класс не указан (targetClassId пустой).");
      return;
    }

    handleNavigateToClass(classId, modelId, profileId, "item-links", true);
    return;
  }

  // Navigate to package
  const navigateToPackageEl = target.closest(
    "[data-action='navigate-to-package']"
  );
  if (navigateToPackageEl) {
    const packageId = navigateToPackageEl.getAttribute("data-package-id");
    const modelId = navigateToPackageEl.getAttribute("data-model-id");
    const profileId = navigateToPackageEl.getAttribute("data-profile-id");
    if (packageId) handleNavigateToPackage(packageId, modelId, profileId);
    return;
  }

  // Navigate to class
  const navigateToClassEl = target.closest("[data-action='navigate-to-class']");
  if (navigateToClassEl) {
    const classId = navigateToClassEl.getAttribute("data-class-id");
    const modelId = navigateToClassEl.getAttribute("data-model-id");
    const profileId = navigateToClassEl.getAttribute("data-profile-id");
    if (classId) handleNavigateToClass(classId, modelId, profileId);
    return;
  }

  // ✅ Tab switching (works in both modes)
  const tabBtn = target.closest("[data-section-tab]");
  if (tabBtn) {
    handleTabSwitch(tabBtn);
    return;
  }

  // Cancel buttons
  if (target.closest("#pkg-cancel-btn")) {
    handleCancelPackageEdit();
    return;
  }
  if (target.closest("#cls-cancel-btn")) {
    handleCancelClassEdit();
    return;
  }

  // Add buttons
  const addAttrBtn = target.closest("#add-attribute-btn");
  if (addAttrBtn) {
    handleAddAttribute(addAttrBtn.getAttribute("data-class-id"));
    return;
  }

  const addLinkBtn = target.closest("#add-link-btn");
  if (addLinkBtn) {
    handleAddLink(addLinkBtn.getAttribute("data-class-id"));
    return;
  }

  const addLiteralBtn = target.closest("#add-literal-btn");
  if (addLiteralBtn) {
    handleAddLiteral(addLiteralBtn.getAttribute("data-class-id"));
    return;
  }

  // Edit/Delete buttons
  const editAttrBtn = target.closest("[data-action='edit-attribute']");
  if (editAttrBtn) {
    handleEditAttribute(editAttrBtn.getAttribute("data-attr-id"));
    return;
  }

  const deleteAttrBtn = target.closest("[data-action='delete-attribute']");
  if (deleteAttrBtn) {
    handleDeleteAttribute(deleteAttrBtn.getAttribute("data-attr-id"));
    return;
  }

  const editLinkBtn = target.closest("[data-action='edit-link']");
  if (editLinkBtn) {
    handleEditLink(
      editLinkBtn.getAttribute("data-link-id"),
      editLinkBtn.getAttribute("data-class-id")
    );
    return;
  }

  const deleteLinkBtn = target.closest("[data-action='delete-link']");
  if (deleteLinkBtn) {
    handleDeleteLink(
      deleteLinkBtn.getAttribute("data-link-id"),
      deleteLinkBtn.getAttribute("data-class-id")
    );
    return;
  }

  const editLiteralBtn = target.closest("[data-action='edit-literal']");
  if (editLiteralBtn) {
    handleEditLiteral(editLiteralBtn.getAttribute("data-literal-id"));
    return;
  }

  const deleteLiteralBtn = target.closest("[data-action='delete-literal']");
  if (deleteLiteralBtn) {
    handleDeleteLiteral(deleteLiteralBtn.getAttribute("data-literal-id"));
    return;
  }
}

// ============================================================
// TAB SWITCHING
// ============================================================
function handleTabSwitch(tabBtn) {
  const tabName = tabBtn.getAttribute("data-section-tab");
  if (tabName && tabName.startsWith("item-")) {
    lastClassTabName = tabName;
  }

  // Remove active class from all tabs
  document.querySelectorAll("[data-section-tab]").forEach((tab) => tab.classList.remove("active"));
  tabBtn.classList.add("active");

  // Hide all tab content
  document
    .querySelectorAll("[data-tab-content]")
    .forEach((content) => content.classList.remove("active"));

  // Show selected tab content
  const selectedContent = document.querySelector(
    `[data-tab-content="${tabName}"]`
  );
  if (selectedContent) {
    selectedContent.classList.add("active");
  }

  // Hide all action buttons
  document
    .querySelectorAll(".tab-action-btn")
    .forEach((btn) => btn.classList.add("hidden"));

  // Show corresponding action button
  const selectedActionBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedActionBtn) {
    selectedActionBtn.classList.remove("hidden");
  }
}

function getActiveClassTabName() {
  const activeTab = document.querySelector("[data-section-tab].active");
  const tabName = activeTab ? activeTab.getAttribute("data-section-tab") : null;
  if (!tabName || !tabName.startsWith("item-")) return null;
  return tabName;
}

function restoreClassTab(tabName) {
  if (!tabName) return;

  const tabEl = document.querySelector(`[data-section-tab="${tabName}"]`);
  if (tabEl) {
    handleTabSwitch(tabEl);
  }
}

// ============================================================
// NAVIGATION
// ============================================================
async function handleNavigateToPackage(packageId, modelId = "", profileId = "") {
  const context =
    modelId && modelId !== ""
      ? "model"
      : profileId && profileId !== ""
      ? "profile"
      : null;
  if (!context) return;

  const project = await getProjectById(currentProjectId);
  if (!project) return;

  const parentChain = findPackageParentChain(
    project,
    packageId,
    modelId,
    profileId,
    context
  );
  if (!parentChain || parentChain.length === 0) return;

  expandTreePath(parentChain);

  requestAnimationFrame(async () => {
    const selector =
      context === "model"
        ? `[data-type="package"][data-package-id="${packageId}"][data-model-id="${modelId}"]`
        : `[data-type="package"][data-package-id="${packageId}"][data-profile-id="${profileId}"]`;

    const packageEl = document.querySelector(selector);
    if (packageEl) {
      setSelectedTreeItem(packageEl);
      packageEl.scrollIntoView({ behavior: "smooth", block: "center" });
      await handleSelectPackage(packageId, modelId, profileId);
    }
  });
}

async function handleNavigateToClass(
  classId,
  modelId = "",
  profileId = "",
  activeTab = null,
  showAlertOnNotFound = false
) {
  const context =
    modelId && modelId !== ""
      ? "model"
      : profileId && profileId !== ""
      ? "profile"
      : null;
  if (!context) {
    if (showAlertOnNotFound) {
      alert(
        "Невозможно перейти к классу: не определён контекст модели/профиля."
      );
    }
    return;
  }

  const project = await getProjectById(currentProjectId);
  if (!project) return;

  const parentChain = findClassParentChain(
    project,
    classId,
    modelId,
    profileId,
    context
  );
  if (!parentChain || parentChain.length === 0) {
    if (showAlertOnNotFound) {
      alert(
        "Класс не найден в дереве в пределах текущей модели/профиля (по targetClassId)."
      );
    }
    return;
  }

  expandTreePath(parentChain);

  requestAnimationFrame(async () => {
    const selector =
      context === "model"
        ? `[data-type="class"][data-class-id="${classId}"][data-model-id="${modelId}"]`
        : `[data-type="class"][data-class-id="${classId}"][data-profile-id="${profileId}"]`;

    const classEl = document.querySelector(selector);
    if (classEl) {
      setSelectedTreeItem(classEl);
      classEl.scrollIntoView({ behavior: "smooth", block: "center" });
      const tabToActivate =
        activeTab || (diagramMode?.isEnabled() ? "item-general" : "item-attributes");
      await handleSelectClass(classId, modelId, profileId, tabToActivate);
    } else if (showAlertOnNotFound) {
      alert(
        "Класс не найден в дереве в пределах текущей модели/профиля (по targetClassId)."
      );
    }
  });
}

function expandTreePath(parentChain) {
  const expandedProjects = JSON.parse(
    localStorage.getItem("cim.expandedProjects") || "{}"
  );
  expandedProjects[currentProjectId] = true;
  localStorage.setItem(
    "cim.expandedProjects",
    JSON.stringify(expandedProjects)
  );

  const expandedItems = JSON.parse(
    localStorage.getItem("cim.expandedTreeItems") || "{}"
  );
  parentChain.forEach((itemId) => {
    expandedItems[itemId] = true;
  });
  localStorage.setItem("cim.expandedTreeItems", JSON.stringify(expandedItems));

  parentChain.forEach((itemId) => expandTreeItem(itemId));
}

function expandTreeItem(itemId) {
  const toggleBtn = document.querySelector(`[data-item-id="${itemId}"]`);
  if (!toggleBtn) return;

  toggleBtn.setAttribute("aria-expanded", "true");

  const icon = toggleBtn.querySelector(".tree-expand-icon, .expand-icon");
  if (icon) icon.textContent = "▼";

  const treeItem = toggleBtn.closest(
    ".tree-structure-item, .project-tree-item"
  );
  if (!treeItem) return;

  for (let child of treeItem.children) {
    if (
      child.classList.contains("tree-structure-children") ||
      child.classList.contains("project-structure")
    ) {
      child.classList.remove("hidden");
      break;
    }
  }
}

// ============================================================
// FIND PARENT CHAIN
// ============================================================
function findPackageParentChain(
  project,
  packageId,
  modelId,
  profileId,
  context
) {
  const searchInPackages = (packages, currentPath, isSubPackage = false) => {
    for (let idx = 0; idx < packages.length; idx++) {
      const pkg = packages[idx];
      const prefix = isSubPackage ? "sub" : "pkg";
      const pkgPath = [...currentPath, `${prefix}-${idx}`];

      if (pkg.id === packageId) return pkgPath;

      if (pkg.subPackages && pkg.subPackages.length > 0) {
        const found = searchInPackages(pkg.subPackages, [...pkgPath], true);
        if (found) return found;
      }
    }
    return null;
  };

  if (context === "model" && modelId && modelId !== "") {
    const model = project.models?.find((m) => m.id === modelId);
    if (!model) return [];

    const modelItemId = `model-${currentProjectId}-${modelId}`;
    if (model.rootPackages?.[0]?.packages) {
      const found = searchInPackages(
        model.rootPackages[0].packages,
        [modelItemId],
        false
      );
      if (found) {
        return found.reduce((acc, part, i) => {
          if (i === 0) return [part];
          return [...acc, acc[acc.length - 1] + "-" + part];
        }, []);
      }
    }
  }

  if (context === "profile" && profileId && profileId !== "") {
    const profile = project.profiles?.find((p) => p.id === profileId);
    if (!profile) return [];

    const profileItemId = `profile-${currentProjectId}-${profileId}`;
    if (profile.rootPackages?.[0]?.packages) {
      const found = searchInPackages(
        profile.rootPackages[0].packages,
        [profileItemId],
        false
      );
      if (found) {
        return found.reduce((acc, part, i) => {
          if (i === 0) return [part];
          return [...acc, acc[acc.length - 1] + "-" + part];
        }, []);
      }
    }
  }

  return [];
}

function findClassParentChain(project, classId, modelId, profileId, context) {
  const searchInPackages = (packages, currentPath, isSubPackage = false) => {
    for (let idx = 0; idx < packages.length; idx++) {
      const pkg = packages[idx];
      const prefix = isSubPackage ? "sub" : "pkg";
      const pkgPath = [...currentPath, `${prefix}-${idx}`];

      if (pkg.classes) {
        const classIdx = pkg.classes.findIndex((c) => c.id === classId);
        if (classIdx !== -1) return pkgPath;
      }

      if (pkg.subPackages && pkg.subPackages.length > 0) {
        const found = searchInPackages(pkg.subPackages, [...pkgPath], true);
        if (found) return found;
      }
    }
    return null;
  };

  if (context === "model" && modelId && modelId !== "") {
    const model = project.models?.find((m) => m.id === modelId);
    if (!model) return [];

    const modelItemId = `model-${currentProjectId}-${modelId}`;
    if (model.rootPackages?.[0]?.packages) {
      const found = searchInPackages(
        model.rootPackages[0].packages,
        [modelItemId],
        false
      );
      if (found) {
        return found.reduce((acc, part, i) => {
          if (i === 0) return [part];
          return [...acc, acc[acc.length - 1] + "-" + part];
        }, []);
      }
    }
  }

  if (context === "profile" && profileId && profileId !== "") {
    const profile = project.profiles?.find((p) => p.id === profileId);
    if (!profile) return [];

    const profileItemId = `profile-${currentProjectId}-${profileId}`;
    if (profile.rootPackages?.[0]?.packages) {
      const found = searchInPackages(
        profile.rootPackages[0].packages,
        [profileItemId],
        false
      );
      if (found) {
        return found.reduce((acc, part, i) => {
          if (i === 0) return [part];
          return [...acc, acc[acc.length - 1] + "-" + part];
        }, []);
      }
    }
  }

  return [];
}

/**
 * Find the parent chain (tree itemIds) that contains a diagram.
 *
 * Used after creating/selecting a diagram to ensure all ancestor nodes are expanded
 * in the sidebar tree.
 *
 * @param {object} project Exported project payload
 * @param {string} diagramId Diagram id
 * @param {string} modelId Model id (if context is model)
 * @param {string} profileId Profile id (if context is profile)
 * @param {'model'|'profile'} context
 * @returns {string[]} Array of tree itemIds to expand (from model/profile root to package)
 */
function findDiagramParentChain(project, diagramId, modelId, profileId, context) {
  const searchInPackages = (packages, currentPath, isSubPackage = false) => {
    for (let idx = 0; idx < packages.length; idx++) {
      const pkg = packages[idx];
      const prefix = isSubPackage ? "sub" : "pkg";
      const pkgPath = [...currentPath, `${prefix}-${idx}`];

      if (pkg.diagrams) {
        const diagramIdx = pkg.diagrams.findIndex((d) => d.id === diagramId);
        if (diagramIdx !== -1) return pkgPath;
      }

      if (pkg.subPackages && pkg.subPackages.length > 0) {
        const found = searchInPackages(pkg.subPackages, [...pkgPath], true);
        if (found) return found;
      }
    }
    return null;
  };

  if (context === "model" && modelId && modelId !== "") {
    const model = project.models?.find((m) => m.id === modelId);
    if (!model) return [];

    const modelItemId = `model-${currentProjectId}-${modelId}`;
    if (model.rootPackages?.[0]?.packages) {
      const found = searchInPackages(model.rootPackages[0].packages, [modelItemId], false);
      if (found) {
        return found.reduce((acc, part, i) => {
          if (i === 0) return [part];
          return [...acc, acc[acc.length - 1] + "-" + part];
        }, []);
      }
    }
  }

  if (context === "profile" && profileId && profileId !== "") {
    const profile = project.profiles?.find((p) => p.id === profileId);
    if (!profile) return [];

    const profileItemId = `profile-${currentProjectId}-${profileId}`;
    if (profile.rootPackages?.[0]?.packages) {
      const found = searchInPackages(
        profile.rootPackages[0].packages,
        [profileItemId],
        false
      );
      if (found) {
        return found.reduce((acc, part, i) => {
          if (i === 0) return [part];
          return [...acc, acc[acc.length - 1] + "-" + part];
        }, []);
      }
    }
  }

  return [];
}

// ============================================================
// FORM SUBMIT HANDLER
// ============================================================
async function handleItemDetailsSubmit(e) {
  e.preventDefault();
  const form = e.target;

  if (form.id === "package-form") await handleSavePackage(form);
  else if (form.id === "class-form") await handleSaveClass(form);
}

// ============================================================
// PACKAGE HANDLERS
// ============================================================
async function handleSavePackage(form) {
  const packageId = form.getAttribute("data-package-id");
  const modelId = form.getAttribute("data-model-id") || originalItemData?.modelId || "";
  const profileId = form.getAttribute("data-profile-id") || originalItemData?.profileId || "";

  const context = modelId && modelId !== "" ? "model" : profileId && profileId !== "" ? "profile" : null;
  if (!context) {
    showToast("Не удалось определить контекст пакета (model/profile)", { type: "error" });
    return;
  }

  const updatedData = {
    id: packageId,
    modelId: modelId || undefined,
    profileId: profileId || undefined,

    name: document.getElementById("pkg-name")?.value?.trim() ?? "",
    documentation: document.getElementById("pkg-documentation")?.value?.trim() ?? "",
    documentationRu: document.getElementById("pkg-documentationRu")?.value?.trim() ?? "",
    details: document.getElementById("pkg-details")?.value?.trim() ?? "",
  };

  const saveBtn = document.getElementById("pkg-save-btn");
  if (saveBtn) saveBtn.disabled = true;

  try {
    const updatedProject =
      context === "model"
        ? await updateModelPackageInBackend(currentProjectId, modelId, packageId, updatedData)
        : await updateProfilePackageInBackend(currentProjectId, profileId, packageId, updatedData);

    if (!updatedProject) {
      throw new Error("Backend did not return updated project");
    }

    selectedTreeSnapshot = {
      type: "package",
      packageId,
      modelId: context === "model" ? modelId : null,
      profileId: context === "profile" ? profileId : null,
      classId: null,
    };

    await renderProjectTreeSidebar(updatedProject);

    const chain = findPackageParentChain(
      updatedProject,
      packageId,
      modelId,
      profileId,
      context
    );
    expandTreePath(chain);
    restoreSelectedTreeItemInTree();

    const updatedPkg = findPackageById(
      updatedProject,
      packageId,
      modelId,
      profileId,
      context
    );
    if (updatedPkg) {
      const pkgView = {
        ...updatedPkg,
        modelId: modelId || "",
        profileId: profileId || "",
      };

      originalItemData = JSON.parse(JSON.stringify(pkgView));
      const itemDetailsContent = document.getElementById("item-details-content");
      if (itemDetailsContent) {
        itemDetailsContent.innerHTML = renderPackageDetails(pkgView, {
          viewMode: getItemDetailsViewMode(),
        });
      }
    }

    showToast("Пакет сохранён", { type: "success" });
  } catch (error) {
    console.error("[handleSavePackage] Save failed:", error);
    const msg = error?.message ? String(error.message) : "Ошибка сохранения";
    showToast(`Ошибка сохранения пакета: ${msg}`, { type: "error" });

    // Rollback UI to original state (discard edits).
    const itemDetailsContent = document.getElementById("item-details-content");
    if (itemDetailsContent && originalItemData) {
      itemDetailsContent.innerHTML = renderPackageDetails(originalItemData, {
        viewMode: getItemDetailsViewMode(),
      });
    }
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

function handleCancelPackageEdit() {
  if (!originalItemData) return;
  if (!confirm("Отменить изменения?  Несохранённые данные будут потеряны."))
    return;

  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent)
    itemDetailsContent.innerHTML = renderPackageDetails(originalItemData, {
      viewMode: getItemDetailsViewMode(),
    });
}

// ============================================================
// CLASS HANDLERS
// ============================================================
async function handleSaveClass(form) {
  const classId = form.getAttribute("data-class-id");

  const modelId = form.getAttribute("data-model-id") || originalItemData?.modelId || "";
  const profileId = form.getAttribute("data-profile-id") || originalItemData?.profileId || "";

  const context = modelId && modelId !== "" ? "model" : profileId && profileId !== "" ? "profile" : null;
  if (!context) {
    showToast("Не удалось определить контекст класса (model/profile)", { type: "error" });
    return;
  }

  const activeTab =
    getActiveClassTabName() ||
    lastClassTabName ||
    (diagramMode?.isEnabled() ? "item-general" : "item-attributes");

  const updatedData = {
    id: classId,
    modelId: modelId || undefined,
    profileId: profileId || undefined,

    name: document.getElementById("cls-name")?.value?.trim() ?? "",
    stereotype: document.getElementById("cls-stereotype")?.value?.trim() ?? "",
    isAbstract: Boolean(document.getElementById("cls-isAbstract")?.checked),
    documentation: document.getElementById("cls-documentation")?.value?.trim() ?? "",
    documentationRu: document.getElementById("cls-documentationRu")?.value?.trim() ?? "",
    details: document.getElementById("cls-details")?.value?.trim() ?? "",

    // Other identifiers (pass through if present on the object)
    refModelId: originalItemData?.refModelId ?? null,
    refModelItemId: originalItemData?.refModelItemId ?? null,
  };

  const saveBtn = document.getElementById("cls-save-btn");
  if (saveBtn) saveBtn.disabled = true;

  try {
    const updatedProject =
      context === "model"
        ? await updateModelClassInBackend(currentProjectId, modelId, classId, updatedData)
        : await updateProfileClassInBackend(currentProjectId, profileId, classId, updatedData);

    if (!updatedProject) {
      throw new Error("Backend did not return updated project");
    }

    selectedTreeSnapshot = {
      type: "class",
      classId,
      modelId: context === "model" ? modelId : null,
      profileId: context === "profile" ? profileId : null,
      packageId: null,
    };

    await renderProjectTreeSidebar(updatedProject);

    const chain = findClassParentChain(
      updatedProject,
      classId,
      modelId,
      profileId,
      context
    );
    expandTreePath(chain);
    restoreSelectedTreeItemInTree();

    const updatedCls = findClassById(
      updatedProject,
      classId,
      modelId,
      profileId,
      context
    );
    if (updatedCls) {
      const clsView = {
        ...updatedCls,
        modelId: modelId || "",
        profileId: profileId || "",
      };

      originalItemData = JSON.parse(JSON.stringify(clsView));
      const itemDetailsContent = document.getElementById("item-details-content");
      if (itemDetailsContent) {
        itemDetailsContent.innerHTML = renderClassDetails(clsView, {
          viewMode: getItemDetailsViewMode(),
        });
        if (activeTab) activateTab(activeTab);
      }
    }

    showToast("Класс сохранён", { type: "success" });

    // Keep data type picker lists fresh after class rename/update
    if (context === "model") invalidateModelClassesSummary(modelId);
    if (context === "profile") invalidateProfileClassesSummary(profileId);
  } catch (error) {
    console.error("[handleSaveClass] Save failed:", error);
    const msg = error?.message ? String(error.message) : "Ошибка сохранения";
    showToast(`Ошибка сохранения класса: ${msg}`, { type: "error" });

    // Rollback UI to original state (discard edits).
    const itemDetailsContent = document.getElementById("item-details-content");
    if (itemDetailsContent && originalItemData) {
      itemDetailsContent.innerHTML = renderClassDetails(originalItemData, {
        viewMode: getItemDetailsViewMode(),
      });
      if (activeTab) activateTab(activeTab);
    }
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

function handleCancelClassEdit() {
  if (!originalItemData) return;
  if (!confirm("Отменить изменения? Несохранённые данные будут потеряны."))
    return;

  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent)
    itemDetailsContent.innerHTML = renderClassDetails(originalItemData, {
      viewMode: getItemDetailsViewMode(),
    });
}

// ============================================================
// ATTRIBUTE HANDLERS
// ============================================================
function handleAddAttribute(classId) {
  if (!classId) return;

  getProjectById(currentProjectId).then((project) => {
    if (!project) return;

    const found = findClassWithContext(project, String(classId));
    if (!found) return;

    const existingNames = (found.cls?.attributes || [])
      .map((a) => a?.name)
      .filter(Boolean);

    openCreateAttributeModal({
      classId: String(classId),
      modelId: found.modelId || "",
      profileId: found.profileId || "",
      existingNames,
    });
  });
}

async function handleEditAttribute(attrId) {
  const project = await getProjectById(currentProjectId);
  if (!project) return;

  const found = findAttributeWithParent(project, attrId);
  if (!found) return;

  const existingNames = (found.cls?.attributes || [])
    .filter((a) => String(a?.id) !== String(attrId))
    .map((a) => a?.name)
    .filter(Boolean);

  openEditAttributeModal(found.attr, { existingNames });
}

function handleDeleteAttribute(attrId) {
  if (!confirm("Удалить атрибут?")) return;
  alert("Функция удаления атрибута в разработке");
}

// ============================================================
// LINK HANDLERS
// ============================================================
function handleAddLink(classId) {
  alert("Функция добавления связи в разработке");
}

async function handleEditLink(linkId, classId) {
  const project = await getProjectById(currentProjectId);
  if (!project) return;

  const found = findLinkWithParent(project, classId, linkId);
  if (!found) return;

  openEditLinkModal(found.link, found.cls.id, {
    modelId: found.cls?.modelId || "",
    profileId: found.cls?.profileId || "",
  });
}

async function handleDeleteLink(linkId, classId) {
  if (!confirm("Удалить связь?")) return;

  const project = await getProjectById(currentProjectId);
  if (!project) return;

  const tabToRestore = getActiveClassTabName() || lastClassTabName;

  const found = findLinkWithParent(project, classId, linkId);
  if (!found) return;

  if (!Array.isArray(found.cls.links)) return;
  const idx = found.cls.links.findIndex((l) => l.linkId === linkId);
  if (idx < 0) return;

  found.cls.links.splice(idx, 1);

  const itemDetailsContent = document.getElementById("item-details-content");
  if (itemDetailsContent) {
    itemDetailsContent.innerHTML = renderClassDetails(found.cls, {
      viewMode: getItemDetailsViewMode(),
    });
    restoreClassTab(tabToRestore);
  }
}

// ============================================================
// LITERAL HANDLERS
// ============================================================
function handleAddLiteral(classId) {
  alert("Функция добавления значения в разработке");
}

function handleEditLiteral(literalId) {
  alert("Функция редактирования значения в разработке");
}

function handleDeleteLiteral(literalId) {
  if (!confirm("Удалить значение?")) return;
  alert("Функция удаления значения в разработке");
}

// ============================================================
// FIND HELPERS
// ============================================================
function findPackageById(
  project,
  packageId,
  modelId = "",
  profileId = "",
  context = null
) {
  const searchInPackages = (packages) => {
    for (const pkg of packages) {
      if (pkg.id === packageId) return pkg;
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages);
        if (found) return found;
      }
    }
    return null;
  };

  if (context === "model" && modelId && modelId !== "") {
    const model = project.models?.find((m) => m.id === modelId);
    if (model?.rootPackages?.[0]?.packages) {
      return searchInPackages(model.rootPackages[0].packages);
    }
  }

  if (context === "profile" && profileId && profileId !== "") {
    const profile = project.profiles?.find((p) => p.id === profileId);
    if (profile?.rootPackages?.[0]?.packages) {
      return searchInPackages(profile.rootPackages[0].packages);
    }
  }

  return null;
}

function findClassById(
  project,
  classId,
  modelId = "",
  profileId = "",
  context = null
) {
  const searchInPackages = (packages) => {
    for (const pkg of packages) {
      if (pkg.classes) {
        const cls = pkg.classes.find((c) => c.id === classId);
        if (cls) return cls;
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages);
        if (found) return found;
      }
    }
    return null;
  };

  if (context === "model" && modelId && modelId !== "") {
    const model = project.models?.find((m) => m.id === modelId);
    if (model?.rootPackages?.[0]?.packages) {
      return searchInPackages(model.rootPackages[0].packages);
    }
  }

  if (context === "profile" && profileId && profileId !== "") {
    const profile = project.profiles?.find((p) => p.id === profileId);
    if (profile?.rootPackages?.[0]?.packages) {
      return searchInPackages(profile.rootPackages[0].packages);
    }
  }

  return null;
}

/**
 * Find a diagram by id in a specific context (model/profile).
 *
 * @param {object} project Exported project payload
 * @param {string} diagramId Diagram id
 * @param {string} [modelId]
 * @param {string} [profileId]
 * @param {'model'|'profile'|null} [context]
 * @returns {object|null}
 */
function findDiagramById(
  project,
  diagramId,
  modelId = "",
  profileId = "",
  context = null
) {
  const searchInPackages = (packages) => {
    for (const pkg of packages) {
      const d = pkg.diagrams?.find((x) => x.id === diagramId);
      if (d) return d;

      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages);
        if (found) return found;
      }
    }
    return null;
  };

  if (context === "model" && modelId && modelId !== "") {
    const model = project.models?.find((m) => m.id === modelId);
    if (model?.rootPackages?.[0]?.packages) {
      return searchInPackages(model.rootPackages[0].packages);
    }
  }

  if (context === "profile" && profileId && profileId !== "") {
    const profile = project.profiles?.find((p) => p.id === profileId);
    if (profile?.rootPackages?.[0]?.packages) {
      return searchInPackages(profile.rootPackages[0].packages);
    }
  }

  return null;
}

function findClassWithContext(project, classId) {
  const searchInPackages = (packages) => {
    for (const pkg of packages) {
      if (pkg.classes) {
        const cls = pkg.classes.find((c) => c.id === classId);
        if (cls) return cls;
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages);
        if (found) return found;
      }
    }
    return null;
  };

  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages?.[0]?.packages) {
        const cls = searchInPackages(model.rootPackages[0].packages);
        if (cls) {
          return {
            cls,
            context: "model",
            modelId: model.id,
            profileId: null,
          };
        }
      }
    }
  }

  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages?.[0]?.packages) {
        const cls = searchInPackages(profile.rootPackages[0].packages);
        if (cls) {
          return {
            cls,
            context: "profile",
            modelId: null,
            profileId: profile.id,
          };
        }
      }
    }
  }

  return null;
}

function findAttributeWithParent(project, attrId) {
  const searchInPackages = (packages) => {
    for (const pkg of packages) {
      if (pkg.classes) {
        for (const cls of pkg.classes) {
          if (cls.attributes) {
            const attr = cls.attributes.find((a) => a.id === attrId);
            if (attr) return { attr, cls };
          }
        }
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages);
        if (found) return found;
      }
    }
    return null;
  };

  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages?.[0]?.packages) {
        const found = searchInPackages(model.rootPackages[0].packages);
        if (found) {
          return {
            ...found,
            context: "model",
            modelId: model.id,
            profileId: null,
          };
        }
      }
    }
  }

  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages?.[0]?.packages) {
        const found = searchInPackages(profile.rootPackages[0].packages);
        if (found) {
          return {
            ...found,
            context: "profile",
            modelId: null,
            profileId: profile.id,
          };
        }
      }
    }
  }

  return null;
}

function findLinkWithParent(project, classId, linkId) {
  if (!classId || !linkId) return null;

  const searchInPackages = (packages) => {
    for (const pkg of packages) {
      if (pkg.classes) {
        const cls = pkg.classes.find((c) => c.id === classId);
        if (cls) {
          const link = cls.links?.find((l) => l.linkId === linkId);
          if (link) return { link, cls };
        }
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages);
        if (found) return found;
      }
    }
    return null;
  };

  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages?.[0]?.packages) {
        const found = searchInPackages(model.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages?.[0]?.packages) {
        const found = searchInPackages(profile.rootPackages[0].packages);
        if (found) return found;
      }
    }
  }

  return null;
}

// ============================================================
// DIAGRAM MODE
// ============================================================


function getItemDetailsViewMode() {
  return diagramMode?.isEnabled() ? "diagram" : "standard";
}

/**
 * Render a simple read-only diagram info panel.
 *
 * Note: this is intentionally lightweight (no drawing libraries yet) and is used
 * in diagram mode to show the currently selected diagram metadata.
 *
 * @param {object|null} diagram Diagram export object
 * @returns {string} HTML string
 */
function renderDiagramPanel(diagram) {
  if (!diagram) {
    return `<div class="diagram-mode-placeholder">Диаграмма не найдена.</div>`;
  }

  const name = diagram.diagramName || "Диаграмма";
  const type = diagram.diagramType || "";
  const doc = diagram.documentation || "";
  const details = diagram.details || "";

  return `
    <div class="item-section">
      <div class="section-header">
        <div class="section-title">📐 ${name}${type ? ` (${type})` : ""}</div>
      </div>
      <div class="form-section">
        <div class="form-row">
          <div class="form-cell">
            <div class="form-group">
              <label class="form-label">Описание</label>
              <div class="text-muted">${doc ? doc : "—"}</div>
            </div>
          </div>
          <div class="form-cell">
            <div class="form-group">
              <label class="form-label">Дополнительная информация</label>
              <div class="text-muted">${details ? details : "—"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Handle selecting a diagram node in the project tree.
 *
 * Responsibilities:
 * - Resolve diagram by id in the current project export
 * - Switch the page to diagram mode
 * - Render diagram info into `#diagrams-container`
 *
 * @param {string} diagramId
 * @param {string} [modelId]
 * @param {string} [profileId]
 */
async function handleSelectDiagram(diagramId, modelId = "", profileId = "") {
  const project = await getProjectById(currentProjectId);
  if (!project) return;

  const context =
    modelId && modelId !== ""
      ? "model"
      : profileId && profileId !== ""
      ? "profile"
      : null;

  if (!context) {
    console.error("Diagram must belong to either a model or profile");
    return;
  }

  const diagram = findDiagramById(
    project,
    diagramId,
    modelId,
    profileId,
    context
  );

  // Selecting a diagram always switches to diagram mode
  if (!diagramMode?.isEnabled()) {
    diagramMode?.enter();
  } else {
    // Ensure layout is visible and item panel is cleared
    diagramMode?.sync({ clearItem: true });
  }

  const diagramsContainer = document.getElementById("diagrams-container");
  if (!diagramsContainer) {
    showToast("Не найден контейнер диаграмм", { type: "error" });
    return;
  }

  diagramsContainer.dataset.initialized = "1";
  diagramsContainer.innerHTML = renderDiagramPanel(diagram);
}

async function rerenderSelectedItemDetailsForCurrentMode() {
  const selected = document.querySelector(
    ".project-tree-item .tree-structure-name.selected"
  );
  if (!selected) return;

  const type = selected.getAttribute("data-type");
  if (type === "diagram") {
    const diagramId = selected.getAttribute("data-diagram-id");
    const modelId = selected.getAttribute("data-model-id") || "";
    const profileId = selected.getAttribute("data-profile-id") || "";
    if (diagramId) await handleSelectDiagram(diagramId, modelId, profileId);
    return;
  }

  if (type === "package") {
    const packageId = selected.getAttribute("data-package-id");
    const modelId = selected.getAttribute("data-model-id") || "";
    const profileId = selected.getAttribute("data-profile-id") || "";
    if (packageId) await handleSelectPackage(packageId, modelId, profileId);
    return;
  }

  if (type === "class") {
    const classId = selected.getAttribute("data-class-id");
    const modelId = selected.getAttribute("data-model-id") || "";
    const profileId = selected.getAttribute("data-profile-id") || "";
    let activeTab = getActiveClassTabName() || lastClassTabName || null;

    // When leaving diagram mode, item-general no longer exists.
    if (!diagramMode?.isEnabled() && activeTab === "item-general") {
      activeTab = null;
    }

    if (classId) await handleSelectClass(classId, modelId, profileId, activeTab);
  }
}

// ============================================================
// MODEL/PROFILE CRUD
// ============================================================
function handleEditModel(modelId) {
  if (!modelId) return;
  return openEditModelModal(modelId);
}

function handleImportModel(modelId) {
  if (!modelId) return;
  return openModelImportModal(modelId);
}

function handleExportModel() {
  alert("Функция экспорта в разработке");
}

function handleCheckModel() {
  alert("Функция проверки в разработке");
}

async function handleDeleteModel(modelId) {
  const model = await getModel(currentProjectId, modelId);
  if (!model) return;

  if (!confirm(`Удалить модель "${model.name}"?`)) return;

  await deleteModel(currentProjectId, modelId);
  await renderModelsContainer();
  await renderProjectTreeSidebar();

  if (String(selectedModelId) === String(modelId)) {
    selectedModelId = null;
  }
}

function handleEditProfileHeader(profileId) {
  if (!profileId) return;
  return openEditProfileModal(profileId);
}

function handleEditProfile(profileId) {
  if (!profileId) return;
  window.location.href = `/profile-editor.html?id=${encodeURIComponent(
    profileId
  )}`;
}

function handleImportProfile(profileId) {
  if (!profileId) return;
  return openProfileImportModal(profileId);
}

function handleExportProfile() {
  alert("Функция экспорта в разработке");
}

function handleCheckProfile() {
  alert("Функция проверки в разработке");
}

async function handleDeleteProfile(profileId) {
  const profile = await getProfile(currentProjectId, profileId);
  if (!profile) return;

  if (!confirm(`Удалить профиль "${profile.name}"?`)) return;

  await deleteProfile(currentProjectId, profileId);
  await renderProfilesContainer();
  await renderProjectTreeSidebar();

  if (String(selectedProfileId) === String(profileId)) {
    selectedProfileId = null;
  }
}

// ============================================================
// FIND PARENT CLASS HELPERS
// ============================================================

/**
 * Find class that contains the attribute
 * ✅ FIXED: Returns class WITH context (modelId/profileId)
 * @param {Object} project - Project object
 * @param {string} attrId - Attribute ID
 * @returns {Object|null} Parent class object with modelId/profileId or null
 */
function findClassByAttributeId(project, attrId) {
  const searchInPackages = (packages, modelId = "", profileId = "") => {
    for (const pkg of packages) {
      if (pkg.classes) {
        for (const cls of pkg.classes) {
          if (cls.attributes) {
            const hasAttribute = cls.attributes.some(a => a.id === attrId);
            if (hasAttribute) {
              // ✅ Return class with context
              return {
                ...cls,
                modelId: cls.modelId || modelId,
                profileId: cls.profileId || profileId
              };
            }
          }
        }
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages, modelId, profileId);
        if (found) return found;
      }
    }
    return null;
  };

  // Search in models
  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages?.[0]?.packages) {
        const found = searchInPackages(
          model.rootPackages[0].packages,
          model.id,  // ✅ Pass modelId
          ""         // ✅ profileId is empty for models
        );
        if (found) return found;
      }
    }
  }

  // Search in profiles
  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages?.[0]?.packages) {
        const found = searchInPackages(
          profile.rootPackages[0].packages,
          "",          // ✅ modelId is empty for profiles
          profile.id   // ✅ Pass profileId
        );
        if (found) return found;
      }
    }
  }

  return null;
}

/**
 * Find class that contains the link
 * ✅ FIXED: Returns class WITH context (modelId/profileId)
 * @param {Object} project - Project object
 * @param {string} linkId - Link ID
 * @returns {Object|null} Parent class object with modelId/profileId or null
 */
function findClassByLinkId(project, linkId) {
  const searchInPackages = (packages, modelId = "", profileId = "") => {
    for (const pkg of packages) {
      if (pkg.classes) {
        for (const cls of pkg.classes) {
          if (cls.links) {
            const hasLink = cls.links.some(l => l.linkId === linkId);
            if (hasLink) {
              // ✅ Return class with context
              return {
                ...cls,
                modelId: cls.modelId || modelId,
                profileId: cls.profileId || profileId
              };
            }
          }
        }
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages, modelId, profileId);
        if (found) return found;
      }
    }
    return null;
  };

  // Search in models
  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages?.[0]?.packages) {
        const found = searchInPackages(
          model.rootPackages[0].packages,
          model.id,  // ✅ Pass modelId
          ""         // ✅ profileId is empty
        );
        if (found) return found;
      }
    }
  }

  // Search in profiles
  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages?.[0]?.packages) {
        const found = searchInPackages(
          profile.rootPackages[0].packages,
          "",          // ✅ modelId is empty
          profile.id   // ✅ Pass profileId
        );
        if (found) return found;
      }
    }
  }

  return null;
}

/**
 * Find class that contains the literal
 * ✅ FIXED: Returns class WITH context (modelId/profileId)
 * @param {Object} project - Project object
 * @param {string} literalId - Literal ID
 * @returns {Object|null} Parent class object with modelId/profileId or null
 */
function findClassByLiteralId(project, literalId) {
  const searchInPackages = (packages, modelId = "", profileId = "") => {
    for (const pkg of packages) {
      if (pkg.classes) {
        for (const cls of pkg.classes) {
          if (cls.literals) {
            const hasLiteral = cls.literals.some(l => l.id === literalId);
            if (hasLiteral) {
              // ✅ Return class with context
              return {
                ...cls,
                modelId: cls.modelId || modelId,
                profileId: cls.profileId || profileId
              };
            }
          }
        }
      }
      if (pkg.subPackages) {
        const found = searchInPackages(pkg.subPackages, modelId, profileId);
        if (found) return found;
      }
    }
    return null;
  };

  // Search in models
  if (project.models) {
    for (const model of project.models) {
      if (model.rootPackages?.[0]?.packages) {
        const found = searchInPackages(
          model.rootPackages[0].packages,
          model.id,  // ✅ Pass modelId
          ""         // ✅ profileId is empty
        );
        if (found) return found;
      }
    }
  }

  // Search in profiles
  if (project.profiles) {
    for (const profile of project.profiles) {
      if (profile.rootPackages?.[0]?.packages) {
        const found = searchInPackages(
          profile.rootPackages[0].packages,
          "",          // ✅ modelId is empty
          profile.id   // ✅ Pass profileId
        );
        if (found) return found;
      }
    }
  }

  return null;
}


/**
 * Select parent class element in tree
 * @param {Object} parentClass - Parent class object with modelId/profileId
 */
function selectParentClassInTree(parentClass) {
  if (!parentClass) return;

  const modelId = parentClass.modelId || "";
  const profileId = parentClass.profileId || "";
  const context = modelId && modelId !== "" ? "model" :  "profile";

  const selector = context === "model"
    ? `[data-type="class"][data-class-id="${parentClass.id}"][data-model-id="${modelId}"]`
    : `[data-type="class"][data-class-id="${parentClass.id}"][data-profile-id="${profileId}"]`;

  const classEl = document.querySelector(selector);
  if (classEl) {
    setSelectedTreeItem(classEl);
  }
}


// ============================================================
// UTILITY
// ============================================================
function setSelectedTreeItem(el) {
  const previouslySelected = document.querySelector(
    ".project-tree-item * .tree-structure-name.selected"
  );
  if (previouslySelected) previouslySelected.classList.remove("selected");
  if (el) {
    el.classList.add("selected");
    selectedTreeSnapshot = snapshotTreeEl(el);
  }
}
