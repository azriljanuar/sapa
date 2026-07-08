import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { SantriProfilClient } from "./santri-profil-client"
import Image from "next/image"

export default async function SantriDashboard() {
  const session = await getSession()
  
  if (!session || session.role !== "SANTRI") {
    redirect("/login")
  }

  const santri = await prisma.santri.findUnique({
    where: { nisn: session.email }, // session.email is NISN for SANTRI role
    include: {
      jenjangs: { include: { jenjang: true } },
      riwayatKelas: {
        include: {
          kelasFormal: {
            include: { tahunAjaran: true }
          }
        },
        orderBy: { id: 'desc' }
      }
    }
  })

  let templateKartu = null
  if (santri && santri.jenjangs.length > 0) {
    templateKartu = await prisma.templateKartu.findUnique({
      where: {
        jenjangId_tipe: {
          jenjangId: santri.jenjangs[0].jenjangId,
          tipe: "SANTRI"
        }
      }
    })
  }

  if (!santri) {
    redirect("/login")
  }

  return (
    <div>
      <div className="mb-6 mt-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Ahlan wa Sahlan, {santri.namaLengkap} 👋</h1>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-500 border-b border-slate-200 pb-2">
          <span className="text-emerald-700 border-b-2 border-emerald-700 pb-2 -mb-[9px]">Overview</span>
          <span className="hover:text-slate-900 cursor-pointer">Kehadiran</span>
          <span className="hover:text-slate-900 cursor-pointer">Jadwal</span>
          <span className="hover:text-slate-900 cursor-pointer">Rapor</span>
        </div>
      </div>

      <div className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h2 className="font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2">Informasi Akademik</h2>
              <div>
                <p className="text-sm text-slate-500 font-medium mb-2">Riwayat Pendidikan:</p>
                <div className="space-y-3">
                  {santri.jenjangs.map(j => (
                    <div key={j.id} className="border border-slate-100 rounded-xl p-3 text-sm bg-slate-50">
                      <p className="font-bold text-emerald-700">{j.jenjang.nama}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{j.isAlumni ? "Alumni" : "Santri Aktif"}</p>
                    </div>
                  ))}
                  
                  {santri.riwayatKelas.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 text-xs">
                      <p className="font-medium text-slate-500 mb-2">Riwayat Kelas:</p>
                      <ul className="space-y-2 list-none p-0">
                        {santri.riwayatKelas.map(r => (
                          <li key={r.id} className="bg-white border border-slate-100 p-2.5 rounded-xl shadow-sm">
                            Kelas <span className="font-bold text-slate-800">{r.kelasFormal.namaKelas}</span> <br/>
                            <span className="text-slate-500 font-medium">TA: {r.kelasFormal.tahunAjaran.nama}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <SantriProfilClient 
              santri={santri}
              santriIds={santri.jenjangs.map((j: any) => j.santriId)}
              templateKartu={templateKartu}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
