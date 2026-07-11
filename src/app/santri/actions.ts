"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import bcrypt from "bcryptjs"
import { writeFileSync, mkdirSync, existsSync } from "fs"
import { join } from "path"

const profilSchema = z.object({
  namaLengkap: z.string().min(2, "Nama minimal 2 karakter"),
  nik: z.string().optional().nullable(),
  tempatLahir: z.string().optional().nullable(),
  tanggalLahir: z.string().optional().nullable(),
  jenisKelamin: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  noTelepon: z.string().optional().nullable(),
  kebutuhanKhusus: z.string().optional().nullable(),
  disabilitas: z.string().optional().nullable(),
  noKipPip: z.string().optional().nullable(),
  namaAyah: z.string().optional().nullable(),
  namaIbu: z.string().optional().nullable(),
  riwayatKesehatan: z.string().optional().nullable(),
})

export async function updateProfilSantri(santriIds: number[], values: z.infer<typeof profilSchema>, password?: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== "SANTRI") {
      throw new Error("Akses ditolak")
    }

    // Pastikan ID yang diupdate memang milik santri yang login
    // session.email menyimpan NISN
    const validSantris = await prisma.santri.findMany({
      where: {
        id: { in: santriIds },
        nisn: session.email // validasi kepemilikan berdasarkan NISN
      }
    })

    if (validSantris.length !== santriIds.length) {
      throw new Error("Terdapat data yang tidak valid.")
    }

    const validated = profilSchema.parse(values)

    const dataToUpdate: any = {
      namaLengkap: validated.namaLengkap,
      nik: validated.nik || null,
      tempatLahir: validated.tempatLahir || null,
      tanggalLahir: validated.tanggalLahir ? new Date(validated.tanggalLahir) : null,
      jenisKelamin: validated.jenisKelamin || null,
      alamat: validated.alamat || null,
      noTelepon: validated.noTelepon || null,
      kebutuhanKhusus: validated.kebutuhanKhusus || null,
      disabilitas: validated.disabilitas || null,
      noKipPip: validated.noKipPip || null,
      namaAyah: validated.namaAyah || null,
      namaIbu: validated.namaIbu || null,
      riwayatKesehatan: validated.riwayatKesehatan || null,
    }

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10)
      dataToUpdate.password = await bcrypt.hash(password, salt)
    } else if (password && password.trim().length > 0) {
      throw new Error("Password minimal 6 karakter.")
    }

    // Update profil di semua jenjang
    await prisma.santri.updateMany({
      where: { id: { in: santriIds } },
      data: dataToUpdate
    })

    revalidatePath("/santri")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal memperbarui profil" }
  }
}

export async function uploadFotoWajahAction(santriIds: number[], formData: FormData) {
  try {
    const session = await getSession()
    if (!session || session.role !== "SANTRI") throw new Error("Unauthorized")

    const file = formData.get("file") as File
    if (!file) throw new Error("File not found")

    const validSantris = await prisma.santri.findMany({
      where: {
        id: { in: santriIds },
        nisn: session.email // validasi kepemilikan
      }
    })

    if (validSantris.length === 0) throw new Error("Unauthorized")

    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadDir = join(process.cwd(), "public", "uploads", "profiles")
    
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true })
    }

    const filename = `santri_${session.email}_${Date.now()}.png`
    writeFileSync(join(uploadDir, filename), buffer)
    
    const fileUrl = `/uploads/profiles/${filename}`

    await prisma.santri.updateMany({
      where: { id: { in: santriIds } },
      data: { fotoWajah: fileUrl }
    })

    revalidatePath("/santri")
    return { success: true, url: fileUrl }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getTemplateKartuAction() {
  const session = await getSession()
  if (!session || session.role !== "SANTRI") return null

  const santri = await prisma.santri.findUnique({
    where: { id: session.id },
    include: { jenjangs: true }
  })

  if (!santri || santri.jenjangs.length === 0) return null

  return prisma.templateKartu.findUnique({
    where: {
      jenjangId_tipe: {
        jenjangId: santri.jenjangs[0].jenjangId,
        tipe: "SANTRI"
      }
    }
  })
}
