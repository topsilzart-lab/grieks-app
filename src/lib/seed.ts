import { createEmptyCard } from 'ts-fsrs'
import { db } from '../db/db'
import type { Word, CardRow, ChapterState } from '../db/types'
import { seedWords } from '../data/seedWords'

const CHAPTER_SIZE = 100
// Hoeveel woorden van hoofdstuk 1 staan standaard aan bij de allereerste start.
const DEFAULT_FIRST_CHAPTER_ACTIVE = 8

// Guard tegen dubbele aanroep (React StrictMode roept effects 2x aan in dev).
let seedPromise: Promise<void> | null = null

/** Vult de database bij de eerste start. Doet niets als er al woorden zijn. */
export function ensureSeeded(): Promise<void> {
  if (!seedPromise) seedPromise = doSeed()
  return seedPromise
}

async function doSeed(): Promise<void> {
  const existing = await db.words.count()
  if (existing > 0) return

  const now = new Date()

  const words: Word[] = seedWords.map((w, i) => {
    const rank = i + 1
    const chapter = Math.ceil(rank / CHAPTER_SIZE)
    const idxInChapter = (rank - 1) % CHAPTER_SIZE
    return {
      id: rank,
      rank,
      chapter,
      idxInChapter,
      lemma: w.lemma,
      pos: w.pos,
      nl: w.nl,
      article: w.article,
      plural: w.plural,
      past: w.past,
      exampleGr: w.ex,
      exampleNl: w.exNl,
      generated: true,
    }
  })

  const cards: CardRow[] = words.map((w) => ({
    id: `${w.id}:gr-nl`,
    wordId: w.id,
    chapter: w.chapter,
    idxInChapter: w.idxInChapter,
    direction: 'gr-nl',
    fsrs: createEmptyCard(now),
    favorite: false,
    flagged: false,
  }))

  const chapterNrs = [...new Set(words.map((w) => w.chapter))].sort((a, b) => a - b)
  const chapters: ChapterState[] = chapterNrs.map((c, i) => ({
    chapter: c,
    activeCount: i === 0 ? DEFAULT_FIRST_CHAPTER_ACTIVE : 0,
  }))

  await db.transaction('rw', db.words, db.cards, db.chapters, async () => {
    // Nog een keer checken binnen de transactie, voor de zekerheid.
    if ((await db.words.count()) > 0) return
    await db.words.bulkPut(words)
    await db.cards.bulkPut(cards)
    await db.chapters.bulkPut(chapters)
  })
}

/** Aantal woorden per hoofdstuk (voor de max van de slider). */
export function chapterWordCount(chapter: number): number {
  return seedWords.filter((_, i) => Math.ceil((i + 1) / CHAPTER_SIZE) === chapter).length
}

export { CHAPTER_SIZE }
