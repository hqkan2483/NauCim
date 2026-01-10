import express from "express";
import cors from "cors";
import { getEnv } from "./utils/env.js";
import { sendError } from "./utils/http.js";
import { projectsRouter } from "./routes/projects.js";
import { importExportRouter } from "./routes/import-export.js";

const app = express();

const corsOrigin = getEnv("CORS_ORIGIN", "*");
app.use(
  cors({
    origin: corsOrigin === "*" ? true : corsOrigin,
    credentials: false,
  })
);

app.use(express.json({ limit: "100mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use("/api/projects", projectsRouter);
app.use("/api", importExportRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  return sendError(res, 500, "Internal Server Error");
});

const port = Number(getEnv("PORT", "5179"));
app.listen(port, () => {
  console.log(`NauCim backend listening on http://localhost:${port}`);
});
