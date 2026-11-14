import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  addUserSentence,
  bulkImportSentences,
  deleteSentence,
  getSentenceCounts,
  listSentences,
} from '../lib/queries'
import { SentenceReview } from './SentenceReview'

export function Sentences() {
  const [reviewing, setReviewing] = useState(false)
  const [tab, setTab] = useState<'overzicht' | 'toevoegen'>('overzicht')

  const counts = useLiveQuery(() => getSentenceCounts(), [])
  const sentences = useLiveQuery(() => listSentences(), [])

  if (reviewing) return <SentenceReview onDone={() => setReviewing(false)} />

  const byTheme = new Map<string, typeof sentences>()
  for (const s of sentences || []) {
    const key = s.source === 'user' ? 'Mijn zinnen' : s.theme || 'Overig'
    if (!byTheme.has(key)) byTheme.set(key, [])
    byTheme.get(key)!.push(s)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top px-5 pb-2 pt-4">
        <h1 className="text-2xl font-semibold text-white">Zinnen</h1>
        <p className="text-sm text-slate-500">Veelgebruikte zinnen oefenen (NL to GR en invullen).</p>
      </header>

      {/* tabs */}
      <div className="flex gap-2 px-5 pb-2">
        {(['overzicht', 'toevoegen'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              tab === t ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400'
            }`}
          >
            {t === 'overzicht' ? 'Overzicht' : 'Toevoegen'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {tab === 'overzicht' ? (
          <>
            <div className="mt-1 rounded-2xl bg-slate-900 p-5">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-4xl font-bold text-white">{counts?.total ?? 0}</div>
                  <div className="text-sm text-slate-500">kaarten klaar</div>
                </div>
                <div className="text-right text-sm text-slate-400">
                  <div>{counts?.due ?? 0} te herhalen</div>
                  <div>{counts?.nieuw ?? 0} nieuw</div>
                </div>
              </div>
              <button
                onClick={() => setReviewing(true)}
                disabled={(counts?.total ?? 0) === 0}
                className="mt-4 w-full rounded-xl bg-emerald-600 py-4 text-lg font-semibold text-white active:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500"
              >
                {(counts?.total ?? 0) === 0 ? 'Niks te doen nu' : 'Start'}
              </button>
            </div>

            {[...byTheme.entries()].map(([theme, list]) => (
              <div key={theme} className="mt-5">
                <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-500">
                  {theme} <span className="text-slate-600">({list!.length})</span>
                </h2>
                <div className="space-y-2">
                  {list!.map((s) => (
                    <div key={s.id} className="flex items-start justify-between rounded-xl bg-slate-900 px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {s.level && (
                            <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                              {s.level}
                            </span>
                          )}
                          <span className="truncate text-slate-100">{s.gr}</span>
                        </div>
                        <div className="truncate text-sm text-slate-500">{s.nl}</div>
                      </div>
                      {s.source === 'user' && (
                        <button
                          onClick={() => deleteSentence(s.id!)}
                          className="ml-3 shrink-0 text-slate-600 active:text-rose-400"
                          aria-label="Verwijder"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <AddSentences />
        )}
      </div>
    </div>
  )
}

function AddSentences() {
  const [gr, setGr] = useState('')
  const [nl, setNl] = useState('')
  const [note, setNote] = useState('')
  const [bulk, setBulk] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function addOne() {
    if (!gr.trim() || !nl.trim()) {
      setMsg('Vul zowel Grieks als Nederlands in.')
      return
    }
    await addUserSentence(gr, nl, note)
    setGr('')
    setNl('')
    setNote('')
    setMsg('Zin toegevoegd.')
  }

  async function importBulk() {
    const n = await bulkImportSentences(bulk)
    setBulk('')
    setMsg(n > 0 ? `${n} ${n === 1 ? 'zin' : 'zinnen'} geïmporteerd.` : 'Geen geldige regels gevonden.')
  }

  const inputCls =
    'w-full rounded-xl bg-slate-900 px-4 py-3 text-slate-100 placeholder-slate-600 outline-none focus:ring-1 focus:ring-emerald-600'

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">Eén zin toevoegen</h2>
        <input className={inputCls} placeholder="Grieks" value={gr} onChange={(e) => setGr(e.target.value)} />
        <input className={inputCls} placeholder="Nederlands" value={nl} onChange={(e) => setNl(e.target.value)} />
        <input
          className={inputCls}
          placeholder="Notitie (optioneel)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button onClick={addOne} className="w-full rounded-xl bg-emerald-600 py-3 font-medium text-white active:bg-emerald-500">
          Toevoegen
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">Bulkimport</h2>
        <p className="text-xs text-slate-500">Eén zin per regel, als: grieks | nederlands</p>
        <textarea
          className={`${inputCls} h-32 resize-none`}
          placeholder={'Καλημέρα | Goedemorgen\nΤι κάνεις; | Hoe gaat het?'}
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
        />
        <button onClick={importBulk} className="w-full rounded-xl bg-slate-800 py-3 font-medium text-slate-100 active:bg-slate-700">
          Importeer
        </button>
      </section>

      {msg && <p className="text-center text-sm text-emerald-400">{msg}</p>}
    </div>
  )
}
