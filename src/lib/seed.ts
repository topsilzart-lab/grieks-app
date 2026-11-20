import { createEmptyCard } from 'ts-fsrs'
import { db } from '../db/db'
import type { Word, CardRow, ChapterState, Sentence, Verb } from '../db/types'
import wordsData from '../data/words.json'
import sentencesData from '../data/sentences.json'
import verbsData from '../data/verbs.json'
import { cardsForSentence } from './sentences'
import { cardsForVerb } from './verbs'

const CHAPTER_SIZE = 100
const DEFAULT_FIRST_CHAPTER_ACTIVE = 8
// Verhoog dit als de woordenLIJST van samenstelling verandert (andere/meer
// woorden) -> bestaande installs krijgen de nieuwe lijst (voortgang reset).
const DATA_VERSION = 2
// Verhoog dit als alleen de INHOUD van bestaande woorden wijzigt (betekenis,
// voorbeeld e.d.): de velden worden ververst, maar kaarten/voortgang blijven.
const CONTENT_VERSION = 1

const WORDS = wordsData as unknown as Word[]

// Guard tegen dubbele aanroep (React StrictMode roept effects 2x aan in dev).
let seedPromise: Promise<void> | null = null

export function ensureSeeded(): Promise<void> {
  if (!seedPromise) seedPromise = doSeed()
  return seedPromise
}

async function doSeed(): Promise<void> {
  const current = (await db.meta.get('seedVersion'))?.value
  if (current === DATA_VERSION) {
    // Lijst ongewijzigd: alleen de woordinhoud (betekenissen) bijwerken.
    await refreshWordContent()
    return
  }

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
    await db.meta.put({ key: 'wordsContentVersion', value: CONTENT_VERSION })
  })
}

/**
 * Ververst alleen de inhoud van bestaande woorden (betekenis, voorbeeld,
 * lidwoord, enz.) zonder de kaarten of voortgang aan te raken. Draait als de
 * lijst qua samenstelling gelijk blijft maar de betekenissen zijn gecorrigeerd.
 */
async function refreshWordContent(): Promise<void> {
  const contentVersion = (await db.meta.get('wordsContentVersion'))?.value
  if (contentVersion === CONTENT_VERSION) return
  await db.transaction('rw', db.words, db.meta, async () => {
    // bulkPut werkt bestaande rijen (zelfde id) bij; kaarten verwijzen naar id
    // en blijven dus geldig, FSRS-voortgang blijft bewaard.
    await db.words.bulkPut(WORDS)
    await db.meta.put({ key: 'wordsContentVersion', value: CONTENT_VERSION })
  })
}

const SENTENCES_VERSION = 2
interface PresetSentence {
  theme: string
  gr: string
  nl: string
  level?: string
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
          level: p.level,
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

// --- Module 2: vervoegingen ---
const VERBS_VERSION = 1
const VERBS = verbsData as unknown as Verb[]

/** Seed de werkwoorden en zorgt dat elk werkwoord zijn drill-kaarten heeft. */
export async function ensureVerbs(): Promise<void> {
  const now = new Date()
  const current = (await db.meta.get('verbsVersion'))?.value

  await db.transaction('rw', db.verbs, db.verbCards, db.meta, async () => {
    if (current !== VERBS_VERSION) {
      await db.verbs.clear()
      await db.verbCards.clear()
      await db.verbs.bulkPut(VERBS)
      await db.meta.put({ key: 'verbsVersion', value: VERBS_VERSION })
    }
    // Kaarten aanvullen voor werkwoorden die er nog geen hebben.
    const verbs = await db.verbs.toArray()
    const have = new Set((await db.verbCards.toArray()).map((c) => c.id))
    const toAdd = verbs.flatMap((v) => cardsForVerb(v, now)).filter((c) => !have.has(c.id))
    if (toAdd.length) await db.verbCards.bulkAdd(toAdd)
  })
}

/** Aantal woorden per hoofdstuk (voor de max van de slider). */
export function chapterWordCount(chapter: number): number {
  return WORDS.filter((w) => w.chapter === chapter).length
}

export { CHAPTER_SIZE }
