import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    let content = await prisma.landingPageContent.findFirst()
    
    // If not found, return a default template structure so the frontend won't crash
    if (!content) {
      content = {
        id: 1,
        heroData: {
          badge: "Sistem Akademik Pesantren Terpadu",
          title: "Digitalisasi Pesantren untuk",
          titleHighlight: "Masa Depan",
          desc: "SAPA mengintegrasikan manajemen data akademik dan pembelajaran elektronik dalam satu pintu. Memudahkan pengurus, guru, dan santri.",
          btnLabel: "Masuk Sekarang",
          imageUrl: "/images/hero.jpg"
        },
        statsData: [
          { angka: "1.200+", label: "Santri" },
          { angka: "80+", label: "Guru" },
          { angka: "6", label: "Jenjang" },
          { angka: "15", label: "Tahun Berdiri" }
        ],
        featuresData: [
          { iconName: "Clipboard", title: "Absensi QR Code", desc: "Rekam kehadiran santri & guru otomatis hanya dengan scan barcode, real-time." },
          { iconName: "GraduationCap", title: "Data Akademik", desc: "Kelola data santri, kelas, jadwal, dan nilai rapor dalam satu platform terpadu." },
          { iconName: "BarChart", title: "Rekap & Laporan", desc: "Laporan kehadiran, nilai, dan perkembangan santri tersedia kapan saja." },
          { iconName: "Shield", title: "Data Aman", desc: "Sistem login berlapis dan hak akses per-peran menjaga keamanan data pesantren." },
          { iconName: "Printer", title: "Cetak Rapor & SKL", desc: "Hasilkan rapor dan Surat Keterangan Lulus langsung dari sistem, tanpa ketik ulang." },
          { iconName: "Building", title: "6 Jenjang Pendidikan", desc: "Satu sistem, bisa mengelola MTs, MA, dan jenjang lain dalam lingkup pesantren." }
        ],
        profileData: {
          namaPesantren: "Pesantren Al-Ittihaad",
          desc: "Membentuk generasi qur'ani yang berakhlak mulia dan berwawasan global.",
          tahunBerdiri: "2010",
          imageUrl: "/images/hero.jpg" // placeholder
        },
        contactData: {
          alamat: "Jl. Pendidikan No. 1, Desa Suka Maju, Kec. Harapan",
          telepon: "08123456789",
          email: "info@alittihaad.sch.id",
          mapsUrl: "",
          instagram: "",
          facebook: ""
        },
        footerData: {
          tagline: "Membangun peradaban Islam melalui teknologi.",
          copyright: `© ${new Date().getFullYear()} SAPA (Sistem Akademik Pesantren Terpadu).`
        },
        updatedAt: new Date()
      } as any
    }

    return NextResponse.json({ success: true, data: content })
  } catch (error: any) {
    console.error("GET Landing Page Content Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const body = await request.json()
    const { heroData, statsData, featuresData, profileData, contactData, footerData } = body

    const updated = await prisma.landingPageContent.upsert({
      where: { id: 1 },
      update: {
        heroData: heroData || {},
        statsData: statsData || [],
        featuresData: featuresData || [],
        profileData: profileData || {},
        contactData: contactData || {},
        footerData: footerData || {},
      },
      create: {
        id: 1,
        heroData: heroData || {},
        statsData: statsData || [],
        featuresData: featuresData || [],
        profileData: profileData || {},
        contactData: contactData || {},
        footerData: footerData || {},
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error("POST Landing Page Content Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
