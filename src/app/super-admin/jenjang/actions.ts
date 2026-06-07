"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export type ActionState = {
  ok: boolean
  message: string
  fieldErrors?: Record<string, string>
}

function prismaErrorToState(error: unknown): ActionState {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta?.target.join(",")
        : String(error.meta?.target ?? "")
      return { ok: false, message: `Data duplikat pada kolom: ${target}` }
    }
    if (error.code === "P2014") {
      return { ok: false, message: "Data tidak bisa dihapus karena masih dipakai." }
    }
  }
  return { ok: false, message: "Terjadi kesalahan. Coba lagi." }
}

const jenjangSchema = z.object({
  nama: z.string().trim().min(2, "Nama jenjang wajib diisi."),
  singkatan: z.string().trim().min(1, "Singkatan wajib diisi."),
})

export async function createJenjang(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = jenjangSchema.safeParse({
    nama: formData.get("nama"),
    singkatan: formData.get("singkatan"),
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form")
      fieldErrors[key] = issue.message
    }
    return { ok: false, message: "Validasi gagal.", fieldErrors }
  }

  try {
    await prisma.jenjangPendidikan.create({
      data: { nama: parsed.data.nama, singkatan: parsed.data.singkatan },
    })
    revalidatePath("/super-admin/jenjang")
    return { ok: true, message: "Jenjang berhasil dibuat." }
  } catch (e) {
    return prismaErrorToState(e)
  }
}

export async function updateJenjang(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = Number(formData.get("id"))
  if (!Number.isFinite(id)) return { ok: false, message: "ID tidak valid." }

  const parsed = jenjangSchema.safeParse({
    nama: formData.get("nama"),
    singkatan: formData.get("singkatan"),
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form")
      fieldErrors[key] = issue.message
    }
    return { ok: false, message: "Validasi gagal.", fieldErrors }
  }

  try {
    await prisma.jenjangPendidikan.update({
      where: { id },
      data: { nama: parsed.data.nama, singkatan: parsed.data.singkatan },
    })
    revalidatePath("/super-admin/jenjang")
    return { ok: true, message: "Jenjang berhasil diperbarui." }
  } catch (e) {
    return prismaErrorToState(e)
  }
}

export async function deleteJenjang(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = Number(formData.get("id"))
  if (!Number.isFinite(id)) return { ok: false, message: "ID tidak valid." }

  try {
    await prisma.jenjangPendidikan.delete({ where: { id } })
    revalidatePath("/super-admin/jenjang")
    return { ok: true, message: "Jenjang berhasil dihapus." }
  } catch (e) {
    return prismaErrorToState(e)
  }
}
