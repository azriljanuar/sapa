import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Image from "next/image"
import { PrintButton } from "./print-button"

export default async function PrintRekapPage({
  searchParams,
}: {
  searchParams: { kelasId?: string; tanggal?: string }
}) {
  const admin = await getLoggedInAdminJenjang()
  if (!admin.jenjangId) redirect("/login")

  const kelasId = parseInt(searchParams.kelasId || "0")
  const tanggal = searchParams.tanggal || ""

  if (!kelasId || !tanggal) {
    return (
      <div className="p-10 text-center text-red-600 font-bold">
        Parameter kelasId dan tanggal diperlukan.
      </div>
    )
  }

  // Ambil data kelas beserta jenjang
  const kelas = await prisma.kelasFormal.findUnique({
    where: { id: kelasId },
    include: {
      jenjang: true,
      tahunAjaran: true,
    },
  })

  if (!kelas) {
    return <div className="p-10 text-center text-red-600 font-bold">Kelas tidak ditemukan.</div>
  }

  // Pastikan kelas milik jenjang yang dikelola admin ini
  if (kelas.jenjangId !== admin.jenjangId) {
    return <div className="p-10 text-center text-red-600 font-bold">Akses tidak diizinkan.</div>
  }

  // Ambil data santri & kehadiran
  const tanggalDate = new Date(tanggal)
  const riwayatList = await prisma.riwayatKelas.findMany({
    where: { kelasFormalId: kelasId },
    include: {
      santri: {
        include: {
          kehadiranHarian: {
            where: { tanggal: tanggalDate },
          },
        },
      },
    },
    orderBy: { santri: { namaLengkap: "asc" } },
  })

  // Summary
  const summary = { hadir: 0, sakit: 0, izin: 0, alpa: 0, belumAbsen: 0 }
  const santriData = riwayatList.map((r, idx) => {
    const kehadiran = r.santri.kehadiranHarian[0]
    const status = kehadiran?.status || null
    const keterangan = kehadiran?.keterangan || null
    if (status === "HADIR") summary.hadir++
    else if (status === "SAKIT") summary.sakit++
    else if (status === "IZIN") summary.izin++
    else if (status === "ALPA") summary.alpa++
    else summary.belumAbsen++
    return { no: idx + 1, nama: r.santri.namaLengkap, nisn: r.santri.nisn, status, keterangan }
  })

  const jenjang = kelas.jenjang
  const kopSuratUrl = (jenjang as any).kopSuratUrl as string | null
  const namaKepala = jenjang.namaKepalaMadrasah || ""
  const nipKepala = jenjang.nipKepalaMadrasah || ""

  // Format tanggal Indonesia
  const tglObj = new Date(tanggal)
  const namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][tglObj.getDay()]
  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][tglObj.getMonth()]
  const tglFormatted = `${namaHari}, ${tglObj.getDate()} ${namaBulan} ${tglObj.getFullYear()}`

  const statusLabel: Record<string, string> = {
    HADIR: "Hadir",
    SAKIT: "Sakit",
    IZIN: "Izin",
    ALPA: "Alpa",
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          * { font-family: sans-serif; box-sizing: border-box; }
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            @page { size: A4 portrait; margin: 1.5cm; }
          }
        `
      }} />

      {/* Tombol Print (hanya tampil di layar) */}
      <div className="no-print fixed bottom-8 right-8 z-50">
        <PrintButton />
      </div>

      {/* Wrapper halaman print */}
      <div className="max-w-[210mm] mx-auto bg-white p-8 min-h-[297mm] shadow-xl print:shadow-none print:p-0">

        {/* Kop Surat */}
        {kopSuratUrl ? (
          <div className="w-full mb-4 border-b-4 border-black pb-3">
            <div className="relative w-full h-28">
              <Image
                src={kopSuratUrl}
                alt="Kop Surat"
                fill
                className="object-contain object-center"
              />
            </div>
          </div>
        ) : (
          <div className="w-full text-center border-b-4 border-black pb-3 mb-4">
            <h1 className="text-xl font-black uppercase tracking-wide">{jenjang.nama}</h1>
            {jenjang.alamat && (
              <p className="text-sm text-slate-600">{jenjang.alamat}</p>
            )}
            {jenjang.telepon && (
              <p className="text-sm text-slate-600">Telp: {jenjang.telepon}</p>
            )}
          </div>
        )}

        {/* Judul Dokumen */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold uppercase tracking-widest">Rekapitulasi Kehadiran Santri</h2>
        </div>

        {/* Info Dokumen */}
        <div className="mb-5 text-sm space-y-1">
          <div className="flex">
            <span className="w-36 font-semibold">Kelas</span>
            <span className="mr-2">:</span>
            <span>{kelas.namaKelas}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-semibold">Tanggal</span>
            <span className="mr-2">:</span>
            <span>{tglFormatted}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-semibold">Tahun Ajaran</span>
            <span className="mr-2">:</span>
            <span>{kelas.tahunAjaran.nama}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-semibold">Jenjang</span>
            <span className="mr-2">:</span>
            <span>{jenjang.nama}</span>
          </div>
        </div>

        {/* Tabel Santri */}
        <table className="w-full border-collapse border border-black text-sm mb-6">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-black px-2 py-2 w-10 text-center">No</th>
              <th className="border border-black px-3 py-2 text-left">Nama Santri</th>
              <th className="border border-black px-3 py-2 w-28 text-center">NISN</th>
              <th className="border border-black px-3 py-2 w-24 text-center">Status</th>
              <th className="border border-black px-3 py-2 text-left">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {santriData.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-black px-3 py-4 text-center text-slate-400">
                  Tidak ada data santri.
                </td>
              </tr>
            ) : (
              santriData.map((s) => (
                <tr key={s.no}>
                  <td className="border border-black px-2 py-1.5 text-center h-9">{s.no}</td>
                  <td className="border border-black px-3 py-1.5 uppercase">{s.nama}</td>
                  <td className="border border-black px-3 py-1.5 text-center">{s.nisn || "-"}</td>
                  <td className="border border-black px-3 py-1.5 text-center font-semibold">
                    {s.status ? statusLabel[s.status] ?? s.status : <span className="text-slate-400 font-normal">-</span>}
                  </td>
                  <td className="border border-black px-3 py-1.5 italic text-slate-600">{s.keterangan || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Rekap Summary */}
        <div className="mb-8 text-sm">
          <p className="font-semibold mb-1">Ringkasan Kehadiran:</p>
          <div className="flex gap-6">
            <span>Hadir: <strong>{summary.hadir}</strong></span>
            <span>Sakit: <strong>{summary.sakit}</strong></span>
            <span>Izin: <strong>{summary.izin}</strong></span>
            <span>Alpa: <strong>{summary.alpa}</strong></span>
            {summary.belumAbsen > 0 && (
              <span>Belum Absen: <strong>{summary.belumAbsen}</strong></span>
            )}
            <span className="ml-auto">Total: <strong>{santriData.length}</strong> santri</span>
          </div>
        </div>

        {/* Kolom Tanda Tangan */}
        <div className="flex justify-between text-sm mt-12">
          <div className="text-center w-56">
            <p className="mb-16">Mengetahui,</p>
            <p className="font-bold underline mb-1">{namaKepala || "________________________"}</p>
            <p>Kepala {jenjang.singkatan}</p>
            {nipKepala && <p className="text-xs text-slate-500 mt-0.5">NIP/NIY: {nipKepala}</p>}
          </div>
          <div className="text-center w-56">
            <p className="mb-1">{tglFormatted}</p>
            <p className="mb-16">Wali Kelas,</p>
            <p className="font-bold underline mb-1">________________________</p>
            <p>NIP/NIY:</p>
          </div>
        </div>
      </div>
    </>
  )
}
