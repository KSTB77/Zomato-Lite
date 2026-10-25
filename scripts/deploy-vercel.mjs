// scripts/deploy-vercel.mjs -- uploads the project's tracked files to Vercel
// (the PATH the git handshake normally provides) and creates a production deployment.
// Greed: reads VERCEL_TOKEN from .env.local like every other tool in this project.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import crypto from "node:crypto";

const ROOT = process.cwd();
const TEAM = "team_uIds04lQivAJs4pbo6h2WKAy";
const PROJECT = "prj_s6hI0alTUydW1snZNZlYBa3C9lJ5";
const API = "https://api.vercel.com";

function readEnv(key) {
  const line = fs
    .readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split(/\r?\n/)
    .find((l) => l.startsWith(key + "="));
  if (!line) throw new Error(key + " not found in .env.local");
  return line.slice(key.length + 1).trim();
}

const token = readEnv("VERCEL_TOKEN");
const headers = { Authorization: "Bearer " + token, Accept: "application/json" };

// 1. The exact file list: what Git tracks (no .env.local, no node_modules, no .next).
// Git never tracked .env.local (M5 proof), so this list is safe by construction.
const files = execSync('git ls-files -z', { cwd: ROOT })
  .toString()
  .split("\0")
  .filter(Boolean);

console.log(`Files to upload: ${files.length}`);

// 2. Upload each file as a blob: bytes + an SHA-1 digest header so Vercel
// doesn't need to recompute the hash.
const manifest = [];
for (const rel of files) {
  const bytes = fs.readFileSync(path.join(ROOT, rel));
  const sha = crypto.createHash("sha1").update(bytes).digest("hex");
  const res = await fetch(API + "/v2/files?teamId=" + TEAM, {
    method: "POST",
    headers: { ...headers, "x-vercel-digest": sha, "Content-Type": "application/octet-stream" },
    body: bytes,
  });
  if (!res.ok && res.status !== 409) {
    // duplicate uploads are fine (already stored)
    const text = await res.text();
    throw new Error(`Upload failed for ${rel}: HTTP ${res.status} ${text}`);
  }
  manifest.push({ file: rel, sha });
}
console.log("Uploads complete.");

// 3. Create the production deployment from the uploaded blobs.
const deployRes = await fetch(API + "/v13/deployments?teamId=" + TEAM, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "zomato-lite",
    project: PROJECT,
    target: "production",
    // Re-assign our chosen "main URL" to this new deployment on every deploy,
    // so it always points at whatever is newest.
    alias: ["zomato-lite-kstbambhore.vercel.app"],
    files: manifest,
  }),
});
const deploy = await deployRes.json();
if (!deployRes.ok) {
  throw new Error(`Deployment create failed: HTTP ${deployRes.status} ${JSON.stringify(deploy)}`);
}
console.log(`Deployment created: ${deploy.id}`);
console.log(`State: ${deploy.readyState}, url: ${deploy.url}`);

// 4. Poll until READY or ERROR.
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 10000));
  const d = await (await fetch(API + "/v13/deployments/" + deploy.id + "?teamId=" + TEAM, { headers })).json();
  console.log("State:", d.readyState);
  if (d.readyState === "READY" || d.readyState === "ERROR" || d.readyState === "CANCELED") {
    console.log("Aliases:", JSON.stringify(d.alias));
    process.exitCode = d.readyState === "READY" ? 0 : 1;
    break;
  }
}
