import { getLoggedInSuperAdmin } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { SarprasPesantrenClient } from "./sarpras-client"

export default async function SarprasPesantrenPage() {
  await getLoggedInSuperAdmin()

  const data = await prisma.sarprasPesantren.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return <SarprasPesantrenClient initialData={data} />
}
