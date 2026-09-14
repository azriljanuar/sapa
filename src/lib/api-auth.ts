import { NextResponse } from "next/server"

export function validateApiKey(request: Request) {
  const apiKey = request.headers.get("x-api-key")
  const expectedApiKey = process.env.ELEARNING_API_KEY
  const clientIp = request.headers.get("x-forwarded-for") || "unknown IP"
  const method = request.method
  const path = new URL(request.url).pathname

  if (!expectedApiKey) {
    console.error(`[API-AUTH] FAIL: ELEARNING_API_KEY is not set in .env. Blocked request from ${clientIp}`)
    return NextResponse.json({ error: "Server Configuration Error: ELEARNING_API_KEY is missing." }, { status: 500 })
  }

  if (apiKey !== expectedApiKey) {
    console.warn(`[API-AUTH] UNAUTHORIZED: Invalid API Key from ${clientIp} for ${method} ${path}`)
    return NextResponse.json({ error: "Unauthorized. Invalid or missing API Key." }, { status: 401 })
  }

  // console.log(`[API-AUTH] SUCCESS: Access granted to ${clientIp} for ${method} ${path}`)
  return null
}
