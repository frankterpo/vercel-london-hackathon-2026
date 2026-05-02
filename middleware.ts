import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { TENANT_COOKIE } from "@/lib/tenant-cookie"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function middleware(request: NextRequest) {
  const raw = request.cookies.get(TENANT_COOKIE)?.value
  if (raw && UUID_RE.test(raw)) {
    return NextResponse.next()
  }
  const tenantId = crypto.randomUUID()
  const res = NextResponse.next()
  res.cookies.set(TENANT_COOKIE, tenantId, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  })
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
