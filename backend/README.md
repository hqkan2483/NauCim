# NauCim Backend (local)

Local Node.js backend for NauCim with SQLite + Prisma.

## Setup

```bash
cd backend
copy .env.example .env
npm install
npm run prisma:migrate
npm run prisma:generate
npm run dev
```

## API

- `GET /api/health`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/import/project` (canonical Project JSON)
- `GET /api/export/project/:id`

By default the server listens on `PORT` from `.env`.
