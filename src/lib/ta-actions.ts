"use server"

import { cookies } from "next/headers"

export async function setSelectedTahunAjaran(taId: number) {
  const cookieStore = await cookies()
  // Simpan selama 30 hari
  cookieStore.set("selected_ta_id", taId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })
  
  return { success: true }
}
