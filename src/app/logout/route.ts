import { NextResponse, NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  // Gunakan header "host" dari browser untuk memastikan redirect ke URL yang benar
  // Hindari penggunaan request.url langsung karena server bisa bind ke 0.0.0.0
  const host = request.headers.get("host") || "localhost:3000"
  const proto = request.headers.get("x-forwarded-proto") || "http"
  const loginUrl = `${proto}://${host}/login`

  const response = NextResponse.redirect(loginUrl)
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  })
  return response
}
