import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prisma ORM v7: datasource URL lives here (not in schema.prisma)
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  },
});
