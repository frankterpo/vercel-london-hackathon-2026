import { randomUUID } from "crypto"
import { redirect } from "next/navigation"

export default function CanvasStartPage() {
  redirect(`/canvas/${randomUUID()}`)
}
