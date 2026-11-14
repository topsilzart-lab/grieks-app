import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getVerbCounts, listVerbs } from '../lib/queries'
import { GROUPS, GROUP_ORDER } from '../lib/verbs'
import type { VerbGroup } from '../db/types'
import { VerbReview } from './VerbReview'

export function Verbs() {
  const [drilling, setDrilling] = useState(false)
  const [open, setOpen] = useState<VerbGroup | null>(null)

  const counts = useLiveQuery(() => getVerbCounts(), [])
  const verbs = useLiveQuery(() => listVerbs(), [])

  if (drilling) return <VerbReview onDone={() => setDrilling(false)} />

  const byGroup = new Map<VerbGroup, NonNullable<typeof verbs>>()
  for (const v of verbs || []) {
    if (!byGroup.has(v.group)) byGroup.set(v.group, [])
    byGroup.get(v.group)!.push(v)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="safe-top px-5 pb-2 pt-4">
        <h1 className="text-2xl font-semibold text-white">Vervoegingen</h1>
        <p className="text-sm text-slate-500">Vormen in je hoofd oefenen: present, aorist en toekomst.</p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
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
            onClick={() => setDrilling(true)}
            disabled={(counts?.total ?? 0) === 0}
            className="mt-4 w-full rounded-xl bg-emerald-600 py-4 text-lg font-semibold text-white active:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {(counts?.total ?? 0) === 0 ? 'Niks te doen nu' : 'Start'}
          </button>
          <p className="mt-3 text-xs text-slate-500">
            {counts ? `${counts.ready} van ${counts.totaal} werkwoorden klaar. ` : ''}
            Een werkwoord komt in de drill zodra je het bij Vandaag geleerd hebt.
          </p>
        </div>

        {GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => {
          const info = GROUPS[g]
          const list = byGroup.get(g)!
          const isOpen = open === g
          return (
            <div key={g} className="mt-4 overflow-hidden rounded-2xl bg-slate-900">
              <button
                onClick={() => setOpen(isOpen ? null : g)}
                className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-slate-800"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-100">{info.label}</span>
                    <span className="text-sm text-emerald-300">{info.model}</span>
                  </div>
                  <div className="truncate text-xs text-slate-500">{info.uitgang}</div>
                </div>
                <div className="ml-3 shrink-0 text-sm text-slate-500">
                  {list.length} <span className="text-slate-600">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-slate-800">
                  {list.map((v) => (
                    <div key={v.id} className="flex items-baseline justify-between gap-3 px-4 py-2">
                      <div className="min-w-0">
                        <span className="text-slate-100">{v.lemma}</span>
                        <span className="ml-2 text-sm text-slate-500">{v.nl}</span>
                      </div>
                      {v.aorist && <span className="shrink-0 text-sm text-slate-400">{v.aorist}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
