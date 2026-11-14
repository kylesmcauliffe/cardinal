const { existsSync } = require("node:fs");
const { dirname, join } = require("node:path");

const root = join(__dirname, "..");
const candidates = [
  join(root, ".next/standalone/server.js"),
  join(root, ".next/standalone/lock/server.js"),
  join(root, ".next/standalone/site/lock/server.js"),
];
const server = candidates.find(existsSync);
if (!server) {
  console.error("Could not find Next standalone server.js in", candidates);
  process.exit(1);
}
process.chdir(dirname(server));
require(server);
