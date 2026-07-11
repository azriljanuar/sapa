"use client"

import { useState, useRef, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { toPng } from "html-to-image"
import jsPDF from "jspdf"
import { TipeKartu } from "@prisma/client"
import { Download, Upload, Image as ImageIcon, Eye, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { uploadTemplateAction, getTemplateAction, getGuruListAction, getSantriListAction } from "./actions"

export function KartuIdentitasClient() {
  const [activeTab, setActiveTab] = useState<"GURU" | "SANTRI">("GURU")
  
  const [guruTemplate, setGuruTemplate] = useState<{frontUrl: string | null, backUrl: string | null}>({frontUrl: null, backUrl: null})
  const [santriTemplate, setSantriTemplate] = useState<{frontUrl: string | null, backUrl: string | null}>({frontUrl: null, backUrl: null})
  
  const [guruList, setGuruList] = useState<any[]>([])
  const [santriList, setSantriList] = useState<any[]>([])

  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)

  // State for preview modal
  const [previewUser, setPreviewUser] = useState<{user: any, tipe: TipeKartu} | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const tGuru = await getTemplateAction("GURU")
    const tSantri = await getTemplateAction("SANTRI")
    if (tGuru) setGuruTemplate({ frontUrl: tGuru.frontUrl, backUrl: tGuru.backUrl })
    if (tSantri) setSantriTemplate({ frontUrl: tSantri.frontUrl, backUrl: tSantri.backUrl })

    const gurus = await getGuruListAction()
    setGuruList(gurus)

    const santris = await getSantriListAction()
    setSantriList(santris)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipe: TipeKartu, side: "FRONT" | "BACK") => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    const formData = new FormData()
    formData.append("file", file)
    
    try {
      const res = await uploadTemplateAction(formData, tipe, side)
      if (res.success) {
        if (tipe === "GURU") {
          setGuruTemplate(prev => ({ ...prev, [side === "FRONT" ? "frontUrl" : "backUrl"]: res.url }))
        } else {
          setSantriTemplate(prev => ({ ...prev, [side === "FRONT" ? "frontUrl" : "backUrl"]: res.url }))
        }
        alert("Template berhasil diupload!")
      }
    } catch (err: any) {
      alert("Gagal upload template: " + err.message)
    }
  }

  const downloadPDF = async () => {
    if (!frontRef.current || !backRef.current || !previewUser) return
    
    try {
      // Create data URLs for both front and back
      const frontDataUrl = await toPng(frontRef.current, { cacheBust: true, quality: 1, pixelRatio: 2 })
      const backDataUrl = await toPng(backRef.current, { cacheBust: true, quality: 1, pixelRatio: 2 })

      // CR80 dimensions in mm: 54mm x 85.6mm (portrait)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [54, 85.6]
      })

      // Add front page
      pdf.addImage(frontDataUrl, 'PNG', 0, 0, 54, 85.6)
      
      // Add back page
      pdf.addPage()
      pdf.addImage(backDataUrl, 'PNG', 0, 0, 54, 85.6)

      const fileName = `ID_Card_${previewUser.tipe}_${previewUser.user.nama || previewUser.user.namaLengkap}.pdf`
      pdf.save(fileName)
    } catch (err) {
      console.error(err)
      alert("Gagal mengunduh kartu dalam format PDF")
    }
  }

  const renderTemplateUploader = (tipe: TipeKartu, currentTemplate: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Template Depan</CardTitle>
          <CardDescription className="text-xs">Upload gambar PNG polos untuk bagian depan kartu.</CardDescription>
        </CardHeader>
        <CardContent>
          {currentTemplate.frontUrl ? (
            <div className="mb-4 aspect-[2.12/3.37] w-48 relative border rounded-lg overflow-hidden bg-slate-100">
              <img src={currentTemplate.frontUrl} alt="Front Template" className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className="mb-4 aspect-[2.12/3.37] w-48 border-2 border-dashed flex items-center justify-center rounded-lg bg-slate-50 text-slate-400">
              <ImageIcon className="size-8" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              id={`upload-front-${tipe}`} 
              className="hidden" 
              accept="image/png, image/jpeg" 
              onChange={(e) => handleUpload(e, tipe, "FRONT")}
            />
            <Button variant="outline" size="sm" onClick={() => document.getElementById(`upload-front-${tipe}`)?.click()}>
              <Upload className="size-4 mr-2" /> Upload Depan
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Template Belakang</CardTitle>
          <CardDescription className="text-xs">Upload gambar PNG untuk latar belakang QR Code.</CardDescription>
        </CardHeader>
        <CardContent>
          {currentTemplate.backUrl ? (
            <div className="mb-4 aspect-[2.12/3.37] w-48 relative border rounded-lg overflow-hidden bg-slate-100">
              <img src={currentTemplate.backUrl} alt="Back Template" className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className="mb-4 aspect-[2.12/3.37] w-48 border-2 border-dashed flex items-center justify-center rounded-lg bg-slate-50 text-slate-400">
              <ImageIcon className="size-8" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              id={`upload-back-${tipe}`} 
              className="hidden" 
              accept="image/png, image/jpeg" 
              onChange={(e) => handleUpload(e, tipe, "BACK")}
            />
            <Button variant="outline" size="sm" onClick={() => document.getElementById(`upload-back-${tipe}`)?.click()}>
              <Upload className="size-4 mr-2" /> Upload Belakang
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderCardPreviewFront = (user: any, tipe: TipeKartu, template: any, innerRef?: any) => (
    <div 
      ref={innerRef}
      className="relative w-[340px] h-[540px] bg-white rounded-xl shadow overflow-hidden flex-shrink-0"
    >
      {template.frontUrl && (
        <img src={template.frontUrl} className="absolute inset-0 w-full h-full object-cover" alt="bg" />
      )}
      
      {/* Container Teks dan Foto */}
      <div className="absolute inset-0 flex flex-col items-center pt-[180px]">
        {/* Foto Wajah */}
        <div className="w-[120px] h-[150px] bg-slate-200 rounded-lg overflow-hidden border-2 border-white shadow-sm">
          {user.fotoWajah ? (
            <img src={user.fotoWajah} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Photo</div>
          )}
        </div>
        
        {/* Data Diri */}
        <div className="mt-8 text-center px-4 w-full">
          <h2 className="text-xl font-bold text-slate-800 uppercase leading-tight line-clamp-2">
            {user.nama || user.namaLengkap}
          </h2>
          <p className="text-sm font-semibold text-slate-600 mt-2">
            {tipe === "GURU" ? "NIP/NIK" : "NISN"}
          </p>
          <p className="text-sm text-slate-800 font-medium">
            {tipe === "GURU" ? (user.nip || "-") : (user.nisn || "-")}
          </p>
        </div>
      </div>
    </div>
  )

  const renderCardPreviewBack = (user: any, tipe: TipeKartu, template: any, innerRef?: any) => {
    const qrData = JSON.stringify({
      type: tipe,
      id: user.id,
      identity: tipe === "GURU" ? user.nip : user.nisn,
      name: user.nama || user.namaLengkap
    })

    return (
      <div 
        ref={innerRef}
        className="relative w-[340px] h-[540px] bg-white rounded-xl shadow overflow-hidden flex-shrink-0"
      >
        {template.backUrl && (
          <img src={template.backUrl} className="absolute inset-0 w-full h-full object-cover" alt="bg" />
        )}
        
        {/* Container QR Code di Belakang */}
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

  const activeTemplate = previewUser?.tipe === "GURU" ? guruTemplate : santriTemplate

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Manajemen Kartu Identitas</h1>
      
      {/* Preview Modal */}
      <Dialog open={!!previewUser} onOpenChange={(open) => !open && setPreviewUser(null)}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-slate-50 gap-0">
          <DialogHeader className="p-4 border-b bg-white">
            <DialogTitle>Preview Kartu: {previewUser?.user.nama || previewUser?.user.namaLengkap}</DialogTitle>
          </DialogHeader>
            
            <div className="p-8 overflow-y-auto flex-1 flex flex-col items-center">
              {previewUser && (
                <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500">Tampak Depan</span>
                    {renderCardPreviewFront(previewUser.user, previewUser.tipe, activeTemplate, frontRef)}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-slate-500">Tampak Belakang</span>
                    {renderCardPreviewBack(previewUser.user, previewUser.tipe, activeTemplate, backRef)}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPreviewUser(null)}>
                Batal
              </Button>
              <Button onClick={downloadPDF} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="w-4 h-4 mr-2" />
                Unduh PDF
              </Button>
            </div>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
        <TabsList className="mb-6 bg-white border">
          <TabsTrigger value="GURU">Kartu Guru</TabsTrigger>
          <TabsTrigger value="SANTRI">Kartu Santri</TabsTrigger>
        </TabsList>
        
        <TabsContent value="GURU">
          {renderTemplateUploader("GURU", guruTemplate)}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daftar Guru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Nama Guru</th>
                      <th className="px-4 py-3">NIP/NIK</th>
                      <th className="px-4 py-3 text-right">Aksi Unduh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guruList.map(g => (
                      <tr key={g.id} className="border-b hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-800">{g.nama}</td>
                        <td className="px-4 py-3">{g.nip || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => setPreviewUser({ user: g, tipe: "GURU" })}>
                            <Eye className="size-4 mr-2" /> Preview & Cetak
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="SANTRI">
          {renderTemplateUploader("SANTRI", santriTemplate)}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daftar Santri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3">Nama Santri</th>
                      <th className="px-4 py-3">NISN</th>
                      <th className="px-4 py-3 text-right">Aksi Unduh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {santriList.map(s => (
                      <tr key={s.id} className="border-b hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-800">{s.namaLengkap}</td>
                        <td className="px-4 py-3">{s.nisn || "-"}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => setPreviewUser({ user: s, tipe: "SANTRI" })}>
                            <Eye className="size-4 mr-2" /> Preview & Cetak
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
