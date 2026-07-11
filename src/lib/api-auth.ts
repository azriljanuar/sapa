import { NextResponse } from "next/server"

export function validateApiKey(request: Request) {
  // Check the header
  const apiKey = request.headers.get("x-api-key")
  const expectedApiKey = process.env.ELEARNING_API_KEY

  if (!expectedApiKey) {
    console.warn("ELEARNING_API_KEY is not set in .env")
    return NextResponse.json({ error: "Server Configuration Error: ELEARNING_API_KEY is missing." }, { status: 500 })
  }

  if (apiKey !== expectedApiKey) {
    return NextResponse.json({ error: "Unauthorized. Invalid or missing API Key." }, { status: 401 })
  }

  return null // Return null if validation passes
}
