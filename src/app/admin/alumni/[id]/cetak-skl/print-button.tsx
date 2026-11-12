"use client"

import { useEffect } from "react"

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 transition"
    >
      Cetak Sekarang
    </button>
  )
}
