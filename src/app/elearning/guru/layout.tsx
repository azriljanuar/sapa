import { ReactNode } from "react"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BookOpen, Calendar, Clock, LogOut, CheckSquare, FileText, Settings } from "lucide-react"

export default async function ElearningGuruLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== "GURU") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white shadow-md sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <Link href="/elearning/guru" className="font-bold text-lg tracking-tight hover:text-indigo-100 transition">
              E-Learning Guru
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-sm font-medium text-indigo-100">
              <Link href="/elearning/guru/absensi" className="hover:text-white transition flex items-center gap-1"><CheckSquare className="h-4 w-4"/> Absensi Harian</Link>
              <Link href="/elearning/guru/jadwal" className="hover:text-white transition flex items-center gap-1"><Calendar className="h-4 w-4"/> Jadwal Saya</Link>
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-white/20">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold">{session.email}</div>
                <div className="text-xs text-indigo-200">Pengajar</div>
              </div>
              <div className="h-9 w-9 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center font-bold text-sm">
                {session.email.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>
    </div>
  )
}
