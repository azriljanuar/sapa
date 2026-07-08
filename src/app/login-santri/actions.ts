"use server"

import { z } from "zod"
import prisma from "@/lib/prisma"
import { createSession } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

const loginSantriSchema = z.object({
  username: z.string().min(1, "NISN wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
})

export async function loginSantriAction(prevState: unknown, formData: FormData) {
  try {
    const rawData = {
      username: formData.get("username") as string,
      password: formData.get("password") as string,
    }

    const validated = loginSantriSchema.parse(rawData)

    const santri = await prisma.santri.findFirst({
      where: { nisn: validated.username }
    })

    if (santri) {
      const passwordMatch = await bcrypt.compare(validated.password, santri.password)
      if (!passwordMatch) return { error: "NISN atau password salah." }
      
      await createSession({
        id: santri.id,
        email: santri.nisn,
        role: "SANTRI",
        jenjangId: null,
      })
      
    } else {
      return { error: "Akun Santri tidak ditemukan." }
    }
    
  } catch (error) {
    if (error instanceof Error) return { error: error.message }
    return { error: "Terjadi kesalahan" }
  }

  // Redirect on success
  redirect("/santri")
}

export async function searchSantriAction(query: string) {
  if (!query || query.length < 3) {
    return { success: false, error: "Ketik minimal 3 huruf untuk mencari" }
  }

  try {
    const results = await prisma.santri.findMany({
      where: {
        OR: [
          { namaLengkap: { contains: query } },
          { nisn: { contains: query } }
        ]
      },
      select: {
        nisn: true,
        namaLengkap: true,
        jenjangs: {
          include: {
            jenjang: true
          }
        }
      },
      take: 10
    })

    return { success: true, data: results }
  } catch (error) {
    return { success: false, error: "Gagal melakukan pencarian" }
  }
}
