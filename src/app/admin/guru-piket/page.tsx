import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function GuruPiketPage() {
  redirect("/admin/tugas-tambahan?tab=piket")
}
