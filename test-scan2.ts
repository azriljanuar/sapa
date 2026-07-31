import prisma from "./src/lib/prisma"
async function main() {
  const k = await prisma.kelasFormal.findMany()
  console.log("All Kelas:", k)
  
  const selectedSem = (await import("./src/lib/ta-context")).getSelectedTahunAjaran
  // we can't run next headers in a raw script, so let's just query db
}
main()
