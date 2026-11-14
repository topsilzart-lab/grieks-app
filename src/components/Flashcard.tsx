import type { Word } from '../db/types'

interface Props {
  word: Word
  revealed: boolean
  favorite: boolean
  flagged: boolean
  onToggleFavorite: () => void
  onToggleFlag: () => void
  onReveal: () => void
}

export function Flashcard({
  word,
  revealed,
  favorite,
  flagged,
  onToggleFavorite,
  onToggleFlag,
  onReveal,
}: Props) {
  return (
    <div className="relative flex flex-1 flex-col">
      {/* Sterretje + meld fout */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={onToggleFavorite}
          className="flex h-11 w-11 items-center justify-center rounded-full text-2xl"
          aria-label="Favoriet"
        >
          <span className={favorite ? 'text-amber-400' : 'text-slate-600'}>
            {favorite ? '★' : '☆'}
          </span>
        </button>
        <button
          onClick={onToggleFlag}
          className={`rounded-full px-3 py-2 text-xs ${
            flagged ? 'bg-rose-900 text-rose-200' : 'text-slate-500'
          }`}
        >
          {flagged ? '⚑ gemeld' : '⚑ Meld fout'}
        </button>
      </div>

      {/* Tikgebied: de hele kaart draait om */}
      <button
        onClick={() => !revealed && onReveal()}
        className="flex flex-1 flex-col items-center justify-center px-4 text-center"
      >
        <div className="text-5xl font-semibold tracking-wide text-white">{word.lemma}</div>
        <div className="mt-2 text-sm text-slate-500">{word.pos}</div>

        {!revealed && <div className="mt-10 text-sm text-slate-600">tik om te zien</div>}

        {revealed && (
          <div className="mt-8 w-full max-w-sm">
            <div className="h-px w-full bg-slate-800" />
            <div className="mt-6 text-3xl font-medium text-emerald-300">{word.nl}</div>
            {word.englishFallback && (
              <div className="mt-1 text-xs text-slate-500">Engels (NL volgt)</div>
            )}

            <div className="mt-4 space-y-1 text-sm text-slate-400">
              {word.article && (
                <div>
                  <span className="text-slate-500">lidwoord: </span>
                  {word.article} {word.lemma}
                  {word.plural && <span className="text-slate-500"> · mv. {word.plural}</span>}
                </div>
              )}
              {word.past && (
                <div>
                  <span className="text-slate-500">verleden tijd: </span>
                  {word.past}
                </div>
              )}
            </div>

            {word.exampleGr && (
              <div className="mt-6 rounded-xl bg-slate-900 px-4 py-3 text-left">
                <div className="text-base text-slate-100">{word.exampleGr}</div>
                {word.exampleNl && (
                  <div className="mt-1 text-sm text-slate-500">{word.exampleNl}</div>
                )}
              </div>
            )}
          </div>
        )}
      </button>
    </div>
  )
}
