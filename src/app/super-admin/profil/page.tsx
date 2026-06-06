import { getLoggedInSuperAdmin } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { ProfilPesantrenClient } from "./profil-client"

export default async function ProfilPesantrenPage() {
  await getLoggedInSuperAdmin()

  // Get the single profile
  let profil = await prisma.profilPesantren.findFirst()

  // If no profile exists, return a default empty object
  if (!profil) {
    profil = {
      id: 0,
      namaPesantren: "",
      nspp: "",
      alamatLengkap: "",
      telepon: "",
      email: "",
      website: "",
      namaPimpinan: "",
      logoUrl: "",
    }
  }

  return <ProfilPesantrenClient initialData={profil} />
}
