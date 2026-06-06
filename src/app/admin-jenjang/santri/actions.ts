"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"

const santriSchema = z.object({
  id: z.number().optional(),
  nisn: z.string().min(5, "NISN minimal 5 karakter"),
  namaLengkap: z.string().min(2, "Nama Lengkap minimal 2 karakter"),
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
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak. Admin tidak memiliki jenjang.")

    const rawData = {
      nisn: formData.get("nisn") as string,
      namaLengkap: formData.get("namaLengkap") as string,
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

    const existingSantri = await prisma.santri.findUnique({ where: { nisn: validated.nisn } })
    if (existingSantri) {
      await prisma.santri.update({
        where: { id: existingSantri.id },
        data: santriData,
      })
      await prisma.santriJenjang.upsert({
        where: { santriId_jenjangId: { santriId: existingSantri.id, jenjangId: admin.jenjangId } },
        update: { statusMukim: validated.statusMukim },
        create: { santriId: existingSantri.id, jenjangId: admin.jenjangId, statusMukim: validated.statusMukim }
      })
    } else {
      await prisma.santri.create({
        data: {
          nisn: validated.nisn,
          ...santriData,
          jenjangs: {
            create: {
              jenjangId: admin.jenjangId,
              statusMukim: validated.statusMukim,
            }
          }
        },
      })
    }

    revalidatePath("/admin-jenjang/santri")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal menambahkan santri" }
  }
}

export async function updateSantri(formData: FormData) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak. Admin tidak memiliki jenjang.")

    const rawData = {
      id: Number(formData.get("id")),
      nisn: formData.get("nisn") as string,
      namaLengkap: formData.get("namaLengkap") as string,
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
    
    if (!validated.id) throw new Error("ID Santri tidak valid.")

    const santriData = {
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

    const existing = await prisma.santri.findUnique({ 
      where: { id: validated.id },
      include: { jenjangs: true }
    })
    
    if (!existing || !existing.jenjangs.some(j => j.jenjangId === admin.jenjangId)) {
       throw new Error("Santri tidak ditemukan atau tidak memiliki hak akses untuk jenjang ini.")
    }

    await prisma.santri.update({
      where: { id: validated.id },
      data: {
        nisn: validated.nisn,
        ...santriData,
      },
    })

    await prisma.santriJenjang.update({
      where: { santriId_jenjangId: { santriId: validated.id, jenjangId: admin.jenjangId } },
      data: { statusMukim: validated.statusMukim }
    })

    revalidatePath("/admin-jenjang/santri")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal memperbarui santri" }
  }
}

export async function deleteSantri(id: number) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak. Admin tidak memiliki jenjang.")

    const existing = await prisma.santri.findUnique({ 
      where: { id },
      include: { jenjangs: true }
    })
    
    if (!existing || !existing.jenjangs.some(j => j.jenjangId === admin.jenjangId)) {
       throw new Error("Santri tidak ditemukan atau tidak memiliki hak akses untuk jenjang ini.")
    }

    await prisma.santriJenjang.delete({
      where: { santriId_jenjangId: { santriId: id, jenjangId: admin.jenjangId } }
    })

    if (existing.jenjangs.length === 1) {
      await prisma.santri.delete({ where: { id } })
    }

    revalidatePath("/admin-jenjang/santri")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal menghapus santri" }
  }
}

