import Link from "next/link"
import { ArrowLeft, BookOpen, Clock, PlayCircle } from "lucide-react"

export default function ELearningPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">SAPA E-Learning</h1>
          </div>
          <div>
            <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white mb-10 shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Mulai Belajar Hari Ini!</h2>
          <p className="text-purple-100 text-lg mb-8 max-w-2xl">
            Akses materi pelajaran, kumpulkan tugas, dan pantau perkembangan belajar Anda langsung dari satu tempat.
          </p>
          <button className="bg-white text-purple-600 font-semibold px-6 py-3 rounded-xl shadow-md hover:bg-slate-50 transition-colors">
            Lanjutkan Materi Terakhir
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900">Kelas Anda</h3>
          <button className="text-purple-600 font-medium hover:underline">Lihat Semua</button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="h-32 bg-slate-200 relative">
              <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            </div>
            <div className="p-5">
              <div className="text-xs font-semibold text-purple-600 mb-2">FIQIH - KELAS 10</div>
              <h4 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">Fikih Ibadah Praktis</h4>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">Pelajari tata cara thaharah, shalat, zakat, dan puasa sesuai sunnah.</p>
              
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center text-xs text-slate-500 font-medium">
                  <PlayCircle className="h-4 w-4 mr-1 text-slate-400" /> 12 Video
                </div>
                <div className="flex items-center text-xs text-slate-500 font-medium">
                  <Clock className="h-4 w-4 mr-1 text-slate-400" /> 8 Jam
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
            <div className="h-32 bg-slate-200 relative">
              <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            </div>
            <div className="p-5">
              <div className="text-xs font-semibold text-blue-600 mb-2">TAFSIR - KELAS 10</div>
              <h4 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">Tafsir Jalalain Juz 30</h4>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">Mendalami makna surat-surat pendek dalam Al-Quran.</p>
              
              <div className="flex items-center justify-between border-t pt-4">
                <div className="flex items-center text-xs text-slate-500 font-medium">
                  <PlayCircle className="h-4 w-4 mr-1 text-slate-400" /> 24 Video
                </div>
                <div className="flex items-center text-xs text-slate-500 font-medium">
                  <Clock className="h-4 w-4 mr-1 text-slate-400" /> 15 Jam
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
