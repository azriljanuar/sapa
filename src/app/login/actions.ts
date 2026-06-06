"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"
import { createSession, getSession } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

const loginSchema = z.object({
  username: z.string().min(1, "Email/NISN wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
})

export async function loginAction(prevState: unknown, formData: FormData) {
  let roleToRedirect = ""

  try {
    const rawData = {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    }

    const validated = loginSchema.parse(rawData)

    // 1. Cek tabel User (SUPER_ADMIN, ADMIN_JENJANG)
    const user = await prisma.user.findFirst({
      where: { email: validated.username },
    })

    if (user) {
      const passwordMatch = await bcrypt.compare(validated.password, user.password)
      if (!passwordMatch) return { error: "Username atau password salah." }
      
      await createSession({
        id: user.id,
        email: user.email,
        role: user.role,
        jenjangId: user.jenjangId,
      })
      roleToRedirect = user.role
    } 
    else {
      // 2. Cek tabel Guru (Login pakai Email)
      const guru = await prisma.guru.findFirst({
        where: { email: validated.username }
      })

      if (guru) {
        const passwordMatch = await bcrypt.compare(validated.password, guru.password)
        if (!passwordMatch) return { error: "Username atau password salah." }
        
        await createSession({
          id: guru.id,
          email: guru.email,
          role: "GURU",
          jenjangId: null, // Guru bisa m2m, jenjang di-handle terpisah
        })
        roleToRedirect = "GURU"
      }
      else {
        // 3. Cek tabel Santri (Login pakai NISN)
        const santri = await prisma.santri.findFirst({
          where: { nisn: validated.username }
        })

        if (santri) {
          const passwordMatch = await bcrypt.compare(validated.password, santri.password)
          if (!passwordMatch) return { error: "Username atau password salah." }
          
          await createSession({
            id: santri.id,
            email: santri.nisn, // Simpan NISN di field email pada session payload
            role: "SANTRI",
            jenjangId: null, // Santri akan mengakses semua data terkait NISN-nya
          })
          roleToRedirect = "SANTRI"
        }
        else {
          return { error: "Username atau password salah." }
        }
      }
    }
    
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
  }

  // Redirect based on role
  if (roleToRedirect === "SUPER_ADMIN") redirect("/super-admin")
  else if (roleToRedirect === "ADMIN_JENJANG") redirect("/admin-jenjang")
  else if (roleToRedirect === "GURU") redirect("/guru")
  else if (roleToRedirect === "SANTRI") redirect("/santri")
  else redirect("/login")
}

export async function logoutAction() {
  const { deleteSession } = await import("@/lib/auth")
  await deleteSession()
  redirect("/login")
}
