import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const secretKey = process.env.JWT_SECRET || "default_secret_key_please_change_in_production"
const encodedKey = new TextEncoder().encode(secretKey)

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value

  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
  
  // Rute yang dilindungi
  const isAdminJenjang = request.nextUrl.pathname.startsWith("/admin-jenjang")
  const isSuperAdmin = request.nextUrl.pathname.startsWith("/super-admin")

  if (isAdminJenjang || isSuperAdmin) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
      const { payload } = await jwtVerify(session, encodedKey, {
        algorithms: ["HS256"],
      })

      // Cek Role Base Access
      if (isAdminJenjang && payload.role !== "ADMIN_JENJANG" && payload.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/login", request.url))
      }
      
      if (isSuperAdmin && payload.role !== "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/login", request.url))
      }
    } catch (error) {
      // Jika token invalid/expired
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Jika user sudah login dan mengakses halaman login, redirect ke halaman sesuai role
  if (isAuthPage && session) {
    try {
      const { payload } = await jwtVerify(session, encodedKey, {
        algorithms: ["HS256"],
      })
      if (payload.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/super-admin", request.url))
      } else if (payload.role === "ADMIN_JENJANG") {
        return NextResponse.redirect(new URL("/admin-jenjang", request.url))
      }
    } catch (error) {
      // Biarkan di halaman login jika token rusak
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin-jenjang/:path*", "/super-admin/:path*", "/login"],
}
