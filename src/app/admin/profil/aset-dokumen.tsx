"use client"

import { useState } from "react"
import { Upload, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface AsetDokumenProps {
  initialLogoUrl: string | null
  initialKopSuratUrl: string | null
}

export function AsetDokumen({ initialLogoUrl, initialKopSuratUrl }: AsetDokumenProps) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  const [kopSuratUrl, setKopSuratUrl] = useState(initialKopSuratUrl)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingKop, setIsUploadingKop] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logoSekolah" | "kopSurat") => {
    const file = e.target.files?.[0]
    if (!file) return

    if (type === "logoSekolah") setIsUploadingLogo(true)
    else setIsUploadingKop(true)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)

    try {
      const res = await fetch("/api/admin/upload-asset", {
        method: "POST",
        body: formData,
      })
      
      const data = await res.json()
      if (data.success) {
        if (type === "logoSekolah") setLogoUrl(data.url)
        else setKopSuratUrl(data.url)
        alert("Upload berhasil")
      } else {
        alert(data.error || "Upload gagal")
      }
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan saat upload")
    } finally {
      if (type === "logoSekolah") setIsUploadingLogo(false)
      else setIsUploadingKop(false)
    }
  }

  return (
    <div className="col-span-1 md:col-span-2 border-t border-border pt-4 mt-2">
      <h3 className="text-lg font-medium mb-2 text-foreground">Aset Dokumen</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Aset ini digunakan untuk halaman cover dan dokumen tertulis (Buku Penilaian, Jurnal Mengajar, Daftar Hadir).
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {/* Upload Logo */}
        <div className="border border-border rounded-lg p-6 flex flex-col items-center text-center space-y-4">
          <h4 className="font-medium text-foreground">Logo Sekolah (Bulat)</h4>
          <p className="text-xs text-muted-foreground">Rekomendasi format PNG transparan</p>
          
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/50 relative group">
            {logoUrl ? (
              <Image src={logoUrl} alt="Logo Sekolah" fill className="object-contain p-2" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
            
            <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Upload className="w-6 h-6 mb-2" />
              <span className="text-xs font-medium">Ubah Logo</span>
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                className="hidden" 
                onChange={(e) => handleUpload(e, "logoSekolah")}
                disabled={isUploadingLogo}
              />
            </label>
          </div>
          {isUploadingLogo && <p className="text-sm text-primary animate-pulse">Mengunggah...</p>}
        </div>

        {/* Upload Kop Surat */}
        <div className="border border-border rounded-lg p-6 flex flex-col items-center text-center space-y-4">
          <h4 className="font-medium text-foreground">Kop Surat (Landscape)</h4>
          <p className="text-xs text-muted-foreground">Gambar PNG/JPG dengan proporsi memanjang</p>
          
          <div className="w-full h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/50 relative group">
            {kopSuratUrl ? (
              <Image src={kopSuratUrl} alt="Kop Surat" fill className="object-contain" />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-sm">Belum ada kop surat</span>
              </div>
            )}
            
            <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Upload className="w-6 h-6 mb-2" />
              <span className="text-xs font-medium">Ubah Kop Surat</span>
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                className="hidden" 
                onChange={(e) => handleUpload(e, "kopSurat")}
                disabled={isUploadingKop}
              />
            </label>
          </div>
          {isUploadingKop && <p className="text-sm text-primary animate-pulse">Mengunggah...</p>}
        </div>
      </div>
    </div>
  )
}
