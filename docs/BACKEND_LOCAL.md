# Local Backend (Node.js + SQLite)

This project can run with a local backend (variant A): static frontend + API on `localhost`.

## 1) Start backend

See [backend/README.md](../backend/README.md).

## 2) Enable backend mode in the frontend

Backend-режим включается **одной строкой конфигурации на старте**:

- Открой: [src/services/persistence/persistence-config.js](../src/services/persistence/persistence-config.js)
- Поставь:
  - `const BACKEND_ENABLED_ON_STARTUP = true;` — чтобы использовать backend
  - `const BACKEND_ENABLED_ON_STARTUP = false;` — чтобы использовать локальные тестовые данные

Важно: этот модуль **на каждом старте** вызывает `setBackendEnabled(BACKEND_ENABLED_ON_STARTUP)` и выставляет `localStorage.cim.dataSource` автоматически. Поэтому ручная правка `cim.dataSource` в DevTools переживёт только текущую сессию и будет перезаписана при перезагрузке.

### (Optional) Change backend base URL

По умолчанию используется `http://localhost:5179`, но URL можно переопределить через localStorage:

```js
localStorage.setItem("cim.backendBaseUrl", "http://localhost:5179");
```

После смены значения перезагрузи страницу.

## 3) What happens

- `appDataInit()` в [src/services/project-service.js](../src/services/project-service.js) при включенном backend:
  - берет список проектов из `GET /api/projects`
  - подгружает полный JSON для каждого через `GET /api/export/project/:id`
  - инициализирует `MemoryStore`
- Любые изменения проектов через `MemoryStore.addProject/updateProject/deleteProject` автоматически сохраняются в backend (debounce ~400ms).

### Notes about links (relationships)

- В каноническом контракте источником правды о связях являются:
  - `GeneralizationLink` (наследование)
  - `AssociationLink` + `AssociationLinkEnd[]` (ассоциации и их концы)
- `Class.links` / `ClassLink` (и backend-таблица `Link`) считаются **производными/legacy** данными, которые строятся бизнес-логикой и в перспективе будут убраны.

### Quick checks

- Проверка, что режим включен: `localStorage.getItem("cim.dataSource") === "backend"`
- Проверка URL: `localStorage.getItem("cim.backendBaseUrl")`

### Import/Export notes

- Экспорт проекта: `GET /api/export/project/:id`
- Импорт проекта: `POST /api/import/project`
- Импорт графа в существующую модель/профиль:
  - `POST /api/models/:id/import`
  - `POST /api/profiles/:id/import`
- Ограничение: во входящих данных `rootPackages` должен содержать **ровно один** элемент (или используйте поле `rootPackage`).
