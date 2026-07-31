import { getLoggedInAdminJenjang } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"

import PrintButton from "./print-button"

export default async function CetakSKLPage({ params }: { params: { id: string } }) {
  const admin = await getLoggedInAdminJenjang()
  if (!admin.jenjangId) redirect("/login")

  const santriId = parseInt(params.id)
  if (isNaN(santriId)) notFound()

  const santri = await prisma.santri.findUnique({
    where: { id: santriId },
    include: {
      jenjangs: {
        where: { jenjangId: admin.jenjangId },
        include: { jenjang: true, tahunLulus: true }
      }
    }
  })

  if (!santri || santri.jenjangs.length === 0) {
    notFound()
  }

  const alumniData = santri.jenjangs[0]
  if (!alumniData.isAlumni) {
    return <div className="p-6 text-center text-red-500">Santri ini bukan alumni.</div>
  }

  const jenjang = alumniData.jenjang

  // Default Template jika belum diset
  const defaultTemplate = `
<div style="text-align: center; margin-bottom: 30px;">
  <h2 style="margin: 0; font-size: 24px;">SURAT KETERANGAN LULUS</h2>
  <p style="margin: 5px 0 0 0; font-size: 16px;">Nomor: ... / SKL / {{JENJANG}} / {{TAHUN_LULUS}}</p>
</div>

<p>Kepala {{JENJANG}} menerangkan dengan sesungguhnya bahwa:</p>

<table style="width: 100%; margin: 20px 0;">
  <tr>
    <td style="width: 200px; padding: 5px 0;">Nama Lengkap</td>
    <td style="width: 20px;">:</td>
    <td><strong>{{NAMA}}</strong></td>
  </tr>
  <tr>
    <td style="padding: 5px 0;">Tempat, Tanggal Lahir</td>
    <td>:</td>
    <td>{{TTL}}</td>
  </tr>
  <tr>
    <td style="padding: 5px 0;">Nomor Induk Siswa Nasional</td>
    <td>:</td>
    <td>{{NISN}}</td>
  </tr>
</table>

<p>Telah dinyatakan <strong>LULUS</strong> dari satuan pendidikan {{JENJANG}} pada tahun ajaran {{TAHUN_AJARAN}} berdasarkan kriteria kelulusan yang telah ditetapkan.</p>

<p>Surat keterangan ini diberikan agar dapat dipergunakan sebagaimana mestinya, sambil menunggu diterbitkannya ijazah asli.</p>

<div style="margin-top: 50px; text-align: right;">
  <p style="margin-bottom: 70px;">Pimpinan {{JENJANG}},</p>
  <p><strong>{{KEPALA_MADRASAH}}</strong><br/>NIP. {{NIP_KEPALA}}</p>
</div>
  `

  let templateStr = jenjang.templateSKL || defaultTemplate

  // Formatter for date
  const dateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const ttlDate = santri.tanggalLahir ? dateFormatter.format(santri.tanggalLahir) : "-"
  
  // Replace variables
  const ttl = `${santri.tempatLahir || "-"}, ${ttlDate}`
  
  const tahunLulusStr = alumniData.tahunLulus?.nama.replace(/\//g, "-") || new Date().getFullYear().toString()
  const tahunAjaranStr = alumniData.tahunLulus?.nama || new Date().getFullYear().toString()

  const contentHtml = templateStr
    .replace(/{{NAMA}}/g, santri.namaLengkap)
    .replace(/{{TTL}}/g, ttl)
    .replace(/{{NISN}}/g, santri.nisn)
    .replace(/{{JENJANG}}/g, jenjang.nama)
    .replace(/{{TAHUN_LULUS}}/g, tahunLulusStr)
    .replace(/{{TAHUN_AJARAN}}/g, tahunAjaranStr)
    .replace(/{{KEPALA_MADRASAH}}/g, jenjang.namaKepalaMadrasah || "____________________")
    .replace(/{{NIP_KEPALA}}/g, jenjang.nipKepalaMadrasah || "-")

  return (
    <div className="bg-white min-h-screen text-black print:p-0 p-8">
      {/* Hide the sidebar when printing via CSS in globals.css */}
      <div className="max-w-3xl mx-auto border print:border-none p-10 bg-white print:shadow-none shadow-sm">
        {/* Kop Surat Header */}
        <div className="flex items-center gap-6 border-b-4 border-black pb-4 mb-8">
          {jenjang.logoUrl ? (
            <img src={jenjang.logoUrl} alt="Logo" className="w-24 h-24 object-contain" />
          ) : (
            <div className="w-24 h-24 bg-slate-200 flex items-center justify-center rounded text-xs text-center text-slate-500">Logo<br/>Pesantren</div>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold uppercase tracking-wider">{jenjang.nama}</h1>
            <p className="text-sm mt-1">{jenjang.alamat || "Alamat belum diatur"}</p>
            <p className="text-sm">Telp: {jenjang.telepon || "-"} | Email: {jenjang.email || "-"}</p>
          </div>
        </div>

        {/* Konten SKL Dinamis */}
        <div 
          className="prose prose-slate max-w-none text-justify print:text-black"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        <div className="mt-10 print:hidden text-center border-t pt-6">
          <p className="text-sm text-slate-500 mb-4">Gunakan pintasan <kbd className="bg-slate-100 px-2 py-1 rounded">Ctrl + P</kbd> untuk mencetak surat ini.</p>
          <PrintButton />
        </div>
      </div>
    </div>
  )
}
