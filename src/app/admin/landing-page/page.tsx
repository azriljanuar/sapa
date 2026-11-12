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
    <div className="p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Pengaturan Landing Page</h1>
        <p className="text-slate-600 mt-2">Sesuaikan konten yang akan ditampilkan di halaman utama publik portal SAPA.</p>
      </div>

      <LandingPageClient initialData={content as any} />
    </div>
  )
}
