import { getSession } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function KehadiranSantriPage() {
  const session = await getSession()
  if (!session || session.role !== "SANTRI") {
    redirect("/login")
  }

  // Dummy attendance data for demonstration
  // In a real app, this would be fetched from Prisma
  const daysInMonth = 31
  const attendanceData = Array.from({ length: daysInMonth }, (_, i) => {
    const isWeekend = (i + 1) % 7 === 0 || (i + 2) % 7 === 0 // rough estimate of weekend
    if (isWeekend) return null // null means no class
    
    // randomly mark 3 days as absent for the demo
    if (i === 4 || i === 12 || i === 18) {
      return false // Absent
    }
    return true // Present
  })

  return (
    <div>
      <div className="mb-6 mt-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Kehadiran</h1>
        <p className="text-slate-500 text-sm">Rekap absensi bulan ini</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="font-semibold text-lg text-slate-800 border-b border-slate-100 pb-2 mb-4">Agustus 2026</h2>
        
        <div className="grid grid-cols-7 gap-2 text-center mb-2">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
            <div key={day} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{day}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {/* Padding for offset (starts on a Saturday in August 2026 for example) */}
          <div className="aspect-square"></div>
          <div className="aspect-square"></div>
          <div className="aspect-square"></div>
          <div className="aspect-square"></div>
          <div className="aspect-square"></div>
          
          {attendanceData.map((isPresent, idx) => (
            <div 
              key={idx}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium border ${
                isPresent === true 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                  : isPresent === false 
                    ? "bg-red-50 border-red-200 text-red-600" 
                    : "bg-slate-50 border-slate-100 text-slate-400"
              }`}
              title={isPresent === true ? "Hadir" : isPresent === false ? "Absen" : "Libur"}
            >
              {idx + 1}
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-4 h-4 rounded-md bg-emerald-50 border border-emerald-200"></div> Hadir
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-4 h-4 rounded-md bg-red-50 border border-red-200"></div> Absen
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-4 h-4 rounded-md bg-slate-50 border border-slate-100"></div> Libur
          </div>
        </div>
      </div>
    </div>
  )
}
