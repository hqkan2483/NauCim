// ============================================================
// MEMORY STORE - Global In-Memory Data Storage
// ============================================================
const MemoryStore = {
  // In-memory storage for all data
  store: {
    projects: [],
  },

  // Initialize store with sample data
 initialize({ projects = [] } = {}) {
    this.store.projects = projects;
    console.log("✅ MemoryStore initialized with", this.store.projects.length, "projects");
  },

  // Get all projects
  getProjects() {
    return this.store.projects || [];
  },

  // Get single project by ID
  getProject(id) {
    return this.store.projects.find((p) => p.id === id) || null;
  },

  // Add project
  addProject(project) {
    this.store.projects.push(project);
    return project;
  },

  // Update project
  updateProject(id, updates) {
    const project = this.getProject(id);
    if (project) {
      Object.assign(project, updates);
    }
    return project;
  },

  // Delete project
  deleteProject(id) {
    this.store.projects = this.store.projects.filter((p) => p.id !== id);
  },
};

export { MemoryStore };
