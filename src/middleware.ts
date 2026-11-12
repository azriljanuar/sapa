import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const secretKey = process.env.JWT_SECRET || "default_secret_key_please_change_in_production"
const encodedKey = new TextEncoder().encode(secretKey)

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value

  const isAuthPage = request.nextUrl.pathname.startsWith("/login")
  
  // Rute yang dilindungi
  const isAdmin = request.nextUrl.pathname.startsWith("/admin") && !request.nextUrl.pathname.startsWith("/admin-jenjang")
  const isAdminJenjang = request.nextUrl.pathname.startsWith("/admin-jenjang")
  const isSuperAdmin = request.nextUrl.pathname.startsWith("/super-admin")
  const isGuru = request.nextUrl.pathname.startsWith("/guru")
  const isSantri = request.nextUrl.pathname.startsWith("/santri")

  if (isAdmin || isAdminJenjang || isSuperAdmin || isGuru || isSantri) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    try {
      const { payload } = await jwtVerify(session, encodedKey, {
        algorithms: ["HS256"],
      })

      // Cek Role Base Access
      // Admin, Super Admin, dan Admin Jenjang memiliki hak akses penuh ke rute administratif
      if ((isAdmin || isAdminJenjang || isSuperAdmin) && payload.role !== "SUPER_ADMIN" && payload.role !== "ADMIN_JENJANG") {
        return NextResponse.redirect(new URL("/login", request.url))
      }
      
      if (isGuru && payload.role !== "GURU") {
        return NextResponse.redirect(new URL("/login", request.url))
      }
      
      if (isSantri && payload.role !== "SANTRI") {
        return NextResponse.redirect(new URL("/login", request.url))
      }
    } catch (error) {
      // Jika token invalid/expired
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // Redirect otomatis rute lama (/admin-jenjang dan /super-admin) ke rute baru (/admin)
    const pathname = request.nextUrl.pathname
    if (pathname === "/admin-jenjang" || pathname === "/super-admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    if (pathname.startsWith("/admin-jenjang/")) {
      const newPath = pathname.replace("/admin-jenjang", "/admin")
      return NextResponse.redirect(new URL(newPath, request.url))
    }
    if (pathname.startsWith("/super-admin/")) {
      const subpath = pathname.replace("/super-admin", "")
      let target = "/admin" + subpath
      if (subpath === "/jenjang") target = "/admin/profil"
      return NextResponse.redirect(new URL(target, request.url))
    }
  }

  // Jika user sudah login dan mengakses halaman login, redirect ke dashboard
  if (isAuthPage && session) {
    try {
      const { payload } = await jwtVerify(session, encodedKey, {
        algorithms: ["HS256"],
      })
      
      const destination = (payload.role === "SUPER_ADMIN" || payload.role === "ADMIN_JENJANG") ? "/admin"
                        : payload.role === "GURU" ? "/guru"
                        : payload.role === "SANTRI" ? "/santri"
                        : "/"
                        
      return NextResponse.redirect(new URL(destination, request.url))
    } catch (error) {
      // Biarkan di halaman login jika token rusak
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/admin-jenjang/:path*", "/super-admin/:path*", "/guru/:path*", "/santri/:path*", "/elearning/:path*", "/login"],
}
