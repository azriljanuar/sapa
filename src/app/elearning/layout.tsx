export default function ELearningLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
