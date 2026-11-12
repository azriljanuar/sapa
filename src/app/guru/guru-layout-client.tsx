"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Menu, Home, LogOut, ChevronLeft, 
  GraduationCap, UserCheck, CalendarCheck, CalendarDays, ClipboardCheck, User, BarChart2,
  Calendar, ClipboardList, IdCard, ShieldCheck
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { TaSwitcher } from "@/components/ta-switcher"

export function GuruLayoutClient({ 
  children,
  guru,
  isWaliKelas,
  isGuruPiket,
  allTa = [],
  activeSemesterId = null,
}: {
  children: React.ReactNode
  guru: any
  isWaliKelas?: boolean
  isGuruPiket?: boolean
  allTa?: any[]
  activeSemesterId?: number | null
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { name: "Beranda", href: "/guru", icon: Home },
    { name: "Profil Guru", href: "/guru/profil", icon: User },
    { name: "Jadwal Mengajar", href: "/guru/jadwal", icon: CalendarDays },
    { name: "Penilaian", href: "/guru/penilaian", icon: BarChart2 },
    ...(isWaliKelas ? [
      { name: "Rekap Kehadiran Siswa", href: "/guru/rekap-kehadiran", icon: ClipboardCheck }
    ] : []),
  ]

  const piketNavItems = isGuruPiket ? [
    { name: "Jadwal Pelajaran", href: "/guru/piket/jadwal", icon: Calendar },
    { name: "Rekap Kehadiran", href: "/guru/piket/rekap-kehadiran", icon: ClipboardList },
    { name: "Kartu Identitas", href: "/guru/piket/kartu-identitas", icon: IdCard },
  ] : []

  const isActive = (href: string) => {
    if (href === "/guru") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const initials = guru?.nama
    ? guru.nama
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "GU"

  return (
    <div className="flex min-h-dvh bg-background text-foreground font-sans antialiased">
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col print:hidden select-none",
        isSidebarOpen ? "translate-x-0 shadow-xl lg:shadow-none" : "-translate-x-full",
        isCollapsed ? "w-18" : "w-64"
      )}>
        {/* Sidebar Header */}
        <div className={cn(
          "h-16 flex items-center border-b border-sidebar-border px-4 transition-all duration-300",
          isCollapsed ? "justify-center px-0" : "justify-between"
        )}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-base tracking-tight text-sidebar-foreground truncate">
                  Portal Guru
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  SAPA Akademik
                </span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-7 h-7 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground items-center justify-center transition-colors"
            title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform duration-200", isCollapsed && "rotate-180")} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
          <div className={cn("px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider", isCollapsed && "sr-only")}>
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative",
                  active 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  isCollapsed && "justify-center px-0 h-10 w-10 mx-auto"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                )} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}

          {/* Navigasi Khusus Guru Piket */}
          {isGuruPiket && (
            <div className="pt-4 space-y-1">
              <div className={cn("px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between", isCollapsed && "sr-only")}>
                <span>Fitur Guru Piket</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Penugasan Piket Aktif" />
              </div>
              {piketNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    title={isCollapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative",
                      active 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" 
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      isCollapsed && "justify-center px-0 h-10 w-10 mx-auto"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                    )} />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-sidebar-border bg-sidebar/50">
          <div className={cn("flex items-center gap-3 p-2 rounded-lg bg-card/60 border border-border shadow-2xs mb-2", isCollapsed && "justify-center p-1 border-none bg-transparent")}>
            <Avatar className="w-9 h-9 border border-border shrink-0">
              {guru?.fotoWajah && <AvatarImage src={guru.fotoWajah} alt={guru.nama} className="object-cover" />}
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-sidebar-foreground truncate">
                  {guru?.nama}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {guru?.nip || "Guru Pengajar"}
                </span>
              </div>
            )}
          </div>

          <Link
            href="/logout"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full",
              isCollapsed && "justify-center px-0 h-9 w-9 mx-auto"
            )}
            title={isCollapsed ? "Keluar Sistem" : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Keluar</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-dvh">
        
        {/* Top Navbar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Link href="/guru" className="hover:text-foreground transition-colors">Portal Guru</Link>
              <span>/</span>
              <span className="text-foreground font-semibold">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <TaSwitcher tahunAjarans={allTa} selectedSemesterId={activeSemesterId} />

            <div className="hidden md:flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground">
              <CalendarCheck className="w-3.5 h-3.5 text-primary" />
              <span>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <Link
              href="/logout"
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

    </div>
  )
}
