import { useEffect, useState } from 'react'
import { Flashcard } from '../components/Flashcard'
import type { CardWithWord } from '../lib/queries'
import { getFavorites, toggleFavorite, toggleFlag } from '../lib/queries'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function Favorites() {
  const [cards, setCards] = useState<CardWithWord[] | null>(null)
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    getFavorites().then((f) => setCards(shuffle(f)))
  }, [])

  if (!cards) {
    return <div className="flex h-full items-center justify-center text-slate-500">Laden…</div>
  }

  if (cards.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <header className="safe-top px-5 pb-2 pt-4">
          <h1 className="text-2xl font-semibold text-white">Favorieten</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-slate-500">
          <div className="text-4xl text-slate-700">☆</div>
          <p>
            Nog geen favorieten. Tik tijdens het oefenen op het sterretje om lastige woorden hier te
            verzamelen.
          </p>
          <p className="text-xs text-slate-600">
            Oefenen met favorieten telt niet mee voor je planning. Puur extra drillen.
          </p>
        </div>
      </div>
    )
  }

  const current = cards[i % cards.length]

  function next() {
    setRevealed(false)
    setI((n) => n + 1)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="safe-top flex items-center justify-between px-5 pb-1 pt-4">
        <h1 className="text-lg font-semibold text-white">Favorieten</h1>
        <div className="text-sm text-slate-500">{cards.length} woorden · vrij oefenen</div>
      </div>

      <Flashcard
        key={current.card.id + ':' + i}
        word={current.word}
        revealed={revealed}
        favorite={current.card.favorite}
        flagged={current.card.flagged}
        onReveal={() => setRevealed(true)}
        onToggleFavorite={async () => {
          await toggleFavorite(current.card.id)
          setCards((cs) => cs && cs.filter((c) => c.card.id !== current.card.id))
        }}
        onToggleFlag={() => toggleFlag(current.card.id)}
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
          <button
            onClick={next}
            className="w-full rounded-2xl bg-emerald-600 py-4 text-lg font-semibold text-white active:bg-emerald-500"
          >
            Volgende
          </button>
        )}
      </div>
    </div>
  )
}
