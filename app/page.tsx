import { redirect } from "next/navigation"

/** Canvas-first: `/canvas` allocates a UUID and loads tldraw. */
export default function Home() {
  redirect("/canvas")
}
