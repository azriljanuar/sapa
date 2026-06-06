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

  if (!santri) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Banner Header Premium */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-emerald-800 to-emerald-600 text-white shadow-md border-0 h-48 md:h-64 flex items-center p-8 md:p-12">
          <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay">
            <Image 
              src="/images/banner_islamic.png" 
              alt="Banner Background" 
              fill 
              className="object-cover"
              priority
            />
          </div>
          
          <div className="relative z-10 w-full flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Ahlan wa Sahlan, {santri.namaLengkap}</h1>
              <p className="text-emerald-100 text-base md:text-lg max-w-lg">
                Portal Informasi Akademik Santri SIAKAD
              </p>
            </div>
            <form action="/login" method="GET">
              <button type="submit" formAction={async () => {
                "use server"
                const { logoutAction } = await import("@/app/login/actions")
                await logoutAction()
              }} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-full backdrop-blur-sm transition-colors border border-white/30 shadow-sm">
                Keluar Sesi
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
              <h2 className="font-semibold text-lg">Informasi Akademik</h2>
              <div>
                <p className="text-sm text-muted-foreground">Riwayat Pendidikan:</p>
                <div className="space-y-3 mt-2">
                  {santri.jenjangs.map(j => (
                    <div key={j.id} className="border rounded-md p-3 text-sm">
                      <p className="font-medium text-primary">{j.jenjang.nama}</p>
                      <p className="text-xs text-muted-foreground">{j.isAlumni ? "Alumni" : "Santri Aktif"}</p>
                    </div>
                  ))}
                  
                  {santri.riwayatKelas.length > 0 && (
                    <div className="mt-4 pt-3 border-t text-xs">
                      <p className="font-semibold mb-2">Riwayat Kelas:</p>
                      <ul className="space-y-2 list-none p-0">
                        {santri.riwayatKelas.map(r => (
                          <li key={r.id} className="bg-slate-50 p-2 rounded">
                            Kelas <span className="font-semibold">{r.kelasFormal.namaKelas}</span> <br/>
                            <span className="text-muted-foreground">TA: {r.kelasFormal.tahunAjaran.nama}</span>
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
            <SantriProfilClient santri={santri} santriIds={[santri.id]} />
          </div>
        </div>
      </div>
    </div>
  )
}
