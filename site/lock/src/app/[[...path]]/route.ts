import { createReadStream, existsSync, statSync } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
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

function staticRoot(): string {
  return path.resolve(process.cwd(), "site-files");
}

function resolveFile(urlPath: string): string | null {
  const root = staticRoot();
  let pathname: string;
  try {
    pathname = decodeURIComponent((urlPath || "/").split("?")[0].split("#")[0] || "/");
  } catch {
    return null;
  }
  if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);
  if (!pathname.startsWith("/")) pathname = "/" + pathname;

  const candidates: string[] = [];
  if (pathname === "/") {
    candidates.push(path.join(root, "index.html"));
  } else {
    const rel = pathname.replace(/^\/+/, "");
    candidates.push(path.join(root, rel));
    candidates.push(path.join(root, rel + ".html"));
    candidates.push(path.join(root, rel, "index.html"));
  }

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (resolved !== root && !resolved.startsWith(root + path.sep)) continue;
    try {
      const st = statSync(resolved);
      if (st.isFile()) return resolved;
    } catch {
      // try next
    }
  }
  return null;
}

function commonHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("X-Robots-Tag", "noindex, nofollow");
  headers.set("X-Content-Type-Options", "nosniff");
  // Responses are gated by HTTP Basic Auth; a shared cache must not
  // reuse a 200 for a client that has not authenticated.
  headers.set("Vary", "Authorization");
  return headers;
}

function fileResponse(filePath: string, headOnly: boolean, status = 200): Response {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const cache = /\.(?:js|css|svg|woff2|png|webp|jpg|jpeg|gif|ico)$/i.test(filePath)
    ? "private, max-age=31536000, immutable"
    : "private, no-store";
  const headers = commonHeaders({
    "Content-Type": type,
    "Cache-Control": cache,
  });
  if (headOnly) return new Response(null, { status, headers });
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>;
  return new Response(stream, { status, headers });
}

function notFound(headOnly: boolean): Response {
  const fallback = path.join(staticRoot(), "404.html");
  if (existsSync(fallback)) return fileResponse(fallback, headOnly, 404);
  return new Response("Not found", {
    status: 404,
    headers: commonHeaders({ "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }),
  });
}

function handle(req: NextRequest): Response {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method not allowed", {
      status: 405,
      headers: commonHeaders({ "Cache-Control": "no-store" }),
    });
  }
  const filePath = resolveFile(req.nextUrl.pathname);
  if (!filePath) return notFound(req.method === "HEAD");
  return fileResponse(filePath, req.method === "HEAD");
}

export function GET(req: NextRequest) {
  return handle(req);
}

export function HEAD(req: NextRequest) {
  return handle(req);
}
