"use client"

import { Printer } from "lucide-react"

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="fixed bottom-8 right-8 print:hidden flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full shadow-lg font-sans font-medium transition-transform hover:scale-105"
    >
      <Printer className="w-5 h-5" />
      <span>Print Halaman Ini</span>
    </button>
  )
}
