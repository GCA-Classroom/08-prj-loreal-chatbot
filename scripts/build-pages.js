import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.resolve(projectRoot, "dist");
const configuredWorkerUrl = process.env.WORKER_URL;

if (!configuredWorkerUrl) {
  throw new Error("Set WORKER_URL to the deployed Worker /api/chat endpoint before building.");
}

let workerUrl;

try {
  workerUrl = new URL(configuredWorkerUrl);
} catch {
  throw new Error("WORKER_URL must be an absolute URL.");
}

const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(workerUrl.hostname);

if (workerUrl.pathname !== "/api/chat" || workerUrl.search || workerUrl.hash) {
  throw new Error("WORKER_URL must end with /api/chat and cannot include a query or fragment.");
}

if (workerUrl.protocol !== "https:" && !(workerUrl.protocol === "http:" && isLocalDevelopment)) {
  throw new Error("WORKER_URL must use HTTPS, except for localhost development.");
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

for (const file of ["index.html", "style.css", "script.js"]) {
  await cp(path.join(projectRoot, file), path.join(outputDirectory, file));
}

await cp(path.join(projectRoot, "img"), path.join(outputDirectory, "img"), { recursive: true });

await writeFile(
  path.join(outputDirectory, "runtime-config.js"),
  `window.BEAUTY_ADVISOR_WORKER_URL = ${JSON.stringify(workerUrl.href)};\n`
);
