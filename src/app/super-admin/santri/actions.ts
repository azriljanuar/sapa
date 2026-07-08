"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { getLoggedInSuperAdmin } from "@/lib/auth"

const santriSchema = z.object({
  id: z.number().optional(),
  nisn: z.string().min(5, "NISN minimal 5 karakter"),
  namaLengkap: z.string().min(2, "Nama Lengkap minimal 2 karakter"),
  jenjangIds: z.array(z.number()).min(1, "Minimal pilih satu jenjang pendidikan"),
  statusMukim: z.boolean(),
  riwayatKesehatan: z.string().optional().nullable(),
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
})

export async function createSantri(formData: FormData) {
  try {
    await getLoggedInSuperAdmin()

    // Parsing jenjangIds (karena ini array di form)
    let jenjangIds: number[] = []
    const rawJenjangs = formData.getAll("jenjangIds")
    if (rawJenjangs.length > 0) {
      jenjangIds = rawJenjangs.map(id => Number(id)).filter(id => !isNaN(id))
    }

    const rawData = {
      nisn: formData.get("nisn") as string,
      namaLengkap: formData.get("namaLengkap") as string,
      jenjangIds,
      statusMukim: formData.get("statusMukim") === "true",
      riwayatKesehatan: formData.get("riwayatKesehatan") as string,
      nik: formData.get("nik") as string,
      tempatLahir: formData.get("tempatLahir") as string,
      tanggalLahir: formData.get("tanggalLahir") as string,
      jenisKelamin: formData.get("jenisKelamin") as string,
      alamat: formData.get("alamat") as string,
      noTelepon: formData.get("noTelepon") as string,
      kebutuhanKhusus: formData.get("kebutuhanKhusus") as string,
      disabilitas: formData.get("disabilitas") as string,
      noKipPip: formData.get("noKipPip") as string,
      namaAyah: formData.get("namaAyah") as string,
      namaIbu: formData.get("namaIbu") as string,
    }

    const validated = santriSchema.parse(rawData)

    const santriData = {
      nisn: validated.nisn,
      namaLengkap: validated.namaLengkap,
      riwayatKesehatan: validated.riwayatKesehatan || null,
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
    }

    await prisma.$transaction(async (tx) => {
      const santri = await tx.santri.create({ data: santriData })
      
      for (const jId of validated.jenjangIds) {
        await tx.santriJenjang.create({
          data: {
            santriId: santri.id,
            jenjangId: jId,
            statusMukim: validated.statusMukim,
            isAlumni: false
          }
        })
      }
    })

    revalidatePath("/super-admin/santri")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message }
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal menambah data santri" }
  }
}

export async function updateSantri(id: number, formData: FormData) {
  try {
    await getLoggedInSuperAdmin()

    let jenjangIds: number[] = []
    const rawJenjangs = formData.getAll("jenjangIds")
    if (rawJenjangs.length > 0) {
      jenjangIds = rawJenjangs.map(jid => Number(jid)).filter(jid => !isNaN(jid))
    }

    const rawData = {
      id,
      nisn: formData.get("nisn") as string,
      namaLengkap: formData.get("namaLengkap") as string,
      jenjangIds,
      statusMukim: formData.get("statusMukim") === "true",
      riwayatKesehatan: formData.get("riwayatKesehatan") as string,
      nik: formData.get("nik") as string,
      tempatLahir: formData.get("tempatLahir") as string,
      tanggalLahir: formData.get("tanggalLahir") as string,
      jenisKelamin: formData.get("jenisKelamin") as string,
      alamat: formData.get("alamat") as string,
      noTelepon: formData.get("noTelepon") as string,
      kebutuhanKhusus: formData.get("kebutuhanKhusus") as string,
      disabilitas: formData.get("disabilitas") as string,
      noKipPip: formData.get("noKipPip") as string,
      namaAyah: formData.get("namaAyah") as string,
      namaIbu: formData.get("namaIbu") as string,
    }

    const validated = santriSchema.parse(rawData)

    const santriData = {
      nisn: validated.nisn,
      namaLengkap: validated.namaLengkap,
      riwayatKesehatan: validated.riwayatKesehatan || null,
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
    }

    await prisma.$transaction(async (tx) => {
      await tx.santri.update({
        where: { id },
        data: santriData,
      })

      // Hapus relasi lama, buat relasi baru
      await tx.santriJenjang.deleteMany({
        where: { santriId: id }
      })
      
      for (const jId of validated.jenjangIds) {
        await tx.santriJenjang.create({
          data: {
            santriId: id,
            jenjangId: jId,
            statusMukim: validated.statusMukim,
            isAlumni: false
          }
        })
      }
    })

    revalidatePath("/super-admin/santri")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) return { success: false, error: error.issues[0].message }
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal memperbarui data santri" }
  }
}

export async function deleteSantri(id: number) {
  try {
    await getLoggedInSuperAdmin()
    await prisma.santri.delete({ where: { id } })
    revalidatePath("/super-admin/santri")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal menghapus data santri" }
  }
}

export async function deleteSantriBulk(ids: number[]) {
  try {
    await getLoggedInSuperAdmin()
    await prisma.santri.deleteMany({
      where: { id: { in: ids } }
    })
    revalidatePath("/super-admin/santri")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal menghapus data santri" }
  }
}
