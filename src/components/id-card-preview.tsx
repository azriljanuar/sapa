"use client"

import { useState, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import { toPng } from "html-to-image"
import jsPDF from "jspdf"
import { TipeKartu } from "@prisma/client"
import { Download, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface IdCardPreviewProps {
  user: any
  tipe: TipeKartu
  template: { frontUrl: string | null; backUrl: string | null } | null
}

export function IdCardPreview({ user, tipe, template }: IdCardPreviewProps) {
  const [showModal, setShowModal] = useState(false)
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)

  const downloadPDF = async () => {
    if (!frontRef.current || !backRef.current) return
    
    try {
      const frontDataUrl = await toPng(frontRef.current, { cacheBust: true, quality: 1, pixelRatio: 2 })
      const backDataUrl = await toPng(backRef.current, { cacheBust: true, quality: 1, pixelRatio: 2 })

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [54, 85.6]
      })

      pdf.addImage(frontDataUrl, 'PNG', 0, 0, 54, 85.6)
      pdf.addPage()
      pdf.addImage(backDataUrl, 'PNG', 0, 0, 54, 85.6)

      const fileName = `ID_Card_${tipe}_${user.nama || user.namaLengkap}.pdf`
      pdf.save(fileName)
    } catch (err) {
      console.error(err)
      alert("Gagal mengunduh kartu dalam format PDF")
    }
  }

  const renderCardPreviewFront = () => (
    <div 
      ref={frontRef}
      className="relative w-[340px] h-[540px] bg-white rounded-xl shadow overflow-hidden flex-shrink-0"
    >
      {template?.frontUrl && (
        <img src={template.frontUrl} className="absolute inset-0 w-full h-full object-cover" alt="bg" />
      )}
      
      <div className="absolute inset-0 flex flex-col items-center pt-[180px]">
        <div className="w-[120px] h-[150px] bg-slate-200 rounded-lg overflow-hidden border-2 border-white shadow-sm">
          {user.fotoWajah ? (
            <img src={user.fotoWajah} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs text-center p-2">
              Belum ada foto profil
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center px-4 w-full">
          <h2 className="text-xl font-bold text-slate-800 uppercase leading-tight line-clamp-2">
            {user.nama || user.namaLengkap}
          </h2>
          <p className="text-sm font-semibold text-slate-600 mt-2">
            {tipe === "GURU" ? "NIP/NIK" : "NISN"}
          </p>
          <p className="text-sm text-slate-800 font-medium">
            {tipe === "GURU" ? (user.nip || user.nik || "-") : (user.nisn || "-")}
          </p>
        </div>
      </div>
    </div>
  )

  const renderCardPreviewBack = () => {
    const qrData = JSON.stringify({
      type: tipe,
      id: user.id,
      identity: tipe === "GURU" ? (user.nip || user.nik) : user.nisn,
      name: user.nama || user.namaLengkap
    })

    return (
      <div 
        ref={backRef}
        className="relative w-[340px] h-[540px] bg-white rounded-xl shadow overflow-hidden flex-shrink-0"
      >
        {template?.backUrl && (
          <img src={template.backUrl} className="absolute inset-0 w-full h-full object-cover" alt="bg" />
        )}
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <QRCodeSVG value={qrData} size={150} level="M" />
          </div>
          <p className="mt-4 text-xs font-mono text-slate-600 bg-white/80 px-2 py-1 rounded">
            ID: {user.id.toString().padStart(6, '0')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Button variant="outline" className="w-full mt-4" onClick={() => setShowModal(true)}>
        <Eye className="w-4 h-4 mr-2" />
        Preview & Cetak Kartu Identitas
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-slate-50 gap-0">
          <DialogHeader className="p-4 border-b bg-white">
            <DialogTitle>Preview Kartu Identitas</DialogTitle>
          </DialogHeader>
            
            <div className="p-8 overflow-y-auto flex-1 flex flex-col items-center">
              {!template ? (
                <div className="p-12 text-center text-slate-500">
                  Template kartu belum diatur oleh admin jenjang.
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500">Tampak Depan</span>
                    {renderCardPreviewFront()}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500">Tampak Belakang</span>
                    {renderCardPreviewBack()}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Tutup
              </Button>
              {template && (
                <Button onClick={downloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Unduh PDF
                </Button>
              )}
            </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
