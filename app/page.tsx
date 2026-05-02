import { redirect } from "next/navigation"

/** Canvas-first: `/canvas` allocates a UUID and loads Excalidraw (MIT). */
export default function Home() {
  redirect("/canvas")
}
