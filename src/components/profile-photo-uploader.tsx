"use client"

import { useState, useRef, useTransition } from "react"
import { Camera, Loader2, Trash2, Upload, User, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProfilePhotoUploaderProps {
  currentPhotoUrl: string | null
  userName: string
  onUpload: (formData: FormData) => Promise<{ success: boolean; url?: string; error?: string }>
  onDelete?: () => Promise<{ success: boolean; error?: string }>
  size?: "sm" | "md" | "lg"
  className?: string
  showEditHint?: boolean
}

export function ProfilePhotoUploader({
  currentPhotoUrl,
  userName,
  onUpload,
  onDelete,
  size = "md",
  className = "",
  showEditHint = true,
}: ProfilePhotoUploaderProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl)
  const [isHovered, setIsHovered] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: "w-14 h-14 rounded-xl",
    md: "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl",
    lg: "w-28 h-28 sm:w-32 sm:h-32 rounded-2xl",
  }[size]

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[size]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Quick client validation
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if (!validMimes.includes(file.type)) {
      alert("Format berkas harus berupa gambar JPG, PNG, atau WebP.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran berkas maksimal 5MB.")
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    startTransition(async () => {
      try {
        const res = await onUpload(formData)
        if (res.success && res.url) {
          setPhotoUrl(res.url)
          setSuccessMessage("Foto berhasil diperbarui!")
          setTimeout(() => setSuccessMessage(null), 3000)
          // Refresh page to sync sidebar & header
          window.location.reload()
        } else {
          alert(res.error || "Gagal mengunggah foto.")
        }
      } catch (err: any) {
        alert(err.message || "Terjadi kesalahan saat mengunggah foto.")
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ""
      }
    })
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDelete) return
    if (!confirm("Hapus foto profil ini dan kembali ke avatar default?")) return

    startTransition(async () => {
      try {
        const res = await onDelete()
        if (res.success) {
          setPhotoUrl(null)
          window.location.reload()
        } else {
          alert(res.error || "Gagal menghapus foto.")
        }
      } catch (err: any) {
        alert(err.message || "Terjadi kesalahan saat menghapus foto.")
      }
    })
  }

  const defaultAvatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(userName)}`

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={isPending}
      />

      {/* Main Avatar Container */}
      <div
        className={`relative ${sizeClasses} overflow-hidden border-2 border-primary/30 shadow-md bg-muted group cursor-pointer select-none transition-all hover:border-primary hover:shadow-lg`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => !isPending && fileInputRef.current?.click()}
        title="Klik untuk mengganti foto profil"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl || defaultAvatar}
          alt={userName}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />

        {/* Hover / Loading Overlay */}
        <div
          className={`absolute inset-0 bg-black/55 text-white flex flex-col items-center justify-center transition-opacity duration-200 ${
            isPending || isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          {isPending ? (
            <div className="flex flex-col items-center gap-1">
              <Loader2 className={`${iconSizes} animate-spin text-white`} />
              <span className="text-[10px] font-medium text-white/90">Memproses...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-center p-1">
              <Camera className={iconSizes} />
              <span className="text-[10px] font-semibold leading-tight">Ubah Foto</span>
            </div>
          )}
        </div>
      </div>

      {/* Camera Action Badge */}
      <button
        type="button"
        onClick={() => !isPending && fileInputRef.current?.click()}
        disabled={isPending}
        className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-transform active:scale-95 border-2 border-background"
        title="Pilih Foto Baru"
      >
        <Camera className="w-3.5 h-3.5" />
      </button>

      {/* Delete Button (if photo exists and onDelete provided) */}
      {photoUrl && onDelete && !isPending && (
        <button
          type="button"
          onClick={handleDelete}
          className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-transform active:scale-95 border-2 border-background"
          title="Hapus Foto Profil"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}

      {/* Temporary Success Toast */}
      {successMessage && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-medium rounded-md shadow-lg whitespace-nowrap flex items-center gap-1 z-30 animate-in fade-in slide-in-from-top-1">
          <Check className="w-3 h-3" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  )
}
