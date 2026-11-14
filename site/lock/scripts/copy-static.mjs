import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, "..", "..", "dist");
const dest = join(root, "..", "site-files");

if (!existsSync(dist)) {
  throw new Error(`Astro dist not found at ${dist}`);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
cpSync(dist, dest, { recursive: true });
console.log("Copied Astro dist into site/lock/site-files");
