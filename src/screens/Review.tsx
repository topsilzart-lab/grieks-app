import { useEffect, useState } from 'react'
import { Flashcard } from '../components/Flashcard'
import { db } from '../db/db'
import type { CardWithWord } from '../lib/queries'
import { buildQueue, toggleFavorite, toggleFlag } from '../lib/queries'
import { RATINGS, gradeCard, ms, previewDue } from '../srs/srs'
import type { Grade } from '../srs/srs'
import { formatInterval } from '../lib/format'

// Alleen een net gefaalde kaart (Opnieuw -> ~1 min leerstap) komt deze sessie
// terug. Moeilijk/Goed/Makkelijk verlaten de sessie, zodat de teller daalt.
const REQUEUE_WINDOW_MS = 3 * 60 * 1000

export function Review({ onDone }: { onDone: () => void }) {
  const [queue, setQueue] = useState<CardWithWord[] | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(0)

  useEffect(() => {
    buildQueue().then(setQueue)
  }, [])

  if (!queue) {
    return <div className="flex h-full items-center justify-center text-slate-500">Laden…</div>
  }

  if (queue.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">✓</div>
        <div className="text-xl text-slate-200">
          {done > 0 ? 'Klaar voor nu!' : 'Niks te herhalen'}
        </div>
        <p className="text-sm text-slate-500">
          {done > 0
            ? `Je deed ${done} ${done === 1 ? 'kaart' : 'kaarten'}. Kom later terug of zet meer woorden aan op Vandaag.`
            : 'Zet woorden aan met de slider op Vandaag.'}
        </p>
        <button
          onClick={onDone}
          className="mt-2 rounded-xl bg-slate-800 px-6 py-3 text-slate-100 active:bg-slate-700"
        >
          Terug
        </button>
      </div>
    )
  }

  const current = queue[0]

  async function grade(g: Grade) {
    const item = queue![0]
    const now = new Date()
    const { card: nextFsrs } = gradeCard(item.card.fsrs, g, now)
    await db.cards.update(item.card.id, { fsrs: nextFsrs })
    await db.reviews.add({
      cardId: item.card.id,
      rating: g,
      state: nextFsrs.state,
      ts: now.getTime(),
      due: ms(nextFsrs.due),
    })

    const rest = queue!.slice(1)
    // Nog binnen de sessie terug als de kaart heel snel weer due is (leerstap).
    if (ms(nextFsrs.due) <= Date.now() + REQUEUE_WINDOW_MS) {
      rest.push({ ...item, card: { ...item.card, fsrs: nextFsrs } })
    }
    setDone((d) => d + 1)
    setRevealed(false)
    setQueue(rest)
  }

  const remaining = queue.length

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onDone} className="text-sm text-slate-400 active:text-slate-200">
          ← Stop
        </button>
        <div className="text-sm text-slate-500">nog {remaining}</div>
      </div>

      <Flashcard
        key={current.card.id + ':' + done}
        word={current.word}
        revealed={revealed}
        favorite={current.card.favorite}
        flagged={current.card.flagged}
        onReveal={() => setRevealed(true)}
        onToggleFavorite={async () => {
          await toggleFavorite(current.card.id)
          setQueue((q) => {
            if (!q) return q
            const copy = [...q]
            copy[0] = { ...copy[0], card: { ...copy[0].card, favorite: !copy[0].card.favorite } }
            return copy
          })
        }}
        onToggleFlag={async () => {
          await toggleFlag(current.card.id)
          setQueue((q) => {
            if (!q) return q
            const copy = [...q]
            copy[0] = { ...copy[0], card: { ...copy[0].card, flagged: !copy[0].card.flagged } }
            return copy
          })
        }}
      />

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
                <span className="mt-0.5 text-[11px] text-white/70">
                  {formatInterval(previewDue(current.card.fsrs, r.grade))}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
