import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { GuruProfilClient } from "./guru-profil-client"
import Image from "next/image"

export default async function GuruDashboard() {
  const session = await getSession()
  
  if (!session || session.role !== "GURU") {
    redirect("/login")
  }

  const guru = await prisma.guru.findUnique({
    where: { id: session.id },
    include: {
      jenjangs: true,
      waliKelas: {
        include: {
          tahunAjaran: true,
        }
      }
    }
  })

  if (!guru) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Banner Header Premium */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-900 to-blue-700 text-white shadow-md border-0 h-48 md:h-64 flex items-center p-8 md:p-12">
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
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Ahlan wa Sahlan, {guru.nama}</h1>
              <p className="text-blue-100 text-base md:text-lg max-w-lg">
                Portal Informasi Akademik Tenaga Pendidik SIAKAD
              </p>
            </div>
            <form action="/login" method="GET">
              <button type="submit" formAction={async () => {
                "use server"
                const { logoutAction } = await import("@/app/login/actions")
                await logoutAction()
              }} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-full backdrop-blur-sm transition-colors border border-white/20 shadow-sm">
                Keluar Sesi
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
              <h2 className="font-semibold text-lg">Informasi Tugas</h2>
              <div>
                <p className="text-sm text-muted-foreground">Mengajar di Jenjang:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {guru.jenjangs.map(j => (
                    <span key={j.id} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md font-medium">
                      {j.nama}
                    </span>
                  ))}
                  {guru.jenjangs.length === 0 && <span className="text-sm text-slate-500">-</span>}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wali Kelas:</p>
                <ul className="mt-1 space-y-1">
                  {guru.waliKelas.map(w => (
                    <li key={w.id} className="text-sm">
                      Kelas {w.namaKelas} ({w.tahunAjaran.nama})
                    </li>
                  ))}
                  {guru.waliKelas.length === 0 && <li className="text-sm text-slate-500">Tidak menjadi wali kelas</li>}
                </ul>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <GuruProfilClient guru={guru} />
          </div>
        </div>
      </div>
    </div>
  )
}
