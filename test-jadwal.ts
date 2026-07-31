import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const guru = await prisma.guru.findFirst({ where: { username: "user83" } })
  console.log("Guru:", guru?.id)

  if (!guru) return;

  const jadwal = await prisma.jadwalPelajaran.findMany({
    where: {
      pengampu: {
        guruId: guru.id
      }
    },
    include: {
      pengampu: {
        include: { mataPelajaran: true }
      },
      semester: true
    }
  })
  
  console.log("Jadwal total:", jadwal.length)
  for (const j of jadwal) {
    console.log(`Jadwal: Semester ${j.semesterId} (${j.semester.nama}), Jenjang: ${j.pengampu.mataPelajaran.jenjangId}, Mapel: ${j.pengampu.mataPelajaran.nama}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
