/** Parse nested Bright Data / Google parsed JSON for image result rows. */

export type ReferenceImageHit = {
  url: string
  thumbnailUrl?: string
  title?: string
}

function asString(x: unknown): string | undefined {
  return typeof x === "string" && x.startsWith("http") ? x : undefined
}

/** Walk unknown JSON and collect image-like objects. */
export function scrapeImageHitsFromBrightDataJson(root: unknown): ReferenceImageHit[] {
  const out: ReferenceImageHit[] = []
  const seen = new Set<string>()

  const visit = (node: unknown) => {
    if (node === null || node === undefined) return
    if (Array.isArray(node)) {
      for (const x of node) visit(x)
      return
    }
    if (typeof node !== "object") return

    const obj = node as Record<string, unknown>
    if (
      typeof obj.original_image === "string" ||
      typeof obj.image === "string" ||
      typeof obj.thumbnail === "string"
    ) {
      const url =
        asString(obj.original_image) ??
        asString(obj.image) ??
        asString(obj.thumbnail)
      if (url && !seen.has(url)) {
        seen.add(url)
        out.push({
          url,
          thumbnailUrl: asString(obj.image) ?? asString(obj.thumbnail),
          title: typeof obj.title === "string" ? obj.title : undefined,
        })
      }
    }

    for (const v of Object.values(obj)) visit(v)
  }

  visit(root)
  return out
}

/**
 * Reads Bright Data credentials the same way env examples + CLI docs line up:
 * - `BRIGHTDATA_ZONE`: app-local override (recommended in .env.example)
 * - `BRIGHTDATA_UNLOCKER_ZONE` / `BRIGHTDATA_SERP_ZONE`: parity with `@brightdata/cli`
 */
export function resolveBrightDataCredentials(): {
  apiKey: string
  zone: string
} {
  const apiKey = process.env.BRIGHTDATA_API_KEY?.trim() ?? ""
  const zone =
    process.env.BRIGHTDATA_ZONE?.trim() ||
    process.env.BRIGHTDATA_UNLOCKER_ZONE?.trim() ||
    process.env.BRIGHTDATA_SERP_ZONE?.trim() ||
    ""
  return { apiKey, zone }
}

/**
 * Bright Data Web Unlocker zone (POST /request): GET Google Image search JSON.
 * Use a Web Unlocker product zone; CLI default after `brightdata login` is usually `cli_unlocker`.
 * @see https://docs.brightdata.com/api-reference
 */
export async function fetchGoogleImageReferences(opts: {
  query: string
  limit?: number
}): Promise<{ hits: ReferenceImageHit[]; reason?: string }> {
  const { apiKey, zone } = resolveBrightDataCredentials()
  if (!apiKey || !zone) {
    return { hits: [], reason: "brightdata_unconfigured" }
  }

  const q = `${opts.query}`.trim()
  if (!q) return { hits: [], reason: "empty_query" }

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}&udm=2&hl=en&brd_json=1`

  try {
    const res = await fetch("https://api.brightdata.com/request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        zone,
        url: searchUrl,
        format: "json",
        method: "GET",
      }),
    })

    const text = await res.text()
    if (!res.ok) {
      console.warn("[brightdata] HTTP", res.status, text.slice(0, 400))
      return { hits: [], reason: `brightdata_http_${res.status}` }
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(text) as unknown
    } catch {
      return { hits: [], reason: "brightdata_not_json" }
    }

    let core: unknown = parsed
    if (
      core &&
      typeof core === "object" &&
      "body" in (core as Record<string, unknown>) &&
      typeof (core as Record<string, unknown>).body === "string"
    ) {
      try {
        core = JSON.parse((core as Record<string, unknown>).body as string) as unknown
      } catch {
        core = parsed
      }
    }

    const hits = scrapeImageHitsFromBrightDataJson(core).slice(0, opts.limit ?? 6)
    return { hits }
  } catch (e) {
    console.warn("[brightdata] request failed:", e)
    return { hits: [], reason: "brightdata_network" }
  }
}
