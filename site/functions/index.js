const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

const sitePassword = defineSecret("CARDINAL_SITE_PASSWORD");
const AUTH_USER = "cardinal";
const STATIC_ROOT = path.resolve(__dirname, "static");
const HOSTING_SA = "service-995826722209@gcp-sa-firebasehosting.iam.gserviceaccount.com";
// invoker is private so deploy does not grant allUsers.
// After deploy, grant roles/run.invoker only to HOSTING_SA.

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
  ".epub": "application/epub+zip",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".map": "application/json",
};

function safeEqual(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  const len = Math.max(ab.length, bb.length, 1);
  const pa = Buffer.alloc(len);
  const pb = Buffer.alloc(len);
  ab.copy(pa);
  bb.copy(pb);
  return crypto.timingSafeEqual(pa, pb) && ab.length === bb.length;
}

function applyCommonHeaders(res) {
  res.set("X-Robots-Tag", "noindex, nofollow");
  res.set("X-Content-Type-Options", "nosniff");
}

function failClosed(res) {
  applyCommonHeaders(res);
  res.set("Cache-Control", "no-store");
  res.status(500).send("Service unavailable");
}

function unauthorized(res) {
  applyCommonHeaders(res);
  res.set("Cache-Control", "no-store");
  res.set("WWW-Authenticate", 'Basic realm="Cardinal", charset="UTF-8"');
  res.status(401).send("Unauthorized");
}

function authorized(req) {
  let expected;
  try {
    expected = sitePassword.value();
  } catch (err) {
    return {ok: false, closed: true};
  }
  if (!expected) return {ok: false, closed: true};
  const header = req.get("authorization") || "";
  const match = header.match(/^Basic\s+(\S+)$/i);
  if (!match) return {ok: false, closed: false};
  let decoded;
  try {
    decoded = Buffer.from(match[1], "base64").toString("utf8");
  } catch {
    return {ok: false, closed: false};
  }
  const idx = decoded.indexOf(":");
  if (idx < 0) return {ok: false, closed: false};
  const user = decoded.slice(0, idx);
  const pass = decoded.slice(idx + 1);
  if (!safeEqual(user, AUTH_USER) || !safeEqual(pass, expected)) {
    return {ok: false, closed: false};
  }
  return {ok: true, closed: false};
}

function resolveFile(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent((urlPath || "/").split("?")[0].split("#")[0] || "/");
  } catch {
    return null;
  }
  if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);
  if (!pathname.startsWith("/")) pathname = "/" + pathname;

  const candidates = [];
  if (pathname === "/") {
    candidates.push(path.join(STATIC_ROOT, "index.html"));
  } else {
    const rel = pathname.replace(/^\/+/, "");
    candidates.push(path.join(STATIC_ROOT, rel));
    candidates.push(path.join(STATIC_ROOT, rel + ".html"));
    candidates.push(path.join(STATIC_ROOT, rel, "index.html"));
  }

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (resolved !== STATIC_ROOT && !resolved.startsWith(STATIC_ROOT + path.sep)) continue;
    try {
      const st = fs.statSync(resolved);
      if (st.isFile()) return resolved;
    } catch {
      // try next
    }
  }
  return null;
}

function sendFile(res, filePath) {
  applyCommonHeaders(res);
  const ext = path.extname(filePath).toLowerCase();
  res.set("Content-Type", MIME[ext] || "application/octet-stream");
  if (/\.(?:js|css|svg|woff2|png|webp|jpg|jpeg|gif|ico)$/i.test(filePath)) {
    res.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (filePath.includes(`${path.sep}audio${path.sep}`)) {
    res.set("Cache-Control", "public, max-age=3600");
  } else {
    res.set("Cache-Control", "public, max-age=3600");
  }
  fs.createReadStream(filePath).pipe(res);
}

function sendNotFound(res) {
  applyCommonHeaders(res);
  res.set("Cache-Control", "no-store");
  const fallback = path.join(STATIC_ROOT, "404.html");
  if (fs.existsSync(fallback)) {
    res.status(404);
    res.set("Content-Type", "text/html; charset=utf-8");
    fs.createReadStream(fallback).pipe(res);
    return;
  }
  res.status(404).send("Not found");
}

exports.gate = onRequest(
  {
    region: "us-central1",
    secrets: [sitePassword],
    invoker: "private",
    memory: "512MiB",
    timeoutSeconds: 60,
  },
  (req, res) => {
    const auth = authorized(req);
    if (auth.closed) {
      failClosed(res);
      return;
    }
    if (!auth.ok) {
      unauthorized(res);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      applyCommonHeaders(res);
      res.set("Cache-Control", "no-store");
      res.status(405).send("Method not allowed");
      return;
    }

    const filePath = resolveFile(req.path || req.url || "/");
    if (!filePath) {
      sendNotFound(res);
      return;
    }
    if (req.method === "HEAD") {
      applyCommonHeaders(res);
      const ext = path.extname(filePath).toLowerCase();
      res.set("Content-Type", MIME[ext] || "application/octet-stream");
      res.status(200).end();
      return;
    }
    sendFile(res, filePath);
  },
);
