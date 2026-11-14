import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "site-files");
const standalone = join(root, ".next", "standalone");
if (!existsSync(src) || !existsSync(standalone)) {
  process.exit(0);
}

function findServers(dir, acc = []) {
  const server = join(dir, "server.js");
  if (existsSync(server)) acc.push(server);
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const p = join(dir, name);
    try {
      if (statSync(p).isDirectory()) findServers(p, acc);
    } catch {
      // ignore
    }
  }
  return acc;
}

const servers = findServers(standalone);
const dests = new Set([join(standalone, "site-files")]);
for (const server of servers) dests.add(join(dirname(server), "site-files"));

for (const dest of dests) {
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

const staticSrc = join(root, ".next", "static");
if (existsSync(staticSrc)) {
  for (const server of servers) {
    const dest = join(dirname(server), ".next", "static");
    mkdirSync(dest, { recursive: true });
    cpSync(staticSrc, dest, { recursive: true });
  }
}
console.log("Copied site-files into Next standalone output");
