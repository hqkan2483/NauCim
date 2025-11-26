// Nautilus.CIM - Index Page Script

document.addEventListener('DOMContentLoaded', async () => {
    await loadSampleData();
    updateCurrentProject();
    renderDashboard();
    renderProjectsTree();
    restoreSidebarState();
    restoreProjectsTreeState();
});

// Dashboard rendering
function renderDashboard() {
    renderRecentProjects();
    renderAllProjects();
}

function renderRecentProjects() {
    const projects = getAllProjects();
    const recent = projects.slice(0, 3); // Показать 3 последних проекта
    
    const html = recent.map(p => `
        <div class="project-card" onclick="selectProject(${p.id})">
            <div class="project-card-header">
                <div>
                    <div class="project-card-title">${p.name}</div>
                    <div class="project-card-meta">Версия ${p.version} • Создан: ${p.createdAt || 'N/A'}</div>
                </div>
                <div class="project-card-actions">
                    <button class="btn btn-primary btn-small" onclick="openProject(${p.id})">Открыть →</button>
                </div>
            </div>
            <div class="project-card-description">
                ${p.description || 'Нет описания'}
            </div>
        </div>
    `).join('');
    
    document.getElementById('recent-projects').innerHTML = html || '<div class="no-items-message">Нет проектов</div>';
}

function renderAllProjects() {
    // Функция оставлена для совместимости, может быть расширена позже
}

function selectProject(projectId) {
    // Сохранить выбранный проект
    setCurrentProject(projectId);
    
    // Обновить отображение
    updateCurrentProject();
    renderDashboard();
    renderProjectsTree();
}

// Открыть проект из карточки: сделать текущим и перейти к деталям
function openProject(projectId) {
    setCurrentProject(projectId);
    // Переход на страницу деталей проекта
    window.location.href = 'project-details.html';
}

// Sidebar toggle functionality
// Функции переведены в sidebar.js
