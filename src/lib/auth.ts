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
 * Fungsi ini mengambil data user admin (SUPER_ADMIN / ADMIN_JENJANG) dari database 
 * berdasarkan token sesi JWT.
 * Untuk kompatibilitas transisi, jika user adalah SUPER_ADMIN tanpa jenjangId,
 * otomatis diarahkan ke jenjang MA aktif.
 */
export async function getLoggedInAdminJenjang() {
  const session = await getSession()

  if (!session || (session.role !== "ADMIN_JENJANG" && session.role !== "SUPER_ADMIN")) {
    redirect("/logout")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { jenjang: true }
  })

  if (!user || (user.role !== "ADMIN_JENJANG" && user.role !== "SUPER_ADMIN")) {
    redirect("/logout")
  }

  let jenjang = user.jenjang
  let jenjangId = user.jenjangId

  if (!jenjangId) {
    const maJenjang = await prisma.jenjangPendidikan.findFirst({
      where: {
        OR: [{ id: 2 }, { singkatan: "MA" }, { nama: { contains: "Aliyah" } }]
      }
    })
    jenjangId = maJenjang?.id || 2
    jenjang = maJenjang
  }

  return {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
    jenjangId: jenjangId as number,
    jenjang: jenjang
  }
}

export async function getLoggedInSuperAdmin() {
  const session = await getSession()

  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
    redirect("/logout")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id }
  })

  if (!user) {
    redirect("/logout")
  }

  return {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
  }
}

/**
 * Helper terpadu Super Admin untuk arsitektur Single-Jenjang (Fase 3 & 4).
 * Mengembalikan data admin beserta konfigurasi IdentitasLembaga yang dinamis.
 */
export async function getLoggedInAdmin() {
  const session = await getSession()

  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) {
    redirect("/logout")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id }
  })

  if (!user) {
    redirect("/logout")
  }

  const { getIdentitasLembaga } = await import("./lembaga")
  const lembaga = await getIdentitasLembaga()

  return {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
    lembaga
  }
}

export async function getLoggedInGuru() {
  const session = await getSession()

  if (!session || session.role !== "GURU") {
    redirect("/logout")
  }

  const guru = await prisma.guru.findUnique({
    where: { id: session.id },
    include: { jenjangs: true }
  })

  if (!guru) {
    redirect("/logout")
  }

  return {
    id: guru.id,
    nama: guru.nama,
    email: guru.email,
    nip: guru.nip,
    role: "GURU" as const,
    fotoWajah: guru.fotoWajah,
    jenjangs: guru.jenjangs
  }
}

export async function getLoggedInGuruPiket() {
  const guru = await getLoggedInGuru()
  const { getSelectedTahunAjaran } = await import("./ta-context")
  const activeTA = await getSelectedTahunAjaran()

  if (!activeTA) {
    redirect("/guru")
  }

  const piketAssignments = await prisma.guruPiket.findMany({
    where: {
      guruId: guru.id,
      tahunAjaranId: activeTA.id,
    },
    include: {
      jenjang: true,
      tahunAjaran: true,
    },
  })

  if (piketAssignments.length === 0) {
    redirect("/guru")
  }

  // Gunakan jenjang dari penugasan piket atau jenjang pertama guru
  const jenjangId = piketAssignments[0]?.jenjangId || guru.jenjangs[0]?.id

  return {
    ...guru,
    isGuruPiket: true,
    jenjangId,
    piketAssignments,
    hariPiket: piketAssignments.map((p) => p.hari),
  }
}

export async function getLoggedInSantri() {
  const session = await getSession()

  if (!session || session.role !== "SANTRI") {
    redirect("/logout")
  }

  const santri = await prisma.santri.findUnique({
    where: { id: session.id },
    include: {
      jenjangs: {
        include: { jenjang: true }
      },
      riwayatKelas: {
        where: { kelasFormal: { tahunAjaran: { isActive: true } } },
        include: { kelasFormal: { include: { jenjang: true } } }
      }
    }
  })

  if (!santri) {
    redirect("/logout")
  }

  const activeKelas = santri.riwayatKelas[0]?.kelasFormal || null

  return {
    id: santri.id,
    nama: santri.namaLengkap,
    namaLengkap: santri.namaLengkap,
    nisn: santri.nisn,
    email: santri.nisn,
    role: "SANTRI" as const,
    fotoWajah: santri.fotoWajah,
    jenjangs: santri.jenjangs,
    activeKelas: activeKelas
  }
}
