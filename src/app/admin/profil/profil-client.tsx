"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Save, Building, GraduationCap, School, Sparkles, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { updateProfilJenjang } from "./actions"
import { AsetDokumen } from "./aset-dokumen"

const profilSchema = z.object({
  namaLembaga: z.string().min(2, "Nama lembaga wajib diisi"),
  singkatan: z.string().min(1, "Singkatan wajib diisi"),
  tingkatJenjang: z.string(),
  sebutanSantri: z.string(),
  sebutanGuru: z.string(),
  npsn: z.string().optional().nullable(),
  nsm: z.string().optional().nullable(),
  akreditasi: z.string().optional().nullable(),
  namaKepalaMadrasah: z.string().optional().nullable(),
  nipKepalaMadrasah: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
  telepon: z.string().optional().nullable(),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")).nullable(),
  website: z.string().optional().nullable(),
  templateSKL: z.string().optional().nullable(),
  waktuMulaiAbsen: z.string().optional().nullable(),
  waktuAkhirAbsen: z.string().optional().nullable(),
})

type ProfilType = z.infer<typeof profilSchema>

export function ProfilJenjangClient({ initialData }: { initialData: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProfilType>({
    resolver: zodResolver(profilSchema),
    defaultValues: {
      namaLembaga: initialData?.namaLembaga || initialData?.nama || "Madrasah Aliyah Plus Al-Ittihaad",
      singkatan: initialData?.singkatan || "MA",
      tingkatJenjang: initialData?.tingkatJenjang || "MA",
      sebutanSantri: initialData?.sebutanSantri || "Santri",
      sebutanGuru: initialData?.sebutanGuru || "Guru",
      npsn: initialData?.npsn || "",
      nsm: initialData?.nsm || "",
      akreditasi: initialData?.akreditasi || "A",
      namaKepalaMadrasah: initialData?.namaKepalaMadrasah || "",
      nipKepalaMadrasah: initialData?.nipKepalaMadrasah || "",
      alamat: initialData?.alamat || "",
      telepon: initialData?.telepon || "",
      email: initialData?.email || "",
      website: initialData?.website || "",
      templateSKL: initialData?.templateSKL || "",
      waktuMulaiAbsen: initialData?.waktuMulaiAbsen || "06:00",
      waktuAkhirAbsen: initialData?.waktuAkhirAbsen || "08:00",
    },
  })

  const onSubmit = async (values: ProfilType) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("namaLembaga", values.namaLembaga)
      formData.append("singkatan", values.singkatan)
      formData.append("tingkatJenjang", values.tingkatJenjang)
      formData.append("sebutanSantri", values.sebutanSantri)
      formData.append("sebutanGuru", values.sebutanGuru)
      if (values.npsn) formData.append("npsn", values.npsn)
      if (values.nsm) formData.append("nsm", values.nsm)
      if (values.akreditasi) formData.append("akreditasi", values.akreditasi)
      if (values.namaKepalaMadrasah) formData.append("namaKepalaMadrasah", values.namaKepalaMadrasah)
      if (values.nipKepalaMadrasah) formData.append("nipKepalaMadrasah", values.nipKepalaMadrasah)
      if (values.alamat) formData.append("alamat", values.alamat)
      if (values.telepon) formData.append("telepon", values.telepon)
      if (values.email) formData.append("email", values.email)
      if (values.website) formData.append("website", values.website)
      if (values.waktuMulaiAbsen) formData.append("waktuMulaiAbsen", values.waktuMulaiAbsen)
      if (values.waktuAkhirAbsen) formData.append("waktuAkhirAbsen", values.waktuAkhirAbsen)
      if (values.templateSKL) formData.append("templateSKL", values.templateSKL)
      
      const res = await updateProfilJenjang(formData)
      if (res.success) {
        alert("Profil identitas lembaga berhasil disimpan!")
        window.location.reload()
      } else {
        alert(res.error || "Gagal menyimpan")
      }
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan saat menyimpan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
          <Building className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Profil & Identitas Lembaga
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Konfigurasi identitas sekolah/jenjang, kop surat, logo, dan preferensi sebutan sistem (White-Label Dinamis).
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-xs border border-border p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Bagian 1: Identitas Utama */}
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
                <School className="h-4 w-4 text-primary" />
                Identitas Utama & Kustomisasi Jenjang
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Ubah nama lembaga dan sebutan sewaktu-waktu jika sistem ini digunakan untuk jenjang atau sekolah lain.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="namaLembaga"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Nama Lengkap Lembaga / Sekolah</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Madrasah Aliyah Plus Al-Ittihaad" {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Nama ini akan tampil di seluruh header, laporan cetak, rapor, dan kartu santri.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="singkatan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Singkatan / Sebutan Pendek</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: MA / SMA / MTs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tingkatJenjang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tingkat Jenjang</FormLabel>
                      <FormControl>
                        <Input placeholder="MA, MTs, SMA, SMK, SMP, dll." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sebutanSantri"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sebutan Peserta Didik</FormLabel>
                      <FormControl>
                        <Input placeholder="Santri atau Siswa" {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Pilihan tampilan di menu: Santri atau Siswa
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sebutanGuru"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sebutan Pendidik</FormLabel>
                      <FormControl>
                        <Input placeholder="Guru atau Ustadz" {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px]">
                        Pilihan tampilan di menu: Guru atau Ustadz
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Bagian 2: Legalitas & Kepala Sekolah */}
            <div className="border-t border-border/70 pt-5">
              <h3 className="text-base font-semibold text-foreground mb-4">
                Legalitas & Pimpinan Lembaga
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="npsn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NPSN</FormLabel>
                      <FormControl>
                        <Input placeholder="Nomor Pokok Sekolah Nasional" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nsm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NSM / NSS</FormLabel>
                      <FormControl>
                        <Input placeholder="Nomor Statistik Madrasah" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="akreditasi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Akreditasi</FormLabel>
                      <FormControl>
                        <Input placeholder="A, B, dll." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="namaKepalaMadrasah"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nama Kepala Sekolah / Madrasah</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama lengkap beserta gelar" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nipKepalaMadrasah"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIP / NIY Kepala</FormLabel>
                      <FormControl>
                        <Input placeholder="Nomor Induk Pegawai" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Bagian 3: Alamat & Kontak */}
            <div className="border-t border-border/70 pt-5">
              <h3 className="text-base font-semibold text-foreground mb-4">
                Alamat & Kontak Resmi
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="alamat"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Alamat Lengkap</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kabupaten/Kota..." 
                          className="min-h-[80px]"
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telepon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Telepon</FormLabel>
                      <FormControl>
                        <Input placeholder="08xxx / (0xx) xxx" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Resmi</FormLabel>
                      <FormControl>
                        <Input placeholder="info@sekolah.sch.id" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Website Resmi</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Bagian 4: Pengaturan Jam Absensi RFID / Harian */}
            <div className="border-t border-border/70 pt-5">
              <h3 className="text-base font-semibold text-foreground mb-2">
                Rentang Jam Absensi Harian (RFID & Manual)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Rentang jam aktif tap masuk harian (contoh: 06:00 s/d 08:00).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="waktuMulaiAbsen"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Waktu Mulai Absen Masuk</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="waktuAkhirAbsen"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batas Akhir Absen Masuk</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Bagian 5: Template SKL */}
            <div className="border-t border-border/70 pt-5">
              <h3 className="text-base font-semibold text-foreground mb-2">
                Template Surat Keterangan Lulus (SKL)
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Teks template yang digunakan saat mencetak SKL pada modul alumni.
              </p>
              <FormField
                control={form.control}
                name="templateSKL"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Format teks SKL resmi..." 
                        className="min-h-[140px] font-mono text-xs"
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bagian 6: Aset Dokumen (Logo & Kop Surat) */}
            <AsetDokumen 
              initialLogoUrl={initialData?.logoUrl || null} 
              initialKopSuratUrl={initialData?.kopSuratUrl || null} 
            />

            {/* Tombol Simpan */}
            <div className="flex justify-end pt-4 border-t border-border">
              <Button type="submit" disabled={isSubmitting} className="min-w-[160px] gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan Identitas
                  </>
                )}
              </Button>
            </div>

          </form>
        </Form>
      </div>
    </div>
  )
}
