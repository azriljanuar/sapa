"use server"

import { getLoggedInGuru } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ─── Simpan Nilai Sumatif ─────────────────────────────────────────────────────
export async function simpanNilaiSumatif(data: {
  pengampuId: number
  santriId: number
  semesterId: number
  sumatifKe: number
  nilaiKurikuler: number | null
  nilaiTesSumatif: number | null
  nilaiKehadiran?: number | null
  hadir?: number | null
  sakit?: number | null
  izin?: number | null
  alfa?: number | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guru = await getLoggedInGuru()

    // Verifikasi pengampu milik guru ini
    const pengampu = await prisma.pengampuMataPelajaran.findUnique({
      where: { id: data.pengampuId },
      select: { guruId: true }
    })

    if (!pengampu || pengampu.guruId !== guru.id) {
      return { success: false, error: "Akses tidak diizinkan" }
    }

    await prisma.nilaiSumatif.upsert({
      where: {
        pengampuId_santriId_sumatifKe_semesterId: {
          pengampuId: data.pengampuId,
          santriId: data.santriId,
          sumatifKe: data.sumatifKe,
          semesterId: data.semesterId
        }
      },
      update: {
        nilaiKurikuler: data.nilaiKurikuler,
        nilaiTesSumatif: data.nilaiTesSumatif,
        nilaiKehadiran: data.nilaiKehadiran,
        hadir: data.hadir,
        sakit: data.sakit,
        izin: data.izin,
        alfa: data.alfa,
      },
      create: {
        pengampuId: data.pengampuId,
        santriId: data.santriId,
        semesterId: data.semesterId,
        sumatifKe: data.sumatifKe,
        nilaiKurikuler: data.nilaiKurikuler,
        nilaiTesSumatif: data.nilaiTesSumatif,
        nilaiKehadiran: data.nilaiKehadiran,
        hadir: data.hadir,
        sakit: data.sakit,
        izin: data.izin,
        alfa: data.alfa,
      }
    })

    revalidatePath(`/guru/penilaian/${data.pengampuId}`)
    return { success: true }
  } catch (e: any) {
    console.error("simpanNilaiSumatif error:", e)
    return { success: false, error: e.message || "Gagal menyimpan nilai" }
  }
}

// ─── Simpan Nilai PAS ─────────────────────────────────────────────────────────
export async function simpanNilaiPAS(data: {
  pengampuId: number
  santriId: number
  semesterId: number
  nilai: number | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    const guru = await getLoggedInGuru()

    // Verifikasi pengampu milik guru ini
    const pengampu = await prisma.pengampuMataPelajaran.findUnique({
      where: { id: data.pengampuId },
      select: { guruId: true }
    })

    if (!pengampu || pengampu.guruId !== guru.id) {
      return { success: false, error: "Akses tidak diizinkan" }
    }

    await prisma.nilaiPAS.upsert({
      where: {
        pengampuId_santriId_semesterId: {
          pengampuId: data.pengampuId,
          santriId: data.santriId,
          semesterId: data.semesterId
        }
      },
      update: { nilai: data.nilai },
      create: {
        pengampuId: data.pengampuId,
        santriId: data.santriId,
        semesterId: data.semesterId,
        nilai: data.nilai,
      }
    })

    revalidatePath(`/guru/penilaian/${data.pengampuId}`)
    return { success: true }
  } catch (e: any) {
    console.error("simpanNilaiPAS error:", e)
    return { success: false, error: e.message || "Gagal menyimpan nilai PAS" }
  }
}

