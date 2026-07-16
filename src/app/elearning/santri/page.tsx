import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { BookOpen, Calendar, ArrowRight, PlayCircle, Clock } from "lucide-react"

export default async function SantriDashboard() {
  const session = await getSession()
  
  // Get active TA
  const activeTA = await prisma.tahunAjaran.findFirst({ orderBy: { nama: 'desc' }, include: { semester: true } })

  // Cari kelas formal si santri
  const riwayatKelas = await prisma.riwayatKelas.findFirst({
    where: { 
      santriId: session?.id,
      kelasFormal: {
        tahunAjaranId: activeTA?.id
      }
    },
    include: {
      kelasFormal: {
        include: {
          pengampu: {
            include: {
              mataPelajaran: true,
              guru: true,
              _count: {
                select: { materiBelajar: true, tugas: true }
              }
            }
          }
        }
      }
    }
  })

  const kelas = riwayatKelas?.kelasFormal
  const pengampuList = kelas?.pengampu || []

  // Count pending tugas (simple naive count, we'll implement real one later)
  const pendingTugas = pengampuList.reduce((acc, p) => acc + p._count.tugas, 0)

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-3">Selamat belajar, {session?.email}! 🚀</h2>
          <p className="text-emerald-100 max-w-xl text-lg mb-6">
            Terus tingkatkan prestasimu. Saat ini kamu berada di {kelas ? kelas.namaKelas : "Belum ada kelas"} 
            pada Tahun Ajaran {activeTA?.nama}.
          </p>
          <div className="flex gap-4">
            <Link href="/elearning/santri/tugas" className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold shadow hover:bg-emerald-50 transition">
              Lihat Tugas ({pendingTugas})
            </Link>
          </div>
        </div>
        {/* Decor */}
        <div className="absolute right-0 top-0 w-64 h-full bg-white opacity-10 blur-3xl transform translate-x-1/2 rounded-full pointer-events-none"></div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-800">Mata Pelajaran Kamu</h3>
      </div>

      {pengampuList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-sm">
          Belum ada mata pelajaran yang ditambahkan di kelas kamu.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pengampuList.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
              <div className="h-28 bg-emerald-100 relative flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-emerald-300" />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors"></div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs font-semibold text-emerald-600 mb-2 uppercase tracking-wider">
                  Oleh: {p.guru.nama}
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">
                  {p.mataPelajaran.nama}
                </h4>
                
                <div className="flex items-center justify-between border-t pt-4 mt-auto">
                  <div className="flex items-center text-xs text-slate-500 font-medium">
                    <BookOpen className="h-4 w-4 mr-1 text-slate-400" /> {p._count.materiBelajar} Materi
                  </div>
                  <div className="flex items-center text-xs text-slate-500 font-medium text-amber-600">
                    <FileText className="h-4 w-4 mr-1" /> {p._count.tugas} Tugas
                  </div>
                </div>
              </div>
              <Link href={`/elearning/santri/kelas/${p.id}`} className="bg-slate-50 p-3 text-center text-sm font-semibold text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center justify-center gap-1 border-t border-slate-100">
                Lihat Materi <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Minimal stub component untuk fix TS error di atas
function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}
