// Nautilus.CIM - Index Page Script

document.addEventListener('DOMContentLoaded', () => {
    loadSampleData();
    updateCurrentProject();
    renderDashboard();
    renderProjectsTree();
    restoreSidebarState();
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

// Sidebar toggle functionality
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    
    sidebar.classList.toggle('collapsed');
    toggleBtn.classList.toggle('sidebar-open');
    
    // Save state to localStorage
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
}

// Restore sidebar state on page load
function restoreSidebarState() {
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        document.getElementById('sidebar').classList.add('collapsed');
        document.querySelector('.sidebar-toggle').classList.remove('sidebar-open');
    }
}

// Projects Tree Navigation
function handleProjectsClick() {
    // Раскрыть/закрыть дерево
    toggleProjectsTree();
    
    // Перейти на страницу проектов
    window.location.href = 'projects.html';
}

function toggleProjectsTree() {
    const container = document.getElementById('projects-tree-container');
    const button = document.querySelector('.nav-tree-toggle');
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
        container.classList.add('nav-tree-collapsed');
        button.setAttribute('aria-expanded', 'false');
    } else {
        container.classList.remove('nav-tree-collapsed');
        button.setAttribute('aria-expanded', 'true');
        renderProjectsTree();
    }
}

function renderProjectsTree() {
    const projectsList = document.getElementById('projects-list-tree');
    const projects = getAllProjects();
    const currentProjectId = getCurrentProjectId();
    
    if (!projects || projects.length === 0) {
        projectsList.innerHTML = '<div class="nav-tree-item-link no-projects-tree">Нет проектов</div>';
        return;
    }
    
    const html = projects.map(p => `
        <div class="nav-tree-item-link ${currentProjectId === p.id ? 'active' : ''}" 
             onclick="selectProject(${p.id}); event.stopPropagation();" 
             title="${p.name}">
            📦 ${p.name}
        </div>
    `).join('');
    
    projectsList.innerHTML = html;
}
