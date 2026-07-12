import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateApiKey } from "@/lib/api-auth"
// @ts-ignore
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  const authError = validateApiKey(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { identifier, password } = body

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Identifier (NISN/NIP/Email) dan password wajib diisi." },
        { status: 400 }
      )
    }

    // 1. Cek di tabel Guru (berdasarkan Email atau NIP)
    const guru = await prisma.guru.findFirst({
      where: {
        OR: [
          { email: identifier },
          { nip: identifier }
        ]
      },
      include: {
        jenjangs: {
          select: {
            id: true,
            nama: true,
            singkatan: true
          }
        }
      }
    })

    if (guru) {
      const isPasswordValid = bcrypt.compareSync(password, guru.password)
      if (isPasswordValid) {
        // Hilangkan password sebelum dikembalikan
        const { password: _, ...userWithoutPassword } = guru
        return NextResponse.json({
          success: true,
          type: "guru",
          user: userWithoutPassword
        })
      }
    }

    // 2. Cek di tabel Santri (berdasarkan NISN)
    const santri = await prisma.santri.findFirst({
      where: {
        nisn: identifier
      },
      include: {
        jenjangs: {
          select: {
            jenjang: {
              select: {
                id: true,
                nama: true,
                singkatan: true
              }
            }
          }
        }
      }
    })

    if (santri) {
      const isPasswordValid = bcrypt.compareSync(password, santri.password)
      if (isPasswordValid) {
        // Hilangkan password sebelum dikembalikan
        const { password: _, ...userWithoutPassword } = santri
        return NextResponse.json({
          success: true,
          type: "santri",
          user: userWithoutPassword
        })
      }
    }

    // 3. Cek di tabel User (Admin Jenjang / Super Admin) (berdasarkan Email atau Nama)
    const admin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { nama: identifier }
        ]
      }
    })

    if (admin) {
      const isPasswordValid = bcrypt.compareSync(password, admin.password)
      if (isPasswordValid) {
        // Hilangkan password sebelum dikembalikan
        const { password: _, ...userWithoutPassword } = admin
        return NextResponse.json({
          success: true,
          type: admin.role, // Akan mengembalikan "SUPER_ADMIN" atau "ADMIN_JENJANG"
          user: userWithoutPassword
        })
      }
    }

    // Jika sampai di sini, berarti identifier tidak ditemukan ATAU password salah
    return NextResponse.json(
      { success: false, message: "Username atau Password salah." },
      { status: 401 }
    )

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
