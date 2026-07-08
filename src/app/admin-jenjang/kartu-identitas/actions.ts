"use server"

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { TipeKartu } from "@prisma/client"
import fs from "fs/promises"
import path from "path"

export async function uploadTemplateAction(
  formData: FormData,
  tipe: TipeKartu,
  side: "FRONT" | "BACK"
) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN_JENJANG" || !session.jenjangId) {
    throw new Error("Unauthorized")
  }

  const file = formData.get("file") as File
  if (!file) throw new Error("No file uploaded")

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = path.extname(file.name)
  const filename = `template_${session.jenjangId}_${tipe}_${side}${ext}`
  
  const uploadDir = path.join(process.cwd(), "public", "uploads", "templates")
  await fs.mkdir(uploadDir, { recursive: true })
  
  const filePath = path.join(uploadDir, filename)
  await fs.writeFile(filePath, buffer)
  
  const fileUrl = `/uploads/templates/${filename}`

  const existingTemplate = await prisma.templateKartu.findUnique({
    where: {
      jenjangId_tipe: {
        jenjangId: session.jenjangId,
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
        jenjangId: session.jenjangId,
        tipe: tipe,
        frontUrl: side === "FRONT" ? fileUrl : null,
        backUrl: side === "BACK" ? fileUrl : null,
      }
    })
  }

  return { success: true, url: fileUrl }
}

export async function getTemplateAction(tipe: TipeKartu) {
  const session = await getSession()
  if (!session || !session.jenjangId) return null

  return prisma.templateKartu.findUnique({
    where: {
      jenjangId_tipe: {
        jenjangId: session.jenjangId,
        tipe: tipe
      }
    }
  })
}

export async function getGuruListAction() {
  const session = await getSession()
  if (!session || !session.jenjangId) return []

  return prisma.guru.findMany({
    where: {
      jenjangs: {
        some: { id: session.jenjangId }
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
  const session = await getSession()
  if (!session || !session.jenjangId) return []

  return prisma.santriJenjang.findMany({
    where: {
      jenjangId: session.jenjangId
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
