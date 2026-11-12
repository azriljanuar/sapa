import prisma from "./prisma"

export type IdentitasLembagaData = {
  id: number
  namaLembaga: string
  singkatan: string
  tingkatJenjang: string
  sebutanSantri: string
  sebutanGuru: string
  nsm: string | null
  npsn: string | null
  akreditasi: string | null
  alamat: string | null
  kelurahan: string | null
  kecamatan: string | null
  kabupatenKota: string | null
  provinsi: string | null
  kodePos: string | null
  telepon: string | null
  email: string | null
  website: string | null
  logoUrl: string | null
  iconUrl: string | null
  kopSuratUrl: string | null
  stempelUrl: string | null
  ttdKepalaUrl: string | null
  namaKepalaMadrasah: string | null
  nipKepalaMadrasah: string | null
  templateSKL: string | null
  waktuMulaiAbsen: string | null
  waktuAkhirAbsen: string | null
}

/**
 * Mengambil data identitas lembaga/sekolah tunggal yang dinamis.
 * Jika belum ada, otomatis membuat data default berbasis MA Al-Ittihaad.
 */
export async function getIdentitasLembaga(): Promise<IdentitasLembagaData> {
  const existing = await prisma.identitasLembaga.findFirst()
  if (existing) return existing

  return await prisma.identitasLembaga.create({
    data: {
      id: 1,
      namaLembaga: "Madrasah Aliyah Plus Al-Ittihaad",
      singkatan: "MA",
      tingkatJenjang: "MA",
      sebutanSantri: "Santri",
      sebutanGuru: "Guru",
      logoUrl: "/uploads/logo_2_1787041914994-77974567.png",
      waktuMulaiAbsen: "06:00",
      waktuAkhirAbsen: "08:00"
    }
  })
}
