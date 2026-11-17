import { notFound, redirect } from "next/navigation"
import { getLoggedInKesiswaan } from "@/lib/auth"
import prisma from "@/lib/prisma"
import PrintButton from "@/app/admin/alumni/[id]/cetak-skl/print-button"

export const dynamic = "force-dynamic"

export default async function KesiswaanCetakSKLPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const kesiswaan = await getLoggedInKesiswaan()

  const { id } = await params
  const santriId = parseInt(id)
  if (isNaN(santriId)) notFound()

  const santri = await prisma.santri.findUnique({
    where: { id: santriId },
    include: {
      jenjangs: {
        where: { jenjangId: kesiswaan.jenjangId },
        include: { jenjang: true, tahunLulus: true },
      },
    },
  })

  if (!santri || santri.jenjangs.length === 0) {
    notFound()
  }

  const alumniData = santri.jenjangs[0]
  if (!alumniData.isAlumni) {
    return <div className="p-6 text-center text-red-500">Santri ini bukan alumni.</div>
  }

  const jenjang = alumniData.jenjang

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

<p>Telah dinyatakan <strong>LULUS</strong> dari satuan pendidikan {{JENJANG}} pada Tahun Ajaran {{TAHUN_LULUS}}.</p>

<p>Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

<div style="margin-top: 50px; float: right; text-align: center; width: 250px;">
  <p style="margin: 0;">Ditetapkan di: ..................</p>
  <p style="margin: 0 0 70px 0;">Pada tanggal: ..................</p>
  <p style="margin: 0; font-weight: bold; text-decoration: underline;">{{KEPALA_MADRASAH}}</p>
  <p style="margin: 0;">NIP. {{NIP_KEPALA}}</p>
</div>
`

  const template = jenjang.templateSKL || defaultTemplate

  const ttl = `${santri.tempatLahir || "-"}, ${
    santri.tanggalLahir
      ? new Date(santri.tanggalLahir).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-"
  }`

  const renderedContent = template
    .replace(/{{JENJANG}}/g, jenjang.nama)
    .replace(/{{TAHUN_LULUS}}/g, alumniData.tahunLulus?.nama || "-")
    .replace(/{{NAMA}}/g, santri.namaLengkap)
    .replace(/{{TTL}}/g, ttl)
    .replace(/{{NISN}}/g, santri.nisn)
    .replace(/{{KEPALA_MADRASAH}}/g, jenjang.namaKepalaMadrasah || "Kepala Madrasah")
    .replace(/{{NIP_KEPALA}}/g, jenjang.nipKepalaMadrasah || "-")

  return (
    <div className="min-h-screen bg-slate-50 py-8 print:py-0 print:bg-white">
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden px-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Pratinjau Surat Keterangan Lulus</h1>
          <p className="text-sm text-slate-500">Santri: {santri.namaLengkap} ({santri.nisn})</p>
        </div>
        <PrintButton />
      </div>

      <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-sm p-12 print:border-none print:shadow-none print:p-0">
        {jenjang.kopSuratUrl && (
          <div className="mb-6 border-b-2 border-slate-900 pb-4 text-center">
            <img
              src={jenjang.kopSuratUrl}
              alt="Kop Surat"
              className="max-h-28 mx-auto object-contain"
            />
          </div>
        )}

        <div
          className="prose max-w-none text-slate-900 leading-relaxed font-serif"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
      </div>
    </div>
  )
}
