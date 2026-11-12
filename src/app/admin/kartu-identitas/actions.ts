"use server"

import prisma from "@/lib/prisma"
import { getLoggedInAdminJenjang } from "@/lib/auth"
import { TipeKartu } from "@prisma/client"
import fs from "fs/promises"
import path from "path"
import { processAndSaveWebP } from "@/lib/image-processor"

export async function uploadTemplateAction(
  formData: FormData,
  tipe: TipeKartu,
  side: "FRONT" | "BACK"
) {
  const admin = await getLoggedInAdminJenjang()
  if (!admin || !admin.jenjangId) {
    throw new Error("Unauthorized")
  }

  const file = formData.get("file") as File
  if (!file) throw new Error("No file uploaded")

  const buffer = Buffer.from(await file.arrayBuffer())
  const baseName = `template_${admin.jenjangId}_${tipe}_${side}`
  
  const uploadDir = path.join(process.cwd(), "public", "uploads", "templates")
  const { fileUrl } = await processAndSaveWebP({
    input: buffer,
    targetDir: uploadDir,
    baseName,
    maxWidth: 1280,
    quality: 90,
  })

  const existingTemplate = await prisma.templateKartu.findUnique({
    where: {
      jenjangId_tipe: {
        jenjangId: admin.jenjangId,
        tipe: tipe
      }
    }
  })

  if (existingTemplate) {
    await prisma.templateKartu.update({
      where: { id: existingTemplate.id },
      data: {
        frontUrl: side === "FRONT" ? fileUrl : existingTemplate.frontUrl,
        backUrl: side === "BACK" ? fileUrl : existingTemplate.backUrl,
      }
    })
  } else {
    await prisma.templateKartu.create({
      data: {
        jenjangId: admin.jenjangId,
        tipe: tipe,
        frontUrl: side === "FRONT" ? fileUrl : null,
        backUrl: side === "BACK" ? fileUrl : null,
      }
    })
  }

  return { success: true, url: fileUrl }
}

export async function getTemplateAction(tipe: TipeKartu) {
  const admin = await getLoggedInAdminJenjang()
  if (!admin || !admin.jenjangId) return null

  return prisma.templateKartu.findUnique({
    where: {
      jenjangId_tipe: {
        jenjangId: admin.jenjangId,
        tipe: tipe
      }
    }
  })
}

export async function getGuruListAction() {
  const admin = await getLoggedInAdminJenjang()
  if (!admin || !admin.jenjangId) return []

  return prisma.guru.findMany({
    where: {
      jenjangs: {
        some: { id: admin.jenjangId }
      }
    },
    select: {
      id: true,
      nama: true,
      nip: true,
      fotoWajah: true,
    }
  })
}

export async function getSantriListAction() {
  const admin = await getLoggedInAdminJenjang()
  if (!admin || !admin.jenjangId) return []

  return prisma.santriJenjang.findMany({
    where: {
      jenjangId: admin.jenjangId,
      isAlumni: false,
      statusKeluar: null
    },
    include: {
      santri: {
        select: {
          id: true,
          namaLengkap: true,
          nisn: true,
          fotoWajah: true,
        }
      }
    }
  }).then(sj => sj.map(item => item.santri))
}
