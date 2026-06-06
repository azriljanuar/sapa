"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import bcrypt from "bcryptjs"

const profilSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  nip: z.string().optional().nullable(),
  nuptk: z.string().optional().nullable(),
  niPPPK: z.string().optional().nullable(),
  nik: z.string().optional().nullable(),
  tempatLahir: z.string().optional().nullable(),
  tanggalLahir: z.string().optional().nullable(),
  jenisKelamin: z.string().optional().nullable(),
  agama: z.string().optional().nullable(),
  alamatLengkap: z.string().optional().nullable(),
  noTelepon: z.string().optional().nullable(),
  pendidikanTerakhir: z.string().optional().nullable(),
  jurusan: z.string().optional().nullable(),
  statusPegawai: z.string().optional().nullable(),
  tmt: z.string().optional().nullable(),
  namaIbuKandung: z.string().optional().nullable(),
})

export async function updateProfilGuru(values: z.infer<typeof profilSchema>, password?: string) {
  try {
    const session = await getSession()
    if (!session || session.role !== "GURU") {
      throw new Error("Akses ditolak")
    }

    const validated = profilSchema.parse(values)

    // Cek apakah email dipakai oleh pengguna lain
    const existing = await prisma.guru.findFirst({
      where: {
        email: validated.email,
        id: { not: session.id }
      }
    })

    if (existing) {
      throw new Error("Email sudah digunakan oleh akun lain.")
    }

    const dataToUpdate: any = {
      nama: validated.nama,
      email: validated.email,
      nip: validated.nip || null,
      nuptk: validated.nuptk || null,
      niPPPK: validated.niPPPK || null,
      nik: validated.nik || null,
      tempatLahir: validated.tempatLahir || null,
      tanggalLahir: validated.tanggalLahir ? new Date(validated.tanggalLahir) : null,
      jenisKelamin: validated.jenisKelamin || null,
      agama: validated.agama || null,
      alamatLengkap: validated.alamatLengkap || null,
      noTelepon: validated.noTelepon || null,
      pendidikanTerakhir: validated.pendidikanTerakhir || null,
      jurusan: validated.jurusan || null,
      statusPegawai: validated.statusPegawai || null,
      tmt: validated.tmt ? new Date(validated.tmt) : null,
      namaIbuKandung: validated.namaIbuKandung || null,
    }

    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10)
      dataToUpdate.password = await bcrypt.hash(password, salt)
    } else if (password && password.trim().length > 0) {
      throw new Error("Password minimal 6 karakter.")
    }

    await prisma.guru.update({
      where: { id: session.id },
      data: dataToUpdate
    })

    revalidatePath("/guru")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal memperbarui profil" }
  }
}
