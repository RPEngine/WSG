#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const renderYamlPath = path.join(repoRoot, "render.yaml");
const serverPackagePath = path.join(repoRoot, "server", "package.json");
const serverEntryPath = path.join(repoRoot, "server", "server.js");

const backendBaseUrl = (process.argv[2] || process.env.WSG_BACKEND_BASE_URL || "https://wsg-7hmk.onrender.com").replace(/\/+$/, "");
const expectedOrigin = process.argv[3] || "https://wsg-web.onrender.com";
const endpoints = ["/api/profile/me", "/api/connections"];
const diagnosticsEndpoint = "/api/debug/cors-runtime";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function checkLocalWiring() {
  const renderYaml = fs.readFileSync(renderYamlPath, "utf8");
  const serverPackage = JSON.parse(fs.readFileSync(serverPackagePath, "utf8"));
  const serverEntry = fs.readFileSync(serverEntryPath, "utf8");

  assert(renderYaml.includes("name: wsg-7hmk"), "render.yaml does not define wsg-7hmk backend service.");
  assert(renderYaml.includes("rootDir: server"), "render.yaml backend rootDir is not server.");
  assert(renderYaml.includes("startCommand: npm start"), "render.yaml backend startCommand is not npm start.");

  assert(serverPackage.main === "server.js", "server/package.json main is not server.js.");
  assert(serverPackage.scripts?.start === "node server.js", "server/package.json start script is not node server.js.");

  assert(serverEntry.includes("const DEFAULT_ALLOWED_ORIGINS = [\"https://wsg-web.onrender.com\"];"), "server.js is missing expected default allowed origin configuration.");
  assert(serverEntry.includes("const EFFECTIVE_ALLOWED_ORIGINS = ALLOWED_ORIGINS.length > 0"), "server.js is missing effective allowed origins configuration.");
  assert(serverEntry.includes('app.use(cors(corsOptions));'), "server.js is missing global CORS middleware registration.");
  assert(serverEntry.includes('app.options("*", cors(corsOptions));'), "server.js is missing global OPTIONS preflight CORS handler.");

  console.log("✓ Local wiring checks passed");
}

async function checkRemoteCors() {
  for (const endpoint of endpoints) {
    const url = `${backendBaseUrl}${endpoint}`;
    let response;
    try {
      response = await fetch(url, {
        method: "OPTIONS",
        headers: {
          Origin: expectedOrigin,
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "authorization,content-type",
        },
      });
    } catch (error) {
      throw new Error(`${endpoint} preflight network failure against ${backendBaseUrl}: ${error.message}`);
    }

    const allowOrigin = response.headers.get("access-control-allow-origin");
    const allowMethods = response.headers.get("access-control-allow-methods");

    assert(response.status === 204, `${endpoint} preflight returned status ${response.status}, expected 204.`);
    assert(allowOrigin === expectedOrigin, `${endpoint} Access-Control-Allow-Origin was '${allowOrigin}', expected '${expectedOrigin}'.`);
    assert(Boolean(allowMethods), `${endpoint} missing Access-Control-Allow-Methods header.`);

    console.log(`✓ ${endpoint} preflight OK (status ${response.status}, origin ${allowOrigin})`);
  }
}

async function checkRemoteDiagnostics() {
  const url = `${backendBaseUrl}${diagnosticsEndpoint}`;
  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Origin: expectedOrigin,
      },
    });
  } catch (error) {
    throw new Error(`${diagnosticsEndpoint} network failure against ${backendBaseUrl}: ${error.message}`);
  }

  if (response.status === 404) {
    throw new Error(`${diagnosticsEndpoint} returned 404. Enable diagnostics with WSG_ENABLE_CORS_DIAGNOSTICS=true on the backend.`);
  }

  assert(response.ok, `${diagnosticsEndpoint} returned status ${response.status}.`);

  const payload = await response.json();
  assert(payload?.diagnosticsEnabled === true, `${diagnosticsEndpoint} did not report diagnosticsEnabled=true.`);
  assert(Array.isArray(payload?.effectiveAllowedOrigins), `${diagnosticsEndpoint} response missing effectiveAllowedOrigins array.`);
  assert(payload.effectiveAllowedOrigins.includes(expectedOrigin), `${diagnosticsEndpoint} does not include expected origin '${expectedOrigin}' in effectiveAllowedOrigins.`);

  console.log(`✓ ${diagnosticsEndpoint} diagnostics OK`, {
    renderServiceName: payload?.renderServiceName || null,
    renderGitCommit: payload?.renderGitCommit || null,
    effectiveAllowedOrigins: payload?.effectiveAllowedOrigins,
    originAllowed: payload?.originAllowed,
  });
}

(async () => {
  checkLocalWiring();
  await checkRemoteDiagnostics();
  await checkRemoteCors();
  console.log("All CORS runtime verification checks passed.");
})().catch((error) => {
  console.error(`CORS runtime verification failed: ${error.message}`);
  process.exit(1);
});
