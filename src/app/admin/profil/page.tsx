import { getLoggedInAdmin } from "@/lib/auth"
import { getIdentitasLembaga } from "@/lib/lembaga"
import { ProfilJenjangClient } from "./profil-client"

export const dynamic = "force-dynamic"

export default async function ProfilLembagaPage() {
  await getLoggedInAdmin()
  const lembaga = await getIdentitasLembaga()

  return <ProfilJenjangClient initialData={lembaga} />
}
