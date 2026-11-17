import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import LandingPageClient from "./landing-client"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function CMSLandingPage() {
  const session = await getSession()
  if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_JENJANG")) redirect("/login")

  let content = await prisma.landingPageContent.findFirst()

  // Default content is handled by API/client, but we provide empty or current here
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengaturan Landing Page</h1>
        <p className="text-sm text-muted-foreground mt-1">Sesuaikan konten yang akan ditampilkan di halaman utama publik portal SAPA.</p>
      </div>

      <LandingPageClient initialData={content as any} />
    </div>
  )
}
