"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import bcrypt from "bcryptjs"

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

const createSchema = z.object({
  nama: z.string().trim().min(2, "Nama wajib diisi."),
  email: z.string().trim().email("Email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
  jenjangId: z.coerce.number().int().positive("Jenjang wajib dipilih."),
})

export async function createAdminJenjang(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = createSchema.safeParse({
    nama: formData.get("nama"),
    email: formData.get("email"),
    password: formData.get("password"),
    jenjangId: formData.get("jenjangId"),
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
    const passwordHash = await bcrypt.hash(parsed.data.password, 10)
    await prisma.user.create({
      data: {
        nama: parsed.data.nama,
        email: parsed.data.email,
        password: passwordHash,
        role: "ADMIN_JENJANG",
        jenjangId: parsed.data.jenjangId,
      },
    })
    revalidatePath("/super-admin/pengguna")
    return { ok: true, message: "Pengguna berhasil dibuat." }
  } catch (e) {
    return prismaErrorToState(e)
  }
}

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  nama: z.string().trim().min(2, "Nama wajib diisi."),
  email: z.string().trim().email("Email tidak valid."),
  password: z.string().optional(),
  jenjangId: z.coerce.number().int().positive("Jenjang wajib dipilih."),
})

export async function updateAdminJenjang(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    nama: formData.get("nama"),
    email: formData.get("email"),
    password: formData.get("password") ? String(formData.get("password")) : undefined,
    jenjangId: formData.get("jenjangId"),
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
    const data: { nama: string; email: string; jenjangId: number; password?: string } = {
      nama: parsed.data.nama,
      email: parsed.data.email,
      jenjangId: parsed.data.jenjangId,
    }
    if (parsed.data.password && parsed.data.password.length > 0) {
      if (parsed.data.password.length < 6) {
        return {
          ok: false,
          message: "Validasi gagal.",
          fieldErrors: { password: "Password minimal 6 karakter." },
        }
      }
      data.password = await bcrypt.hash(parsed.data.password, 10)
    }

    await prisma.user.update({
      where: { id: parsed.data.id },
      data,
    })
    revalidatePath("/super-admin/pengguna")
    return { ok: true, message: "Pengguna berhasil diperbarui." }
  } catch (e) {
    return prismaErrorToState(e)
  }
}

export async function deleteUser(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = Number(formData.get("id"))
  if (!Number.isFinite(id)) return { ok: false, message: "ID tidak valid." }

  try {
    await prisma.user.delete({ where: { id } })
    revalidatePath("/super-admin/pengguna")
    return { ok: true, message: "Pengguna berhasil dihapus." }
  } catch (e) {
    return prismaErrorToState(e)
  }
}
