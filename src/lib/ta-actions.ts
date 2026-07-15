"use server"

import { cookies } from "next/headers"

export async function setSelectedSemesterCookie(semesterId: number) {
  const cookieStore = await cookies()
  // Simpan selama 30 hari
  cookieStore.set("selected_semester_id", semesterId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })
  
  return { success: true }
}
