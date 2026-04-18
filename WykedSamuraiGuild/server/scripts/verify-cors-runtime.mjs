#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const renderYamlPath = path.join(repoRoot, "render.yaml");
const serverPackagePath = path.join(repoRoot, "server", "package.json");
const serverEntryPath = path.join(repoRoot, "server", "server.js");

const backendBaseUrl = (process.argv[2] || process.env.WSG_BACKEND_BASE_URL || "https://wyked-samurai-backend.onrender.com").replace(/\/+$/, "");
const expectedOrigin = process.argv[3] || "https://wsg-web.onrender.com";
const endpoints = ["/api/profile/me", "/api/connections"];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function checkLocalWiring() {
  const renderYaml = fs.readFileSync(renderYamlPath, "utf8");
  const serverPackage = JSON.parse(fs.readFileSync(serverPackagePath, "utf8"));
  const serverEntry = fs.readFileSync(serverEntryPath, "utf8");

  assert(renderYaml.includes("name: wyked-samurai-backend"), "render.yaml does not define wyked-samurai-backend service.");
  assert(renderYaml.includes("rootDir: server"), "render.yaml backend rootDir is not server.");
  assert(renderYaml.includes("startCommand: npm start"), "render.yaml backend startCommand is not npm start.");

  assert(serverPackage.main === "server.js", "server/package.json main is not server.js.");
  assert(serverPackage.scripts?.start === "node server.js", "server/package.json start script is not node server.js.");

  assert(serverEntry.includes('const RENDER_WEB_ORIGIN = "https://wsg-web.onrender.com";'), "server.js is missing RENDER_WEB_ORIGIN constant.");
  assert(serverEntry.includes('const isProduction = process.env.NODE_ENV === "production";'), "server.js is missing NODE_ENV production guard.");
  assert(serverEntry.includes('app.use("/api", (req, res, next) => {'), "server.js is missing /api CORS middleware.");

  console.log("✓ Local wiring checks passed");
}

async function checkRemoteCors() {
  for (const endpoint of endpoints) {
    const url = `${backendBaseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "OPTIONS",
      headers: {
        Origin: expectedOrigin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });

    const allowOrigin = response.headers.get("access-control-allow-origin");
    const allowMethods = response.headers.get("access-control-allow-methods");

    assert(response.status === 204, `${endpoint} preflight returned status ${response.status}, expected 204.`);
    assert(allowOrigin === expectedOrigin, `${endpoint} Access-Control-Allow-Origin was '${allowOrigin}', expected '${expectedOrigin}'.`);
    assert(Boolean(allowMethods), `${endpoint} missing Access-Control-Allow-Methods header.`);

    console.log(`✓ ${endpoint} preflight OK (status ${response.status}, origin ${allowOrigin})`);
  }
}

(async () => {
  checkLocalWiring();
  await checkRemoteCors();
  console.log("All CORS runtime verification checks passed.");
})().catch((error) => {
  console.error(`CORS runtime verification failed: ${error.message}`);
  process.exit(1);
});
