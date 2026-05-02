import { cookies } from "next/headers"
import { TENANT_COOKIE } from "@/lib/tenant-cookie"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function getTenantIdFromCookies(): Promise<string | null> {
  const jar = await cookies()
  const v = jar.get(TENANT_COOKIE)?.value?.trim()
  if (!v || !UUID_RE.test(v)) return null
  return v
}
