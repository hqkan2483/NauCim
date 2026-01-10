# NauCim Backend (local)

Local Node.js backend for NauCim with SQLite + Prisma.

## Data model notes

- Canonical data contract: see [docs/DATA_STRUCTURES.md](../docs/DATA_STRUCTURES.md).
- **Source of truth for relationships**:
  - `GeneralizationLink` (inheritance) and
  - `AssociationLink` + `AssociationLinkEnd[]` (association ends)

`Link` / `ClassLink` are treated as **derived/legacy** representations produced by business logic and are planned to be phased out.

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
