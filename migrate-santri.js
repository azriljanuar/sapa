const { PrismaClient } = require('./src/generated/prisma');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const isExport = process.argv[2] === 'export';
  if (isExport) {
    console.log('Exporting santri data...');
    // We use raw query because the schema might be partially invalid in the client if we messed it up, 
    // but since we are using raw query it should bypass prisma models.
    const santris = await prisma.$queryRaw`SELECT * FROM Santri`;
    fs.writeFileSync('santri_backup.json', JSON.stringify(santris, null, 2));
    console.log(`Exported ${santris.length} santris.`);
  } else {
    console.log('Importing santri data to SantriJenjang...');
    if (!fs.existsSync('santri_backup.json')) {
      console.log('No backup file found.');
      return;
    }
    const santris = JSON.parse(fs.readFileSync('santri_backup.json', 'utf8'));
    
    // Process unique santri by NISN
    const uniqueSantris = new Map();
    for (const s of santris) {
      if (!uniqueSantris.has(s.nisn)) {
        uniqueSantris.set(s.nisn, s);
      }
    }
    console.log(`Unique NISNs: ${uniqueSantris.size}`);
    
    // Now create SantriJenjang for all
    for (const s of santris) {
      // Find the ID of the kept santri
      const keptSantri = await prisma.santri.findUnique({
        where: { nisn: s.nisn }
      });
      if (keptSantri) {
        // Create SantriJenjang
        await prisma.santriJenjang.create({
          data: {
            santriId: keptSantri.id,
            jenjangId: s.jenjangId,
            statusMukim: s.statusMukim === 1 || s.statusMukim === true,
            isAlumni: s.isAlumni === 1 || s.isAlumni === true,
            tahunLulusId: s.tahunLulusId,
            keteranganLulus: s.keteranganLulus
          }
        }).catch(e => console.log('Error creating SantriJenjang for NISN', s.nisn, e.message));
      }
    }
    console.log('Done importing.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
