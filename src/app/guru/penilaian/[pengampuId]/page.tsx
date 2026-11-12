import { getLoggedInGuru } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getSelectedSemester } from "@/lib/ta-context"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BarChart2 } from "lucide-react"
import PenilaianGuruClient from "./penilaian-guru-client"

export const dynamic = "force-dynamic"

export default async function GuruPenilaianDetailPage({
  params,
}: {
  params: Promise<{ pengampuId: string }>
}) {
  const { pengampuId: pengampuIdStr } = await params
  const pengampuId = parseInt(pengampuIdStr)
  if (isNaN(pengampuId)) notFound()

  const guru = await getLoggedInGuru()
  const selectedSem = await getSelectedSemester()
  const semesterId = selectedSem?.id ?? null

  // Ambil data pengampu — hanya jika milik guru ini
  const pengampu = await prisma.pengampuMataPelajaran.findFirst({
    where: { id: pengampuId, guruId: guru.id },
    include: {
      mataPelajaran: true,
      kelasFormal: {
        include: {
          anggota: {
            include: {
              santri: { select: { id: true, namaLengkap: true, nisn: true } }
            },
            orderBy: { santri: { namaLengkap: "asc" } }
          }
        }
      },
      tahunAjaran: true,
      nilaiSumatif: {
        where: semesterId ? { semesterId } : {}
      },
      nilaiPAS: {
        where: semesterId ? { semesterId } : {}
      },
      jurnalMengajar: {
        include: {
          absensiMapel: { select: { santriId: true, status: true } }
        }
      }
    }
  })

  if (!pengampu) notFound()

  const semesterNama = selectedSem
    ? `${selectedSem.tahunAjaran.nama} — ${selectedSem.nama}`
    : null

  const santriList = pengampu.kelasFormal.anggota.map((a) => a.santri)

  return (
    <div className="space-y-5 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/guru/penilaian"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Penilaian
        </Link>
        <span className="text-muted-foreground text-xs">/</span>
        <span className="text-xs font-semibold text-foreground truncate">
          {pengampu.mataPelajaran.nama} — {pengampu.kelasFormal.namaKelas}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            {pengampu.mataPelajaran.nama}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kelas <span className="font-semibold text-foreground">{pengampu.kelasFormal.namaKelas}</span>
            {semesterNama && (
              <> · Semester <span className="font-semibold text-foreground">{semesterNama}</span></>
            )}
            {" "}· KKM <span className="font-semibold text-primary">{pengampu.kkm ?? 70}</span>
          </p>
        </div>
      </div>

      {/* Client Component dengan semua data */}
      <PenilaianGuruClient
        pengampu={pengampu as any}
        santriList={santriList}
        semesterId={semesterId}
        semesterNama={semesterNama}
      />
    </div>
  )
}
