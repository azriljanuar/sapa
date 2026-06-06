const xlsx = require('xlsx');

const data = [
  { "Nama": "Budi Santoso", "Email": "budi@example.com", "Jenis Kelamin": "L", "Jenjang": "MTs, MA" },
  { "Nama": "Siti Aminah", "Email": "siti@example.com", "Jenis Kelamin": "P", "Jenjang": "MI" }
];

const ws = xlsx.utils.json_to_sheet(data);
const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "Template Guru");
xlsx.writeFile(wb, "./public/Template_Guru.xlsx");
console.log("Template generated successfully");
