// Nautilus.CIM - Projects Page Script

let currentEditProjectId = null;

document.addEventListener('DOMContentLoaded', async () => {
    loadSampleData();
    await loadFoclData();
    await initializeFoclProject();
    updateCurrentProject();
    renderProjects();
    renderProjectsTree();
    restoreSidebarState();
    restoreProjectsTreeState();
});

function renderProjects() {
    const projects = getProjects();
    const html = projects.map(p => `
        <div class="card">
            <div class="flex-between mb-10">
                <div>
                    <div style="font-weight:600; font-size:16px; margin-bottom:5px;">${p.name}</div>
                    <div style="font-size:13px; color:var(--text-secondary);">Версия ${p.version} • Создан: ${p.createdAt || 'N/A'}</div>
                </div>
                <div class="flex gap-10">
                    <button class="btn btn-secondary btn-small" onclick="editProject(${p.id})">✏️ Изменить</button>
                    <button class="btn btn-primary btn-small" onclick="openProject(${p.id})">Открыть →</button>
                </div>
            </div>
            <div style="margin-top:10px; color:var(--text-secondary); font-size:14px;">
                ${p.description || 'Нет описания'}
            </div>
            <div style="margin-top:15px; display:flex; gap:15px; font-size:13px;">
                <span>📋 Модели: <strong>${p.models.length}</strong></span>
                <span>⚙️ Профили: <strong>${p.profiles.length}</strong></span>
            </div>
        </div>
    `).join('');

    document.getElementById('projects-list').innerHTML = html || '<div style="text-align:center; color:var(--text-secondary); padding:40px;">Нет проектов</div>';
}

function filterProjects() {
    const query = document.getElementById('search-projects').value.toLowerCase();
    const projects = getProjects();
    const filtered = projects.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.description && p.description.toLowerCase().includes(query))
    );

    const html = filtered.map(p => `
        <div class="card">
            <div class="flex-between mb-10">
                <div>
                    <div style="font-weight:600; font-size:16px; margin-bottom:5px;">${p.name}</div>
                    <div style="font-size:13px; color:var(--text-secondary);">Версия ${p.version} • Создан: ${p.createdAt || 'N/A'}</div>
                </div>
                <div class="flex gap-10">
                    <button class="btn btn-secondary btn-small" onclick="editProject(${p.id})">✏️ Изменить</button>
                    <button class="btn btn-primary btn-small" onclick="openProject(${p.id})">Открыть →</button>
                </div>
            </div>
            <div style="margin-top:10px; color:var(--text-secondary); font-size:14px;">
                ${p.description || 'Нет описания'}
            </div>
            <div style="margin-top:15px; display:flex; gap:15px; font-size:13px;">
                <span>📋 Модели: <strong>${p.models.length}</strong></span>
                <span>⚙️ Профили: <strong>${p.profiles.length}</strong></span>
            </div>
        </div>
    `).join('');

    document.getElementById('projects-list').innerHTML = html || '<div style="text-align:center; color:var(--text-secondary); padding:40px;">Проекты не найдены</div>';
}

function createProject() {
    const name = document.getElementById('project-name').value.trim();
    if (!name) {
        alert('Введите название проекта');
        return;
    }

    const projects = getProjects();
    const newProject = {
        id: Math.max(...projects.map(p => p.id), 0) + 1,
        name: name,
        description: document.getElementById('project-desc').value,
        version: document.getElementById('project-version').value,
        createdAt: new Date().toISOString().split('T')[0],
        models: [],
        profiles: []
    };

    projects.push(newProject);
    saveProjects(projects);
    closeModal('new-project-modal');

    // Clear form
    document.getElementById('project-name').value = '';
    document.getElementById('project-desc').value = '';
    document.getElementById('project-version').value = '1.0';

    renderProjects();
    renderProjectsTree();
    alert('Проект успешно создан!');
}

function editProject(projectId) {
    currentEditProjectId = projectId;
    const project = getProject(projectId);

    document.getElementById('edit-project-name').value = project.name;
    document.getElementById('edit-project-desc').value = project.description || '';
    document.getElementById('edit-project-version').value = project.version;

    openModal('edit-project-modal');
}

function saveProjectEdit() {
    if (!currentEditProjectId) return;

    const projects = getProjects();
    const project = projects.find(p => p.id === currentEditProjectId);

    project.name = document.getElementById('edit-project-name').value;
    project.description = document.getElementById('edit-project-desc').value;
    project.version = document.getElementById('edit-project-version').value;

    saveProjects(projects);
    closeModal('edit-project-modal');
    renderProjects();
    renderProjectsTree();
    alert('Проект успешно обновлён!');
}

function openProject(projectId) {
    setCurrentProject(projectId);
    window.location.href = 'project-details.html';
}

// Sidebar toggle functionality
// Функции переведены в sidebar.js

function selectProject(projectId) {
    // Сохранить выбранный проект
    setCurrentProject(projectId);
    
    // Обновить отображение
    updateCurrentProject();
    renderProjects();
    renderProjectsTree();
}
