import { useEffect, useState } from 'react'
import { db } from '../db/db'

interface Backup {
  app: 'grieks-app'
  version: 1
  exportedAt: string
  cards: unknown[]
  chapters: unknown[]
  reviews: unknown[]
}

export function Settings() {
  const [lastBackup, setLastBackup] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    try {
      setLastBackup(localStorage.getItem('grieks:lastBackup'))
    } catch {
      /* private mode */
    }
  }, [])

  async function exportJson() {
    const [cards, chapters, reviews] = await Promise.all([
      db.cards.toArray(),
      db.chapters.toArray(),
      db.reviews.toArray(),
    ])
    const backup: Backup = {
      app: 'grieks-app',
      version: 1,
      exportedAt: new Date().toISOString(),
      cards,
      chapters,
      reviews,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `grieks-backup-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
    const now = new Date().toLocaleString('nl-NL')
    try {
      localStorage.setItem('grieks:lastBackup', now)
    } catch {
      /* negeer */
    }
    setLastBackup(now)
    setMsg('Backup opgeslagen.')
  }

  async function importJson(file: File) {
    try {
      const data = JSON.parse(await file.text()) as Backup
      if (data.app !== 'grieks-app' || !Array.isArray(data.cards)) {
        setMsg('Dit lijkt geen geldige backup.')
        return
      }
      await db.transaction('rw', db.cards, db.chapters, db.reviews, async () => {
        if (data.cards.length) await db.cards.bulkPut(data.cards as never)
        if (data.chapters.length) await db.chapters.bulkPut(data.chapters as never)
        if (data.reviews?.length) {
          await db.reviews.clear()
          await db.reviews.bulkAdd(data.reviews as never)
        }
      })
      setMsg('Voortgang teruggezet.')
    } catch {
      setMsg('Importeren mislukt. Is het bestand wel geldig?')
    }
  }

  async function resetProgress() {
    if (!confirm('Alle voortgang wissen en opnieuw beginnen? Dit kan niet ongedaan worden gemaakt.'))
      return
    await db.delete()
    location.reload()
  }

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top px-5 pb-2 pt-4">
        <h1 className="text-2xl font-semibold text-white">Instellingen</h1>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-6">
        <section className="rounded-2xl bg-slate-900 p-4">
          <h2 className="font-medium text-slate-100">Backup</h2>
          <p className="mt-1 text-sm text-slate-500">
            Je voortgang staat alleen op dit toestel. Maak af en toe een backup, zodat je niets
            kwijtraakt.
          </p>
          {lastBackup && (
            <p className="mt-2 text-xs text-slate-500">Laatste backup: {lastBackup}</p>
          )}
          <div className="mt-3 flex flex-col gap-2">
            <button
              onClick={exportJson}
              className="rounded-xl bg-emerald-600 py-3 font-medium text-white active:bg-emerald-500"
            >
              Backup opslaan (JSON)
            </button>
            <label className="cursor-pointer rounded-xl bg-slate-800 py-3 text-center font-medium text-slate-100 active:bg-slate-700">
              Backup terugzetten
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) importJson(f)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl bg-slate-900 p-4">
          <h2 className="font-medium text-slate-100">Over de data</h2>
          <p className="mt-1 text-sm text-slate-500">
            Fase 1: ongeveer 146 woorden, klemtonen handmatig gecontroleerd. De volledige 2000
            woorden, de vervoegingen en de zinnen volgen in de volgende fases. Vertalingen zijn
            voorlopig en AI-gegenereerd.
          </p>
        </section>

        <section className="rounded-2xl border border-rose-900/40 bg-slate-900 p-4">
          <h2 className="font-medium text-rose-300">Opnieuw beginnen</h2>
          <p className="mt-1 text-sm text-slate-500">Wist alle voortgang op dit toestel.</p>
          <button
            onClick={resetProgress}
            className="mt-3 rounded-xl bg-rose-900/60 py-3 font-medium text-rose-200 active:bg-rose-900"
          >
            Alles wissen
          </button>
        </section>

        {msg && <p className="text-center text-sm text-emerald-400">{msg}</p>}
      </div>
    </div>
  )
}
