"use server"

import { cookies } from "next/headers"

export async function setSelectedTaCookie(taId: string) {
  const cookieStore = await cookies()
  cookieStore.set("selected_ta_id", taId, { path: "/admin-jenjang" })
}
