"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { getLoggedInSuperAdmin } from "@/lib/auth"

const guruSchema = z.object({
  id: z.number().optional(),
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  nip: z.string().nullable().optional(),
  email: z.string().email("Format email tidak valid"),
  jenisKelamin: z.string().optional(),
  jenjangIds: z.array(z.number()).min(1, "Minimal pilih 1 jenjang"),
})

export async function createGuru(formData: FormData) {
  try {
    const admin = await getLoggedInSuperAdmin()
    if (!admin) throw new Error("Akses ditolak.")

    const jenjangIds = formData.getAll("jenjangIds").map(id => Number(id))

    const rawData = {
      nama: formData.get("nama") as string,
      nip: formData.get("nip") as string | undefined,
      email: formData.get("email") as string,
      jenisKelamin: formData.get("jenisKelamin") as string,
      jenjangIds,
    }

    const validated = guruSchema.parse(rawData)

    // Cek apakah guru dengan Email atau NIP sudah ada
    let existingGuru = await prisma.guru.findFirst({
      where: {
        OR: [
          { email: validated.email },
          ...(validated.nip ? [{ nip: validated.nip }] : [])
        ]
      },
    })

    if (existingGuru) {
      throw new Error("Guru dengan Email/NIP tersebut sudah terdaftar di sistem.")
    }

    // Buat guru baru dan hubungkan ke jenjang-jenjang
    await prisma.guru.create({
      data: {
        nama: validated.nama,
        nip: validated.nip || null,
        email: validated.email,
        jenisKelamin: validated.jenisKelamin,
        jenjangs: {
          connect: validated.jenjangIds.map(id => ({ id }))
        }
      },
    })

    revalidatePath("/super-admin/guru")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal menambahkan guru" }
  }
}

export async function updateGuru(formData: FormData) {
  try {
    const admin = await getLoggedInSuperAdmin()
    if (!admin) throw new Error("Akses ditolak.")

    const jenjangIds = formData.getAll("jenjangIds").map(id => Number(id))

    const rawData = {
      id: Number(formData.get("id")),
      nama: formData.get("nama") as string,
      nip: formData.get("nip") as string | undefined,
      email: formData.get("email") as string,
      jenisKelamin: formData.get("jenisKelamin") as string,
      jenjangIds,
    }

    const validated = guruSchema.parse(rawData)

    // Untuk memastikan kita mengganti relasi jenjang:
    // set ulang connect-nya dengan array baru
    await prisma.guru.update({
      where: { id: validated.id },
      data: {
        nama: validated.nama,
        nip: validated.nip || null,
        email: validated.email,
        jenisKelamin: validated.jenisKelamin,
        jenjangs: {
          set: validated.jenjangIds.map(id => ({ id }))
        }
      },
    })

    revalidatePath("/super-admin/guru")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal memperbarui guru" }
  }
}

export async function deleteGuru(id: number) {
  try {
    const admin = await getLoggedInSuperAdmin()
    if (!admin) throw new Error("Akses ditolak.")

    await prisma.guru.delete({
      where: { id }
    })

    revalidatePath("/super-admin/guru")
    return { success: true }
  } catch (error: any) {
    if (error.code === "P2003") {
      return { success: false, error: "Gagal menghapus. Guru ini sedang ditugaskan sebagai Wali Kelas. Harap ubah wali kelas terkait terlebih dahulu." }
    }
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal menghapus guru" }
  }
}

export async function bulkDeleteGuru(ids: number[]) {
  try {
    const admin = await getLoggedInSuperAdmin()
    if (!admin) throw new Error("Akses ditolak.")

    // Menggunakan transaction untuk mendelete satu-satu
    // Hal ini agar Prisma membersihkan relasi many-to-many (jenjang) secara otomatis
    await prisma.$transaction(
      ids.map(id => prisma.guru.delete({ where: { id } }))
    )

    revalidatePath("/super-admin/guru")
    return { success: true }
  } catch (error: any) {
    if (error.code === "P2003") {
      return { success: false, error: "Gagal menghapus massal. Data guru ini masih terkait dengan data lain (misalnya sebagai Wali Kelas). Harap lepas penugasan tersebut terlebih dahulu." }
    }
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal menghapus guru secara massal" }
  }
}

export async function resetPasswordGuru(id: number) {
  try {
    const admin = await getLoggedInSuperAdmin()
    if (!admin) throw new Error("Akses ditolak.")

    const bcrypt = await import("bcryptjs")
    const hashedPassword = await bcrypt.hash("password123", 10)

    await prisma.guru.update({
      where: { id },
      data: { password: hashedPassword }
    })

    revalidatePath("/super-admin/guru")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal mereset password guru" }
  }
}

export async function importGuruExcel(formData: FormData) {
  try {
    const admin = await getLoggedInSuperAdmin()
    if (!admin) throw new Error("Akses ditolak.")

    const file = formData.get("file") as File
    if (!file) throw new Error("File tidak ditemukan")

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const xlsx = await import("xlsx")
    const workbook = xlsx.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // We expect header to be Nama, Email, Jenis Kelamin, Jenjang
    const data = xlsx.utils.sheet_to_json(worksheet)

    // Ambil daftar seluruh jenjang untuk pencocokan nama
    const allJenjangs = await prisma.jenjangPendidikan.findMany()

    let count = 0;

    for (const row of data as any[]) {
      const nama = String(row.Nama || "").trim()
      const email = String(row.Email || "").trim()
      const jenisKelamin = String(row["Jenis Kelamin"] || "").trim()
      const jenjangStr = String(row.Jenjang || "").trim()

      if (nama && email) {
        // Parse jenjang dari kolom Jenjang (pisahkan dengan koma)
        const jenjangNames = jenjangStr.split(",").map(j => j.trim().toLowerCase()).filter(Boolean)
        const matchedJenjangIds = allJenjangs
          .filter(j => jenjangNames.includes(j.nama.toLowerCase()) || jenjangNames.includes(j.singkatan.toLowerCase()))
          .map(j => j.id)

        let existingGuru = await prisma.guru.findFirst({
          where: {
            email
          }
        })

        if (existingGuru) {
          await prisma.guru.update({
            where: { id: existingGuru.id },
            data: {
              jenisKelamin: jenisKelamin || existingGuru.jenisKelamin,
              jenjangs: matchedJenjangIds.length > 0 ? { connect: matchedJenjangIds.map(id => ({ id })) } : undefined
            }
          })
        } else {
          // Hanya buat jika ada minimal 1 jenjang yang valid (atau boleh kosong?)
          // Anggap boleh kosong jika template salah, atau harus ada
          await prisma.guru.create({
            data: {
              nama,
              email,
              jenisKelamin,
              jenjangs: matchedJenjangIds.length > 0 ? { connect: matchedJenjangIds.map(id => ({ id })) } : undefined
            }
          })
        }
        count++;
      }
    }

    if (count === 0) {
      throw new Error("Tidak ada baris data valid yang ditemukan di file. Pastikan ada header Nama, Email, Jenis Kelamin, Jenjang.")
    }

    revalidatePath("/super-admin/guru")
    return { success: true, count }
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengimpor data dari Excel" }
  }
}
