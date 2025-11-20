// Nautilus.CIM - Shared Sidebar Script

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
let lastProjectsClickTime = 0;

function handleProjectsClick() {
    const now = Date.now();
    const timeSinceLastClick = now - lastProjectsClickTime;
    lastProjectsClickTime = now;
    
    // Если двойной клик (менее 300ms между кликами)
    if (timeSinceLastClick < 300) {
        window.location.href = 'projects.html';
        return;
    }
    
    // Одиночный клик - раскрыть/закрыть дерево
    toggleProjectsTree();
}

function toggleProjectsTree() {
    const container = document.getElementById('projects-tree-container');
    const button = document.querySelector('.nav-tree-toggle');
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
        container.classList.add('nav-tree-collapsed');
        button.setAttribute('aria-expanded', 'false');
        // Сохранить состояние дерева в localStorage
        localStorage.setItem('projectsTreeExpanded', 'false');
    } else {
        container.classList.remove('nav-tree-collapsed');
        button.setAttribute('aria-expanded', 'true');
        // Сохранить состояние дерева в localStorage
        localStorage.setItem('projectsTreeExpanded', 'true');
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

// Restore projects tree state on page load
function restoreProjectsTreeState() {
    const isExpanded = localStorage.getItem('projectsTreeExpanded') === 'true';
    const container = document.getElementById('projects-tree-container');
    const button = document.querySelector('.nav-tree-toggle');
    
    if (isExpanded) {
        container.classList.remove('nav-tree-collapsed');
        button.setAttribute('aria-expanded', 'true');
        renderProjectsTree();
    } else {
        container.classList.add('nav-tree-collapsed');
        button.setAttribute('aria-expanded', 'false');
    }
}
