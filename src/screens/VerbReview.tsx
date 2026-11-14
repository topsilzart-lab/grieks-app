import { useEffect, useState } from 'react'
import { db } from '../db/db'
import type { VerbCardJoined } from '../lib/queries'
import { buildVerbQueue } from '../lib/queries'
import { KIND_LABEL, PRONOUNS, PRONOUNS_NL } from '../lib/verbs'
import { RATINGS, gradeCard, ms, previewDue } from '../srs/srs'
import type { Grade } from '../srs/srs'
import { formatInterval } from '../lib/format'

const REQUEUE_WINDOW_MS = 3 * 60 * 1000

export function VerbReview({ onDone }: { onDone: () => void }) {
  const [queue, setQueue] = useState<VerbCardJoined[] | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)

  useEffect(() => {
    buildVerbQueue().then(setQueue)
  }, [])

  if (!queue) return <div className="flex h-full items-center justify-center text-slate-500">Laden…</div>

  if (queue.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">✓</div>
        <div className="text-xl text-slate-200">{done > 0 ? 'Klaar voor nu!' : 'Niks te oefenen'}</div>
        <p className="text-sm text-slate-500">
          {done > 0
            ? `Je deed ${done} ${done === 1 ? 'werkwoord' : 'werkwoorden'}.`
            : 'Leer eerst werkwoorden bij Vandaag, dan komen ze hier.'}
        </p>
        <button onClick={onDone} className="mt-2 rounded-xl bg-slate-800 px-6 py-3 text-slate-100 active:bg-slate-700">
          Terug
        </button>
      </div>
    )
  }

  const { card, verb } = queue[0]

  async function grade(g: Grade) {
    const item = queue![0]
    const now = new Date()
    const { card: nextFsrs } = gradeCard(item.card.fsrs, g, now)
    await db.verbCards.update(item.card.id, { fsrs: nextFsrs })
    await db.reviews.add({
      cardId: item.card.id,
      rating: g,
      state: nextFsrs.state,
      ts: now.getTime(),
      due: ms(nextFsrs.due),
    })
    const rest = queue!.slice(1)
    if (ms(nextFsrs.due) <= Date.now() + REQUEUE_WINDOW_MS) {
      rest.push({ ...item, card: { ...item.card, fsrs: nextFsrs } })
    }
    setDone((d) => d + 1)
    setRevealed(false)
    setQueue(rest)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onDone} className="text-sm text-slate-400 active:text-slate-200">
          ← Stop
        </button>
        <div className="text-sm text-slate-500">nog {queue.length}</div>
      </div>

      <button
        onClick={() => !revealed && setRevealed(true)}
        className="flex flex-1 flex-col items-center justify-center px-5 text-center"
      >
        <div className="mb-3 text-xs uppercase tracking-wide text-slate-600">{KIND_LABEL[card.kind]}</div>
        <div className="text-3xl font-semibold text-white">{verb.lemma}</div>
        <div className="mt-1 text-sm text-slate-500">{verb.nl}</div>

        {!revealed && <div className="mt-10 text-sm text-slate-600">zeg de vorm(en), tik om te zien</div>}

        {revealed && (
          <div className="mt-8 w-full max-w-sm">
            <div className="h-px w-full bg-slate-800" />
            {card.kind === 'present' && verb.present ? (
              <div className="mt-5 space-y-1.5">
                {verb.present.map((form, i) => (
                  <div key={i} className="flex items-baseline justify-between gap-3">
                    <span className="text-xs text-slate-600">{PRONOUNS[i]}</span>
                    <span className="flex-1 text-left text-lg font-medium text-emerald-300">{form}</span>
                    <span className="text-xs text-slate-600">{PRONOUNS_NL[i]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 text-3xl font-semibold text-emerald-300">
                {card.kind === 'aorist' ? verb.aorist : verb.future}
              </div>
            )}
          </div>
        )}
      </button>

      <div className="safe-bottom px-3 pb-3">
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full rounded-2xl bg-slate-800 py-4 text-lg font-medium text-slate-100 active:bg-slate-700"
          >
            Laat zien
          </button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map((r) => (
              <button
                key={r.grade}
                onClick={() => grade(r.grade)}
                className={`flex flex-col items-center rounded-2xl py-3 text-white ${r.cls}`}
              >
                <span className="text-sm font-semibold">{r.label}</span>
                <span className="mt-0.5 text-[11px] text-white/70">{formatInterval(previewDue(card.fsrs, r.grade))}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
