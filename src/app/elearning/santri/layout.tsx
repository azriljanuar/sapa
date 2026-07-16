import { ReactNode } from "react"
import Link from "next/link"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BookOpen, Calendar, FileText, LayoutDashboard, ArrowLeft, Bell, ChevronRight } from "lucide-react"

export default async function ElearningSantriLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== "SANTRI") {
    redirect("/login")
  }

  const navItems = [
    { href: "/elearning/santri", label: "Dashboard", icon: LayoutDashboard },
    { href: "/elearning/santri/tugas", label: "Tugas Saya", icon: FileText },
    { href: "/elearning/santri/jadwal", label: "Jadwal Pelajaran", icon: Calendar },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-all">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="h-px w-4 bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-slate-800 tracking-tight">E-Learning</span>
              <ChevronRight className="h-4 w-4 text-slate-300" />
              <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">Portal Santri</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-800 leading-tight">{session.email.split('@')[0]}</div>
                <div className="text-xs text-slate-400">Santri</div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {session.email.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-slate-100 flex overflow-x-auto px-4 pb-2 pt-1 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {children}
      </main>

      <footer className="py-5 border-t border-slate-200 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} SAPA E-Learning — Pesantren Al-Ittihaad
      </footer>
    </div>
  )
}
