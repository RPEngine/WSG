import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 3000;

const isRenderRuntime = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
const renderInternalDatabaseUrl = process.env.RENDER_INTERNAL_DATABASE_URL || process.env.INTERNAL_DATABASE_URL;
const sharedDatabaseUrl = process.env.DATABASE_URL || process.env.RENDER_EXTERNAL_DATABASE_URL;

export const DATABASE_CONNECTION_URL = isRenderRuntime
  ? renderInternalDatabaseUrl || sharedDatabaseUrl || ""
  : sharedDatabaseUrl || renderInternalDatabaseUrl || "";

export const DATABASE_SSL_MODE = String(process.env.PGSSLMODE || "").trim().toLowerCase();
