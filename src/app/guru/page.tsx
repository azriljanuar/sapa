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

  let templateKartu = null
  if (guru && guru.jenjangs.length > 0) {
    templateKartu = await prisma.templateKartu.findUnique({
      where: {
        jenjangId_tipe: {
          jenjangId: guru.jenjangs[0].id,
          tipe: "GURU"
        }
      }
    })
  }

  if (!guru) {
    redirect("/login")
  }

  return (
    <div>
      <div className="mb-6 mt-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Ahlan wa Sahlan, {guru.nama} 👋</h1>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-500 border-b border-slate-200 pb-2">
          <span className="text-emerald-700 border-b-2 border-emerald-700 pb-2 -mb-[9px]">Overview</span>
          <span className="hover:text-slate-900 cursor-pointer">Data Siswa</span>
          <span className="hover:text-slate-900 cursor-pointer">Penilaian</span>
        </div>
      </div>
      
      <div className="space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <h2 className="font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2">Informasi Tugas</h2>
              <div>
                <p className="text-sm text-slate-500 font-medium mb-2">Mengajar di Jenjang:</p>
                <div className="flex flex-wrap gap-2">
                  {guru.jenjangs.map(j => (
                    <span key={j.id} className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-md font-bold">
                      {j.nama}
                    </span>
                  ))}
                  {guru.jenjangs.length === 0 && <span className="text-sm text-slate-400">-</span>}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium mb-2 mt-4">Wali Kelas:</p>
                <ul className="space-y-2">
                  {guru.waliKelas.map(w => (
                    <li key={w.id} className="text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      Kelas {w.namaKelas} <span className="text-slate-500 font-normal ml-1">({w.tahunAjaran.nama})</span>
                    </li>
                  ))}
                  {guru.waliKelas.length === 0 && <li className="text-sm text-slate-400">Tidak menjadi wali kelas</li>}
                </ul>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <GuruProfilClient guru={guru} templateKartu={templateKartu} />
          </div>
        </div>
      </div>
    </div>
  )
}
