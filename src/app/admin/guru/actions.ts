"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import bcrypt from "bcryptjs"
import * as xlsx from "xlsx"

const DEFAULT_PASSWORD_HASH = "$2b$10$qTWxb4MAxuVYju.SFeZrreZMKo/9OfBaxs4WpB7x.9geRPxTdNQtq" // "password123"

const guruFormSchema = z.object({
  id: z.number().optional(),
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  nip: z.string().optional().nullable(),
  nuptk: z.string().optional().nullable(),
  nik: z.string().optional().nullable(),
  jenisKelamin: z.string().optional().nullable(),
  noTelepon: z.string().optional().nullable(),
  tempatLahir: z.string().optional().nullable(),
  tanggalLahir: z.string().optional().nullable(),
  pendidikanTerakhir: z.string().optional().nullable(),
  jurusan: z.string().optional().nullable(),
  statusPegawai: z.string().optional().nullable(),
  alamatLengkap: z.string().optional().nullable(),
  rfidCardId: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
})

export type GuruFormValues = z.infer<typeof guruFormSchema>

export async function createGuru(data: GuruFormValues) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak")

    const validated = guruFormSchema.parse(data)

    // Sanitize empty strings to null
    const nip = validated.nip?.trim() || null
    const nuptk = validated.nuptk?.trim() || null
    const nik = validated.nik?.trim() || null
    const rfidCardId = validated.rfidCardId?.trim() || null
    const noTelepon = validated.noTelepon?.trim() || null
    const jenisKelamin = validated.jenisKelamin?.trim() || null
    const tempatLahir = validated.tempatLahir?.trim() || null
    const pendidikanTerakhir = validated.pendidikanTerakhir?.trim() || null
    const jurusan = validated.jurusan?.trim() || null
    const statusPegawai = validated.statusPegawai?.trim() || null
    const alamatLengkap = validated.alamatLengkap?.trim() || null
    const email = validated.email.trim().toLowerCase()

    // Cek duplikasi email
    const existingEmail = await prisma.guru.findUnique({
      where: { email },
    })
    if (existingEmail) {
      return { success: false, error: "Email sudah terdaftar untuk guru lain." }
    }

    // Cek duplikasi NIP
    if (nip) {
      const existingNip = await prisma.guru.findUnique({
        where: { nip },
      })
      if (existingNip) {
        return { success: false, error: "NIP sudah terdaftar untuk guru lain." }
      }
    }

    // Cek duplikasi RFID
    if (rfidCardId) {
      const existingRfidGuru = await prisma.guru.findUnique({
        where: { rfidCardId },
      })
      const existingRfidSantri = await prisma.santri.findUnique({
        where: { rfidCardId },
      })
      if (existingRfidGuru || existingRfidSantri) {
        return { success: false, error: "Kartu RFID ini sudah terdaftar untuk pengguna lain." }
      }
    }

    let passwordHash = DEFAULT_PASSWORD_HASH
    if (validated.password && validated.password.trim().length > 0) {
      passwordHash = await bcrypt.hash(validated.password.trim(), 10)
    }

    let tanggalLahirDate: Date | null = null
    if (validated.tanggalLahir && validated.tanggalLahir.trim().length > 0) {
      tanggalLahirDate = new Date(validated.tanggalLahir)
      if (isNaN(tanggalLahirDate.getTime())) tanggalLahirDate = null
    }

    await prisma.guru.create({
      data: {
        nama: validated.nama.trim(),
        email,
        nip,
        nuptk,
        nik,
        jenisKelamin,
        noTelepon,
        tempatLahir,
        tanggalLahir: tanggalLahirDate,
        pendidikanTerakhir,
        jurusan,
        statusPegawai,
        alamatLengkap,
        password: passwordHash,
        rfidCardId,
        jenjangs: {
          connect: { id: admin.jenjangId },
        },
      },
    })

    revalidatePath("/admin/guru")
    return { success: true }
  } catch (error: any) {
    console.error("Error createGuru:", error)
    return { success: false, error: error.message || "Gagal menambahkan guru" }
  }
}

