// Nautilus.CIM - Shared Sidebar Script

// Sidebar resize functionality
let isResizing = false;
let startX = 0;
let startWidth = 0;

function initSidebarResize() {
    const resizeHandle = document.getElementById('sidebar-resize-handle');
    if (!resizeHandle) return;
    
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = document.getElementById('sidebar').offsetWidth;
        document.body.style.userSelect = 'none';
        resizeHandle.style.backgroundColor = 'var(--primary-color)';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const diff = e.clientX - startX;
        const newWidth = Math.max(150, Math.min(500, startWidth + diff)); // Min 150px, Max 500px
        
        document.getElementById('sidebar').style.width = newWidth + 'px';
        localStorage.setItem('sidebarWidth', newWidth);
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.userSelect = '';
            const resizeHandle = document.getElementById('sidebar-resize-handle');
            if (resizeHandle) {
                resizeHandle.style.backgroundColor = '';
            }
        }
    });
}

function restoreSidebarWidth() {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
        document.getElementById('sidebar').style.width = savedWidth + 'px';
    }
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
    
    // Restore sidebar width
    restoreSidebarWidth();
    
    // Initialize resize functionality
    initSidebarResize();
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
    const expandedProjects = JSON.parse(localStorage.getItem('expandedProjects') || '{}');
    
    if (!projects || projects.length === 0) {
        projectsList.innerHTML = '<div class="nav-tree-item-link no-projects-tree">Нет проектов</div>';
        return;
    }
    
    const html = projects.map(p => {
        const isExpanded = expandedProjects[p.id];
        const isCurrentProject = currentProjectId === p.id;
        
        return `
            <div class="project-tree-item">
                <div class="project-tree-header ${isCurrentProject ? 'active' : ''}">
                    <button class="project-expand-btn" onclick="toggleProjectStructure(${p.id}); event.stopPropagation();" 
                            aria-expanded="${isExpanded ? 'true' : 'false'}">
                        <span class="expand-icon">${isExpanded ? '▼' : '▶'}</span>
                    </button>
                    <span class="project-name" onclick="selectProject(${p.id}); event.stopPropagation();" title="${p.name}">
                        📦 ${p.name}
                    </span>
                </div>
                ${isExpanded ? `
                    <div class="project-structure">
                        ${p.models && p.models.length > 0 ? `
                            <div class="structure-section">
                                <div class="structure-title">📋 Модели (${p.models.length})</div>
                                <div class="structure-items">
                                    ${p.models.map(m => `
                                        <div class="structure-item">🔷 ${m.name || 'Модель без названия'}</div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${p.profiles && p.profiles.length > 0 ? `
                            <div class="structure-section">
                                <div class="structure-title">⚙️ Профили (${p.profiles.length})</div>
                                <div class="structure-items">
                                    ${p.profiles.map(pr => `
                                        <div class="structure-item">⚡ ${pr.name || 'Профиль без названия'}</div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        ${(!p.models || p.models.length === 0) && (!p.profiles || p.profiles.length === 0) ? `
                            <div class="structure-empty">Нет моделей и профилей</div>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    projectsList.innerHTML = html;
}

function toggleProjectStructure(projectId) {
    const expandedProjects = JSON.parse(localStorage.getItem('expandedProjects') || '{}');
    
    if (expandedProjects[projectId]) {
        delete expandedProjects[projectId];
    } else {
        expandedProjects[projectId] = true;
    }
    
    localStorage.setItem('expandedProjects', JSON.stringify(expandedProjects));
    renderProjectsTree();
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
