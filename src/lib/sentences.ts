import { createEmptyCard } from 'ts-fsrs'
import type { Sentence, SentenceCard } from '../db/types'

const GREEK_WORD = /[Ͱ-Ͽἀ-῿]+/g

/** Kies een woord om weg te laten in de cloze: het langste Griekse woord. */
export function pickClozeWord(gr: string): string | null {
  const toks = gr.match(GREEK_WORD) || []
  if (!toks.length) return null
  const sorted = [...toks].sort((a, b) => b.length - a.length)
  return sorted[0]
}

/** Vervang het clozewoord door een streepje (eerste voorkomen). */
export function makeClozeDisplay(gr: string, word: string | undefined): string {
  if (!word) return gr
  return gr.replace(word, '_____')
}

/** Maak de kaarten (NL->GR en eventueel cloze) voor een zin. */
export function cardsForSentence(sentence: Sentence, now = new Date()): SentenceCard[] {
  const id = sentence.id!
  const cards: SentenceCard[] = [
    {
      id: `${id}:nl-gr`,
      sentenceId: id,
      kind: 'nl-gr',
      fsrs: createEmptyCard(now),
      favorite: false,
      flagged: false,
    },
  ]
  const cw = pickClozeWord(sentence.gr)
  if (cw && cw.length >= 4) {
    cards.push({
      id: `${id}:cloze`,
      sentenceId: id,
      kind: 'cloze',
      clozeWord: cw,
      fsrs: createEmptyCard(now),
      favorite: false,
      flagged: false,
    })
  }
  return cards
}
