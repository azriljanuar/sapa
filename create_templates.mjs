import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Template Guru
const wbGuru = xlsx.utils.book_new();
const wsGuru = xlsx.utils.json_to_sheet([
  { NIP: '12345678', Nama: 'Fulan Bin Fulan' },
  { NIP: '87654321', Nama: 'Fulana Binti Fulan' }
]);
xlsx.utils.book_append_sheet(wbGuru, wsGuru, 'Template Guru');
const guruPath = path.join(__dirname, 'public', 'Template_Guru.xlsx');
xlsx.writeFile(wbGuru, guruPath);

// Template Santri
const wbSantri = xlsx.utils.book_new();
const wsSantri = xlsx.utils.json_to_sheet([
  { NISN: '11111111', Nama: 'Santri Pertama' },
  { NISN: '22222222', Nama: 'Santri Kedua' }
]);
xlsx.utils.book_append_sheet(wbSantri, wsSantri, 'Template Santri');
const santriPath = path.join(__dirname, 'public', 'Template_Santri.xlsx');
xlsx.writeFile(wbSantri, santriPath);

console.log('Templates created successfully in public directory.');