export async function importSantriExcel(formData: FormData) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak.")

    const file = formData.get("file") as File
    if (!file) throw new Error("File tidak ditemukan")

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const xlsx = await import("xlsx")
    const workbook = xlsx.read(buffer, { type: "buffer" })
    
    const normalizeStr = (str: any) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "")

    const aliases = {
      nisn: ["nisn"],
      nama: ["nama", "namalengkap", "namasiswa", "namapesertadidik"],
      kelas: ["kelas", "rombel", "rombonganbelajar", "tingkatkelas"],
      nik: ["nik", "nomorindukkependudukan", "nonik"],
      tempatLahir: ["tempatlahir", "tmplahir"],
      tanggalLahir: ["tanggallahir", "tgllahir", "tanggal"],
      jenisKelamin: ["jeniskelamin", "jk", "lp", "kelamin"],
      namaAyah: ["namaayah", "ayahkandung", "namaayahkandung", "ayah"],
      namaIbu: ["namaibu", "ibukandung", "namaibukandung", "ibu"],
    }

    type ValidSheet = { headerMap: Record<string, number>, rows: any[][], startIndex: number }
    const validSheets: ValidSheet[] = []

    // Cari semua sheet yang memiliki header NISN dan Nama
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      const sheetData = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

      let localHeaderRowIndex = -1
      let localHeaderMap: Record<string, number> = {}

      for (let i = 0; i < Math.min(sheetData.length, 30); i++) {
        const row = sheetData[i]
        if (!Array.isArray(row)) continue
        
        let currentMap: Record<string, number> = {}

        row.forEach((cell, colIdx) => {
          const norm = normalizeStr(cell)
          if (!norm) return
          
          for (const [key, aliasList] of Object.entries(aliases)) {
            if (aliasList.some(alias => norm.includes(alias))) {
              if (currentMap[key] === undefined) {
                currentMap[key] = colIdx
              }
            }
          }
        })

        if (currentMap.nisn !== undefined && currentMap.nama !== undefined) {
          localHeaderRowIndex = i
          localHeaderMap = currentMap
          break
        }
      }
      
      if (localHeaderRowIndex !== -1) {
        validSheets.push({ headerMap: localHeaderMap, rows: sheetData, startIndex: localHeaderRowIndex + 1 })
      }
    }

    if (validSheets.length === 0) {
      throw new Error("Gagal mendeteksi kolom NISN dan Nama di semua sheet Excel. Pastikan file memiliki header tersebut.")
    }

    const activeTA = await prisma.tahunAjaran.findFirst({
      where: { isActive: true }
    })

    const allClasses = activeTA ? await prisma.kelasFormal.findMany({
      where: { jenjangId: admin.jenjangId, tahunAjaranId: activeTA.id }
    }) : []

    let count = 0

    const parseDate = (val: any) => {
      if (!val) return null
      if (typeof val === 'number') {
        return new Date(Math.round((val - 25569) * 86400 * 1000))
      }
      const d = new Date(val)
      if (!isNaN(d.getTime())) return d
      return null
    }

    for (const vSheet of validSheets) {
      for (let i = vSheet.startIndex; i < vSheet.rows.length; i++) {
        const row = vSheet.rows[i]
        if (!Array.isArray(row) || row.length === 0) continue

        const val = (key: string) => row[vSheet.headerMap[key]] !== undefined ? row[vSheet.headerMap[key]] : ""
        
        const nisn = String(val("nisn") || "").trim()
        const namaLengkap = String(val("nama") || "").trim()
        const kelasName = String(val("kelas") || "").trim()
        
        const nik = String(val("nik") || "").trim()
        const tempatLahir = String(val("tempatLahir") || "").trim()
        const jkRaw = normalizeStr(val("jenisKelamin"))
        const jenisKelamin = jkRaw === "l" || jkRaw.includes("laki") ? "Laki-laki" : (jkRaw === "p" || jkRaw.includes("perempuan") ? "Perempuan" : null)
        const namaAyah = String(val("namaAyah") || "").trim()
        const namaIbu = String(val("namaIbu") || "").trim()
        const tanggalLahir = parseDate(val("tanggalLahir"))

        if (nisn && namaLengkap) {
          const santriData = {
            namaLengkap,
            ...(nik && { nik }),
            ...(tempatLahir && { tempatLahir }),
            ...(tanggalLahir && { tanggalLahir }),
            ...(jenisKelamin && { jenisKelamin }),
            ...(namaAyah && { namaAyah }),
            ...(namaIbu && { namaIbu }),
          }

          let santri = await prisma.santri.findUnique({ where: { nisn } })
          
          if (santri) {
            santri = await prisma.santri.update({
              where: { id: santri.id },
              data: santriData
            })
            await prisma.santriJenjang.upsert({
              where: { santriId_jenjangId: { santriId: santri.id, jenjangId: admin.jenjangId } },
              update: { statusMukim: false },
              create: { santriId: santri.id, jenjangId: admin.jenjangId, statusMukim: false }
            })
          } else {
            santri = await prisma.santri.create({
              data: {
                nisn,
                ...santriData,
                jenjangs: {
                  create: {
                    jenjangId: admin.jenjangId,
                    statusMukim: false
                  }
                }
              }
            })
          }

          // Set riwayat kelas jika kelasName ada dan Tahun Ajaran aktif ada
          if (kelasName && activeTA) {
            const normClassStr = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
            let matchedClass = allClasses.find(c => normClassStr(c.namaKelas) === normClassStr(kelasName));
            
            // Jika kelas belum ada, otomatis buat kelas baru
            if (!matchedClass) {
              matchedClass = await prisma.kelasFormal.create({
                data: {
                  namaKelas: kelasName,
                  jenjangId: admin.jenjangId,
                  tahunAjaranId: activeTA.id
                }
              });
              allClasses.push(matchedClass); // Tambahkan ke memori agar santri berikutnya tidak membuat kelas ganda
            }

            if (matchedClass) {
              const existingRiwayat = await prisma.riwayatKelas.findFirst({
                where: {
                  santriId: santri.id,
                  kelasFormal: {
                    tahunAjaranId: activeTA.id
                  }
                }
              });

              if (existingRiwayat) {
                if (existingRiwayat.kelasFormalId !== matchedClass.id) {
                  await prisma.riwayatKelas.update({
                    where: { id: existingRiwayat.id },
                    data: { kelasFormalId: matchedClass.id }
                  });
                }
              } else {
                await prisma.riwayatKelas.create({
                  data: {
                    santriId: santri.id,
                    kelasFormalId: matchedClass.id
                  }
                });
              }
            }
          }
          
          count++;
        }
      }
    }

    if (count === 0) {
      throw new Error("Tidak ada baris data valid yang ditemukan di file. Pastikan ada header NISN dan Nama.")
    }

    revalidatePath("/admin-jenjang/santri")
    return { success: true, count }
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal mengimpor data dari Excel" }
  }
}

export async function deleteSantriBulk(ids: number[]) {
  try {
    const admin = await getLoggedInAdminJenjang()
    if (!admin.jenjangId) throw new Error("Akses ditolak. Admin tidak memiliki jenjang.")

    const existingSantris = await prisma.santri.findMany({
      where: { id: { in: ids } },
      include: { jenjangs: true }
    });

    for (const santri of existingSantris) {
      if (santri.jenjangs.some(j => j.jenjangId === admin.jenjangId)) {
        await prisma.santriJenjang.delete({
          where: { santriId_jenjangId: { santriId: santri.id, jenjangId: admin.jenjangId } }
        });
        
        if (santri.jenjangs.length === 1) {
          await prisma.santri.delete({ where: { id: santri.id } });
        }
      }
    }

    revalidatePath("/admin-jenjang/santri")
    return { success: true }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: "Gagal menghapus santri secara massal" }
  }
}
