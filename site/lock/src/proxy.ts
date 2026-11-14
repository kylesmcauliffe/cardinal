import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const USERNAME = "cardinal";

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Cardinal", charset="UTF-8"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aa = enc.encode(a);
  const bb = enc.encode(b);
  const len = Math.max(aa.length, bb.length, 1);
  let out = 0;
  out |= aa.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    out |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return out === 0;
}

function isAuthorized(header: string | null, password: string): boolean {
  if (!header || !header.toLowerCase().startsWith("basic ")) return false;
  let decoded = "";
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return false;
  }
  const colon = decoded.indexOf(":");
  if (colon === -1) return false;
  const user = decoded.slice(0, colon);
  const pass = decoded.slice(colon + 1);
  return safeEqual(user, USERNAME) && safeEqual(pass, password);
}

function withRobots(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export function proxy(request: NextRequest) {
  const password = process.env["CARDINAL_SITE_PASSWORD"];
  // Fail closed if the secret is missing, and gate every route.
  if (!password || !isAuthorized(request.headers.get("authorization"), password)) {
    return unauthorized();
  }
  return withRobots(NextResponse.next());
}

export const config = {
  // Include "/" explicitly; "/:path*" does not match the root.
  matcher: ["/", "/:path*"],
};
