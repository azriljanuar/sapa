"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { StatusKehadiran, TipeMateri } from "@prisma/client"

// Catatan: Untuk GURU login, session.id = guru.id dan session.email = guru.email
// Untuk SANTRI login, session.id = santri.id dan session.email = santri.nisn
// Lihat src/app/login/actions.ts untuk referensi

// --- KEHADIRAN GURU ---
export async function catatKehadiranGuru(tanggal: Date, status: StatusKehadiran, keterangan?: string) {
  const session = await getSession()
  if (!session || session.role !== "GURU") throw new Error("Unauthorized")

  try {
    const dateStr = tanggal.toISOString().split("T")[0]
    const dateObj = new Date(dateStr)

    const result = await prisma.kehadiranGuru.upsert({
      where: {
        guruId_tanggal: {
          guruId: session.id,   // session.id = guru.id untuk GURU login
          tanggal: dateObj,
        }
      },
      update: { status, keterangan },
      create: {
        guruId: session.id,
        tanggal: dateObj,
        status,
        keterangan,
      }
    })

    revalidatePath("/elearning/guru")
    revalidatePath("/elearning/guru/absensi")
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// --- JURNAL MENGAJAR ---
export async function createJurnalMengajar(
  pengampuId: number, 
  tanggal: Date, 
  materi: string, 
  catatan?: string, 
  absensiSiswa?: {santriId: number, status: StatusKehadiran}[]
) {
  const session = await getSession()
  if (!session || session.role !== "GURU") throw new Error("Unauthorized")

  try {
    const dateStr = tanggal.toISOString().split("T")[0]
    const dateObj = new Date(dateStr)

    const result = await prisma.$transaction(async (tx) => {
      const jurnal = await tx.jurnalMengajar.create({
        data: { pengampuId, tanggal: dateObj, materi, catatan }
      })

      if (absensiSiswa && absensiSiswa.length > 0) {
        await tx.absensiMapel.createMany({
          data: absensiSiswa.map(a => ({
            jurnalMengajarId: jurnal.id,
            santriId: a.santriId,
            status: a.status
          }))
        })
      }
      return jurnal
    })

    revalidatePath(`/elearning/guru/kelas/${pengampuId}`)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// --- MATERI BELAJAR ---
export async function createMateriBelajar(data: { 
  pengampuId: number; 
  judul: string; 
  deskripsi?: string; 
  fileUrl?: string; 
  tipe: TipeMateri 
}) {
  const session = await getSession()
  if (!session || session.role !== "GURU") throw new Error("Unauthorized")

  try {
    const result = await prisma.materiBelajar.create({ data })
    revalidatePath(`/elearning/guru/kelas/${data.pengampuId}`)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteMateriBelajar(id: number, pengampuId: number) {
  const session = await getSession()
  if (!session || session.role !== "GURU") throw new Error("Unauthorized")

  try {
    await prisma.materiBelajar.delete({ where: { id } })
    revalidatePath(`/elearning/guru/kelas/${pengampuId}`)
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// --- TUGAS ---
export async function createTugas(data: { 
  pengampuId: number; 
  judul: string; 
  deskripsi?: string; 
  fileUrl?: string; 
  tenggatWaktu?: Date; 
  statusPublish?: boolean 
}) {
  const session = await getSession()
  if (!session || session.role !== "GURU") throw new Error("Unauthorized")

  try {
    const result = await prisma.tugas.create({ data })
    revalidatePath(`/elearning/guru/kelas/${data.pengampuId}`)
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function nilaiTugas(pengumpulanId: number, nilai: number, keteranganGuru?: string) {
  const session = await getSession()
  if (!session || session.role !== "GURU") throw new Error("Unauthorized")

  try {
    const pengumpulan = await prisma.pengumpulanTugas.update({
      where: { id: pengumpulanId },
      data: { nilai, keteranganGuru },
      include: { tugas: true }
    })
    revalidatePath(`/elearning/guru/kelas/${pengumpulan.tugas.pengampuId}`)
    return { success: true, data: pengumpulan }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