export async function updateGuru(data: GuruFormValues) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak")

    if (!data.id) throw new Error("ID guru tidak valid")
    const validated = guruFormSchema.parse(data)
    const guruId = data.id

    // Sanitize empty strings to null
    const nip = validated.nip?.trim() || null
    const nuptk = validated.nuptk?.trim() || null
    const nik = validated.nik?.trim() || null
    const rfidCardId = validated.rfidCardId?.trim() || null
    const noTelepon = validated.noTelepon?.trim() || null
    const jenisKelamin = validated.jenisKelamin?.trim() || null
    const tempatLahir = validated.tempatLahir?.trim() || null
    const pendidikanTerakhir = validated.pendidikanTerakhir?.trim() || null
    const jurusan = validated.jurusan?.trim() || null
    const statusPegawai = validated.statusPegawai?.trim() || null
    const alamatLengkap = validated.alamatLengkap?.trim() || null
    const email = validated.email.trim().toLowerCase()

    // Cek duplikasi email ke guru lain
    const existingEmail = await prisma.guru.findFirst({
      where: {
        email,
        id: { not: guruId },
      },
    })
    if (existingEmail) {
      return { success: false, error: "Email sudah digunakan oleh guru lain." }
    }

    // Cek duplikasi NIP ke guru lain
    if (nip) {
      const existingNip = await prisma.guru.findFirst({
        where: {
          nip,
          id: { not: guruId },
        },
      })
      if (existingNip) {
        return { success: false, error: "NIP sudah digunakan oleh guru lain." }
      }
    }

    // Cek duplikasi RFID ke user lain
    if (rfidCardId) {
      const existingRfidGuru = await prisma.guru.findFirst({
        where: {
          rfidCardId,
          id: { not: guruId },
        },
      })
      const existingRfidSantri = await prisma.santri.findUnique({
        where: { rfidCardId },
      })
      if (existingRfidGuru || existingRfidSantri) {
        return { success: false, error: "Kartu RFID ini sudah terdaftar untuk pengguna lain." }
      }
    }

    let tanggalLahirDate: Date | null = null
    if (validated.tanggalLahir && validated.tanggalLahir.trim().length > 0) {
      tanggalLahirDate = new Date(validated.tanggalLahir)
      if (isNaN(tanggalLahirDate.getTime())) tanggalLahirDate = null
    }

    const updatePayload: any = {
      nama: validated.nama.trim(),
      email,
      nip,
      nuptk,
      nik,
      jenisKelamin,
      noTelepon,
      tempatLahir,
      tanggalLahir: tanggalLahirDate,
      pendidikanTerakhir,
      jurusan,
      statusPegawai,
      alamatLengkap,
      rfidCardId,
    }

    // Update password jika diisi
    if (validated.password && validated.password.trim().length > 0) {
      updatePayload.password = await bcrypt.hash(validated.password.trim(), 10)
    }

    await prisma.guru.update({
      where: { id: guruId },
      data: updatePayload,
    })

    revalidatePath("/admin/guru")
    return { success: true }
  } catch (error: any) {
    console.error("Error updateGuru:", error)
    return { success: false, error: error.message || "Gagal memperbarui data guru" }
  }
}

export async function deleteGuru(guruId: number) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak")

    // Pastikan guru ini terdaftar di jenjang admin
    const targetGuru = await prisma.guru.findFirst({
      where: {
        id: guruId,
        jenjangs: { some: { id: admin.jenjangId } },
      },
      include: {
        _count: {
          select: {
            waliKelas: true,
            pengampu: true,
          },
        },
      },
    })

    if (!targetGuru) {
      return { success: false, error: "Guru tidak ditemukan di jenjang ini." }
    }

    // Hapus guru
    await prisma.guru.delete({
      where: { id: guruId },
    })

    revalidatePath("/admin/guru")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleteGuru:", error)
    if (error.code === "P2003") {
      return {
        success: false,
        error: "Gagal menghapus. Guru ini masih terkait dengan data lain. Harap lepaskan penugasan terkait terlebih dahulu.",
      }
    }
    return { success: false, error: error.message || "Gagal menghapus guru" }
  }
}

export async function resetPasswordGuru(guruId: number) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak")

    await prisma.guru.update({
      where: { id: guruId },
      data: { password: DEFAULT_PASSWORD_HASH },
    })

    revalidatePath("/admin/guru")
    return { success: true }
  } catch (error: any) {
    console.error("Error resetPasswordGuru:", error)
    return { success: false, error: error.message || "Gagal mereset password guru" }
  }
}

