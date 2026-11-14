import { createEmptyCard } from 'ts-fsrs'
import { db } from '../db/db'
import type { Word, CardRow, ChapterState, Sentence } from '../db/types'
import wordsData from '../data/words.json'
import sentencesData from '../data/sentences.json'
import { cardsForSentence } from './sentences'

const CHAPTER_SIZE = 100
const DEFAULT_FIRST_CHAPTER_ACTIVE = 8
// Verhoog dit als de woordenlijst inhoudelijk verandert -> bestaande installs
// krijgen dan de nieuwe lijst (voortgang begint opnieuw).
const DATA_VERSION = 2

const WORDS = wordsData as unknown as Word[]

// Guard tegen dubbele aanroep (React StrictMode roept effects 2x aan in dev).
let seedPromise: Promise<void> | null = null

export function ensureSeeded(): Promise<void> {
  if (!seedPromise) seedPromise = doSeed()
  return seedPromise
}

async function doSeed(): Promise<void> {
  const current = (await db.meta.get('seedVersion'))?.value
  if (current === DATA_VERSION) return

  const now = new Date()

  const cards: CardRow[] = WORDS.map((w) => ({
    id: `${w.id}:gr-nl`,
    wordId: w.id,
    chapter: w.chapter,
    idxInChapter: w.idxInChapter,
    direction: 'gr-nl',
    fsrs: createEmptyCard(now),
    favorite: false,
    flagged: false,
  }))

  const chapterNrs = [...new Set(WORDS.map((w) => w.chapter))].sort((a, b) => a - b)
  const chapters: ChapterState[] = chapterNrs.map((c, i) => ({
    chapter: c,
    activeCount: i === 0 ? DEFAULT_FIRST_CHAPTER_ACTIVE : 0,
  }))

  await db.transaction('rw', db.words, db.cards, db.chapters, db.meta, async () => {
    // Woordenlijst verving -> opnieuw opbouwen (voortgang reset).
    await db.words.clear()
    await db.cards.clear()
    await db.chapters.clear()
    await db.words.bulkPut(WORDS)
    await db.cards.bulkPut(cards)
    await db.chapters.bulkPut(chapters)
    await db.meta.put({ key: 'seedVersion', value: DATA_VERSION })
  })
}

const SENTENCES_VERSION = 1
interface PresetSentence {
  theme: string
  gr: string
  nl: string
}
const PRESETS = sentencesData as PresetSentence[]

/** Seed de thema-zinnen en zorgt dat elke zin kaarten heeft. */
export async function ensureSentences(): Promise<void> {
  const now = new Date()
  const current = (await db.meta.get('sentencesVersion'))?.value

  await db.transaction('rw', db.sentences, db.sentenceCards, db.meta, async () => {
    if (current !== SENTENCES_VERSION) {
      // Oude presets + hun kaarten weg, nieuwe presets erin (eigen zinnen blijven).
      const presets = await db.sentences.where('source').equals('preset').toArray()
      const presetIds = new Set(presets.map((s) => s.id))
      await db.sentences.where('source').equals('preset').delete()
      const toRemove = (await db.sentenceCards.toArray())
        .filter((c) => presetIds.has(c.sentenceId))
        .map((c) => c.id)
      if (toRemove.length) await db.sentenceCards.bulkDelete(toRemove)

      for (const p of PRESETS) {
        await db.sentences.add({
          gr: p.gr,
          nl: p.nl,
          theme: p.theme,
          source: 'preset',
          createdAt: now.getTime(),
        } as Sentence)
      }
      await db.meta.put({ key: 'sentencesVersion', value: SENTENCES_VERSION })
    }

    // Kaarten aanvullen voor zinnen die er nog geen hebben.
    const sentences = await db.sentences.toArray()
    const have = new Set((await db.sentenceCards.toArray()).map((c) => c.id))
    const toAdd = sentences.flatMap((s) => cardsForSentence(s, now)).filter((c) => !have.has(c.id))
    if (toAdd.length) await db.sentenceCards.bulkAdd(toAdd)
  })
}

/** Aantal woorden per hoofdstuk (voor de max van de slider). */
export function chapterWordCount(chapter: number): number {
  return WORDS.filter((w) => w.chapter === chapter).length
}

export { CHAPTER_SIZE }
