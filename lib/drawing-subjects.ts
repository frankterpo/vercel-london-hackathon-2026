/** Normalize lightly for overlap checks (not linguistics). */
export function normalizeDrawingSubject(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}

export function subjectsOverlap(
  current: string[],
  prior: string[] | undefined
): boolean {
  if (!prior?.length || !current.length) return false
  const A = new Set(current.map(normalizeDrawingSubject).filter(Boolean))
  const B = prior.map(normalizeDrawingSubject).filter(Boolean)
  for (const b of B) {
    if (A.has(b)) return true
    for (const a of A) {
      if (a.length < 2 || b.length < 2) continue
      if (b.includes(a) || a.includes(b)) return true
    }
  }
  return false
}