export async function importGuruExcel(formData: FormData) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak")

    const file = formData.get("file") as File | null
    if (!file) throw new Error("File tidak ditemukan")

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const workbook = xlsx.read(buffer, { type: "buffer" })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error("File Excel tidak memiliki lembar kerja (sheet).")

    const worksheet = workbook.Sheets[sheetName]
    const rows: any[] = xlsx.utils.sheet_to_json(worksheet)

    if (rows.length === 0) {
      throw new Error("File Excel kosong. Harap isi data guru.")
    }

    let successCount = 0
    let updatedCount = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // Mengingat baris 1 adalah header

      // Ambil field dengan berbagai kemungkinan variasi header
      const nama = String(row["Nama Lengkap"] || row["Nama"] || row["nama"] || "").trim()
      const email = String(row["Email"] || row["Username"] || row["email"] || "").trim().toLowerCase()
      const nip = row["NIP"] ? String(row["NIP"]).trim() : null
      const nuptk = row["NUPTK"] ? String(row["NUPTK"]).trim() : null
      const nik = row["NIK"] ? String(row["NIK"]).trim() : null
      const jenisKelamin = row["Jenis Kelamin"] ? String(row["Jenis Kelamin"]).trim() : null
      const noTelepon = row["No Telepon"] || row["No HP"] || row["Telepon"] ? String(row["No Telepon"] || row["No HP"] || row["Telepon"]).trim() : null
      const statusPegawai = row["Status Pegawai"] || row["Status"] ? String(row["Status Pegawai"] || row["Status"]).trim() : null
      const pendidikanTerakhir = row["Pendidikan Terakhir"] || row["Pendidikan"] ? String(row["Pendidikan Terakhir"] || row["Pendidikan"]).trim() : null
      const jurusan = row["Jurusan"] ? String(row["Jurusan"]).trim() : null
      const alamatLengkap = row["Alamat"] || row["Alamat Lengkap"] ? String(row["Alamat"] || row["Alamat Lengkap"]).trim() : null

      if (!nama || !email) {
        errors.push(`Baris ${rowNum}: Nama dan Email wajib diisi.`)
        continue
      }

      try {
        // Cek apakah guru sudah ada berdasarkan email
        const existingGuru = await prisma.guru.findUnique({
          where: { email },
        })

        if (existingGuru) {
          // Update data yang ada dan pastikan terhubung ke jenjang admin
          await prisma.guru.update({
            where: { id: existingGuru.id },
            data: {
              nama: nama || existingGuru.nama,
              nip: nip || existingGuru.nip,
              nuptk: nuptk || existingGuru.nuptk,
              nik: nik || existingGuru.nik,
              jenisKelamin: jenisKelamin || existingGuru.jenisKelamin,
              noTelepon: noTelepon || existingGuru.noTelepon,
              statusPegawai: statusPegawai || existingGuru.statusPegawai,
              pendidikanTerakhir: pendidikanTerakhir || existingGuru.pendidikanTerakhir,
              jurusan: jurusan || existingGuru.jurusan,
              alamatLengkap: alamatLengkap || existingGuru.alamatLengkap,
              jenjangs: {
                connect: { id: admin.jenjangId },
              },
            },
          })
          updatedCount++
        } else {
          // Buat guru baru
          await prisma.guru.create({
            data: {
              nama,
              email,
              nip,
              nuptk,
              nik,
              jenisKelamin,
              noTelepon,
              statusPegawai,
              pendidikanTerakhir,
              jurusan,
              alamatLengkap,
              password: DEFAULT_PASSWORD_HASH,
              jenjangs: {
                connect: { id: admin.jenjangId },
              },
            },
          })
          successCount++
        }
      } catch (err: any) {
        errors.push(`Baris ${rowNum} (${nama}): ${err.message}`)
      }
    }

    revalidatePath("/admin/guru")

    return {
      success: true,
      message: `Berhasil memproses Excel: ${successCount} guru baru ditambahkan, ${updatedCount} guru diperbarui.${errors.length > 0 ? ` Terjadi ${errors.length} catatan/kendala.` : ""}`,
      errors: errors.slice(0, 5), // Ambil maksimal 5 error untuk ditampilkan
    }
  } catch (error: any) {
    console.error("Error importGuruExcel:", error)
    return { success: false, error: error.message || "Gagal mengimpor file Excel" }
  }
}
