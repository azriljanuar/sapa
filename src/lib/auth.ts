import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import prisma from "./prisma"

const secretKey = process.env.JWT_SECRET || "default_secret_key_please_change_in_production"
const encodedKey = new TextEncoder().encode(secretKey)

type SessionPayload = {
  id: number
  email: string
  role: string
  jenjangId: number | null
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey)

  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get("session")?.value

  if (!session) return null

  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload as SessionPayload
  } catch (error) {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

/**
 * Pengganti fungsi getLoggedInAdminJenjang dari auth.ts
 * Fungsi ini mengambil data user ADMIN_JENJANG sungguhan dari database 
 * berdasarkan token sesi JWT.
 */
export async function getLoggedInAdminJenjang() {
  const session = await getSession()

  if (!session || session.role !== "ADMIN_JENJANG") {
    redirect("/logout")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { jenjang: true }
  })

  if (!user || user.role !== "ADMIN_JENJANG") {
    redirect("/logout")
  }

  if (!user.jenjangId) {
    throw new Error("User ADMIN_JENJANG ini belum memiliki relasi dengan Jenjang Pendidikan.")
  }

  return {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
    jenjangId: user.jenjangId,
    jenjang: user.jenjang
  }
}

export async function getLoggedInSuperAdmin() {
  const session = await getSession()

  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/logout")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id }
  })

  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/logout")
  }

  return {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
  }
}
