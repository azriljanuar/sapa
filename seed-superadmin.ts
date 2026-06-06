import prisma from "./src/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  const password = await bcrypt.hash("password123", 10)

  // Buat Super Admin
  await prisma.user.upsert({
    where: { email: "super@pesantren.com" },
    update: {},
    create: {
      nama: "Super Admin",
      email: "super@pesantren.com",
      password,
      role: "SUPER_ADMIN",
    }
  })

  console.log("Seeding SUPER ADMIN sukses!")
  console.log("Email: super@pesantren.com")
  console.log("Password: password123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
