назначение файлов:

dataloader.js - загрузка данных из файлов json и формирование структуры данных. (массив проектов c моделями и профилями) экспортирует loadTestData () Напрямую не используется

current-project-state.js - управление состоянием текущего проекта - получает и сохраняет значение id текущего проекта из localStorage, экспортирует getCurrentProjectId(), setCurrentProject(projectId). Напрямую не используется.

memory-store.js - формирование memoryStorage, Интерфейс для работы memoryStorage. принимает параметром массив данных из loadTestData (). Содержит методы для инициализации хранилища, получения, добавления, обновления проектов. Экспортирует объект MemoryStore с методами: initialize, getAllProjects(), getProjectById(id), addProject(project), updateProject(project), deleteProject(id) Напрямую не используется

project-service.js - Сервис для работы с проектами. Импортирует MemoryStore из memory-store.js, loadTestData из dataloader.js, getCurrentProjectId,
setCurrentProjectId, из current-project-state.js. Экспортирует функции: getAllProjects(), getProjectById(id), createProject(project), updateProject(project), deleteProject(id). Используется как основной интерфейс работы с данными на страницах.