// ─── Simpan Semua Nilai Batch (Sumatif) ──────────────────────────────────────
export async function simpanBatchNilaiSumatif(data: {
  pengampuId: number
  semesterId: number
  sumatifKe: number
  items: {
    santriId: number
    nilaiKurikuler: number | null
    nilaiTesSumatif: number | null
    nilaiKehadiran?: number | null
    hadir?: number | null
    sakit?: number | null
    izin?: number | null
    alfa?: number | null
  }[]
}): Promise<{ success: boolean; savedCount: number; error?: string }> {
  try {
    const guru = await getLoggedInGuru()

    const pengampu = await prisma.pengampuMataPelajaran.findUnique({
      where: { id: data.pengampuId },
      select: { guruId: true }
    })

    if (!pengampu || pengampu.guruId !== guru.id) {
      return { success: false, savedCount: 0, error: "Akses tidak diizinkan" }
    }

    let savedCount = 0
    for (const item of data.items) {
      await prisma.nilaiSumatif.upsert({
        where: {
          pengampuId_santriId_sumatifKe_semesterId: {
            pengampuId: data.pengampuId,
            santriId: item.santriId,
            sumatifKe: data.sumatifKe,
            semesterId: data.semesterId
          }
        },
        update: {
          nilaiKurikuler: item.nilaiKurikuler,
          nilaiTesSumatif: item.nilaiTesSumatif,
          nilaiKehadiran: item.nilaiKehadiran,
          hadir: item.hadir,
          sakit: item.sakit,
          izin: item.izin,
          alfa: item.alfa,
        },
        create: {
          pengampuId: data.pengampuId,
          santriId: item.santriId,
          semesterId: data.semesterId,
          sumatifKe: data.sumatifKe,
          nilaiKurikuler: item.nilaiKurikuler,
          nilaiTesSumatif: item.nilaiTesSumatif,
          nilaiKehadiran: item.nilaiKehadiran,
          hadir: item.hadir,
          sakit: item.sakit,
          izin: item.izin,
          alfa: item.alfa,
        }
      })
      savedCount++
    }

    revalidatePath(`/guru/penilaian/${data.pengampuId}`)
    return { success: true, savedCount }
  } catch (e: any) {
    console.error("simpanBatchNilaiSumatif error:", e)
    return { success: false, savedCount: 0, error: e.message || "Gagal menyimpan nilai" }
  }
}

// ─── Simpan Semua Nilai PAS Batch ─────────────────────────────────────────────
export async function simpanBatchNilaiPAS(data: {
  pengampuId: number
  semesterId: number
  items: { santriId: number; nilai: number | null }[]
}): Promise<{ success: boolean; savedCount: number; error?: string }> {
  try {
    const guru = await getLoggedInGuru()

    const pengampu = await prisma.pengampuMataPelajaran.findUnique({
      where: { id: data.pengampuId },
      select: { guruId: true }
    })

    if (!pengampu || pengampu.guruId !== guru.id) {
      return { success: false, savedCount: 0, error: "Akses tidak diizinkan" }
    }

    let savedCount = 0
    for (const item of data.items) {
      await prisma.nilaiPAS.upsert({
        where: {
          pengampuId_santriId_semesterId: {
            pengampuId: data.pengampuId,
            santriId: item.santriId,
            semesterId: data.semesterId
          }
        },
        update: { nilai: item.nilai },
        create: {
          pengampuId: data.pengampuId,
          santriId: item.santriId,
          semesterId: data.semesterId,
          nilai: item.nilai,
        }
      })
      savedCount++
    }

    revalidatePath(`/guru/penilaian/${data.pengampuId}`)
    return { success: true, savedCount }
  } catch (e: any) {
    console.error("simpanBatchNilaiPAS error:", e)
    return { success: false, savedCount: 0, error: e.message || "Gagal menyimpan nilai PAS" }
  }
}

// ─── Toggle Rilis Nilai ke Santri ─────────────────────────────────────────────
export async function toggleRilisNilaiMapel(pengampuId: number, nilaiDirilis: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const guru = await getLoggedInGuru()

    const pengampu = await prisma.pengampuMataPelajaran.findUnique({
      where: { id: pengampuId },
      select: { guruId: true }
    })

    if (!pengampu || pengampu.guruId !== guru.id) {
      return { success: false, error: "Akses tidak diizinkan" }
    }

    await prisma.pengampuMataPelajaran.update({
      where: { id: pengampuId },
      data: {
        nilaiDirilis,
        tanggalRilis: nilaiDirilis ? new Date() : null,
      }
    })

    revalidatePath(`/guru/penilaian/${pengampuId}`)
    revalidatePath("/santri/nilai")
    return { success: true }
  } catch (e: any) {
    console.error("toggleRilisNilaiMapel error:", e)
    return { success: false, error: e.message || "Gagal mengubah status rilis nilai" }
  }
}
