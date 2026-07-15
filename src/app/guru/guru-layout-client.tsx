"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Menu, Search, Bell, Home, Users, BookOpen, GraduationCap, 
  LogOut, ChevronLeft, CalendarDays, IdCard
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TaSwitcher } from "@/components/ta-switcher"

export function GuruLayoutClient({ 
  children,
  guru,
  tahunAjarans,
  activeTaId,
}: {
  children: React.ReactNode
  guru: any
  tahunAjarans: any[]
  activeTaId: number | null
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { name: "Overview", href: "/guru", icon: Home },
    { name: "Data Siswa", href: "/guru/siswa", icon: Users },
    { name: "Jadwal Mengajar", href: "/guru/jadwal", icon: CalendarDays },
    { name: "Penilaian", href: "/guru/nilai", icon: BookOpen },
    { name: "Profil & Kartu", href: "/guru#profil", icon: IdCard },
  ]

  const isActive = (href: string) => {
    if (href === "/guru") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-dvh bg-slate-50 text-slate-900 font-sans">
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-transparent">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-slate-900 shrink-0" />
            <div className="flex flex-col text-slate-900">
              <span className="text-2xl font-black leading-none tracking-tight">SAPA</span>
              <span className="text-[0.5rem] font-medium leading-[1.1] mt-0.5 whitespace-normal break-words max-w-[65px]">
                Sistem Akademik Pesantren Al-Ittihaad
              </span>
            </div>
          </div>
          <button className="lg:hidden text-slate-500" onClick={() => setIsSidebarOpen(false)}>
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Main Menu
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={cn(
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl relative transition-all",
                      active 
                        ? "text-emerald-700 bg-emerald-50" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      active ? "text-emerald-700" : "text-slate-400 group-hover:text-slate-500"
                    )} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Others
            </p>
            <nav className="space-y-1">
              <Link
                href="/guru#support"
                className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
              >
                <Users className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-slate-500" />
                Support
              </Link>
        <div className="p-4 border-t border-slate-100 mt-4">
          <form action={async () => {
            const { logoutAction } = await import("@/app/login/actions")
            await logoutAction()
          }}>
            <button
              type="submit"
              className="w-full group flex items-center px-3 py-2.5 text-sm font-bold rounded-xl text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
              Log Out
            </button>
          </form>
        </div>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-transparent flex items-center justify-between px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-4 flex-1">
            <button 
              className="p-2 -ml-2 text-slate-500 hover:text-slate-600 lg:hidden rounded-full hover:bg-slate-50"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex max-w-lg w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                type="text" 
                placeholder="Search for staffs, student or bills" 
                className="w-full pl-11 bg-white border-0 shadow-sm focus-visible:ring-1 focus-visible:ring-emerald-500 rounded-full h-11 text-sm text-slate-700"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {activeTaId && (
              <TaSwitcher tahunAjarans={tahunAjarans} selectedId={activeTaId} />
            )}
            
            <button className="p-2 text-slate-600 hover:text-slate-900 relative rounded-full hover:bg-slate-200/50 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 ring-2 ring-white shadow-sm">
                <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${guru?.nama || "Guru"}`} alt={guru?.nama || "Guru"} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700">{guru?.nama?.substring(0, 2).toUpperCase() || "GU"}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
