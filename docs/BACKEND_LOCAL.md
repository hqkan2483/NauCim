# Local Backend (Node.js + SQLite)

This project can run with a local backend (variant A): static frontend + API on `localhost`.

## 1) Start backend

See [backend/README.md](../backend/README.md).

## 2) Enable backend mode in the frontend

Frontend переключается в одном месте через localStorage:

```js
// Enable
localStorage.setItem("cim.dataSource", "backend");

// Optional: change backend URL
localStorage.setItem("cim.backendBaseUrl", "http://localhost:5179");

// Disable (use local test data)
localStorage.setItem("cim.dataSource", "local");
```

После смены значения перезагрузи страницу.

## 3) What happens

- `appDataInit()` в [src/services/project-service.js](../src/services/project-service.js) при включенном backend:
  - берет список проектов из `GET /api/projects`
  - подгружает полный JSON для каждого через `GET /api/export/project/:id`
  - инициализирует `MemoryStore`
- Любые изменения проектов через `MemoryStore.addProject/updateProject/deleteProject` автоматически сохраняются в backend (debounce ~400ms).
