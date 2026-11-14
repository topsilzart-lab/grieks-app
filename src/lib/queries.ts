import { db } from '../db/db'
import type { CardRow, Word, Sentence, SentenceCard, Verb, VerbCard } from '../db/types'
import { ms, State } from '../srs/srs'
import { chapterWordCount } from './seed'
import { cardsForSentence } from './sentences'

export interface CardWithWord {
  card: CardRow
  word: Word
}

export interface ChapterStat {
  chapter: number
  max: number // aantal woorden in het hoofdstuk
  activeCount: number
  learned: number // kaarten in State.Review binnen de actieve set
  due: number // nu te herhalen
  newCount: number // actief maar nog niet gestart
}

async function loadAll() {
  const [cards, words, chapters] = await Promise.all([
    db.cards.toArray(),
    db.words.toArray(),
    db.chapters.toArray(),
  ])
  const wordMap = new Map(words.map((w) => [w.id, w]))
  const activeByChapter = new Map(chapters.map((c) => [c.chapter, c.activeCount]))
  return { cards, words, chapters, wordMap, activeByChapter }
}

/** Kaarten die momenteel actief zijn (binnen de slider-stand van hun hoofdstuk). */
export async function getActiveCards(): Promise<CardWithWord[]> {
  const { cards, wordMap, activeByChapter } = await loadAll()
  return cards
    .filter((c) => c.idxInChapter < (activeByChapter.get(c.chapter) ?? 0))
    .map((c) => ({ card: c, word: wordMap.get(c.wordId)! }))
    .filter((x) => x.word)
}

/** De reviewrij: eerst te herhalen kaarten (op due), daarna nieuwe. */
export async function buildQueue(now = Date.now()): Promise<CardWithWord[]> {
  const active = await getActiveCards()
  const reviews = active
    .filter((a) => a.card.fsrs.state !== State.New && ms(a.card.fsrs.due) <= now)
    .sort((a, b) => ms(a.card.fsrs.due) - ms(b.card.fsrs.due))
  const news = active
    .filter((a) => a.card.fsrs.state === State.New)
    .sort((a, b) => a.word.rank - b.word.rank)
  return [...reviews, ...news]
}

export async function getChapterStats(now = Date.now()): Promise<ChapterStat[]> {
  const { cards, chapters, activeByChapter } = await loadAll()
  return chapters
    .sort((a, b) => a.chapter - b.chapter)
    .map((ch) => {
      const activeCount = activeByChapter.get(ch.chapter) ?? 0
      const inChapter = cards.filter((c) => c.chapter === ch.chapter)
      const active = inChapter.filter((c) => c.idxInChapter < activeCount)
      return {
        chapter: ch.chapter,
        max: chapterWordCount(ch.chapter),
        activeCount,
        learned: active.filter((c) => c.fsrs.state === State.Review).length,
        due: active.filter((c) => c.fsrs.state !== State.New && ms(c.fsrs.due) <= now).length,
        newCount: active.filter((c) => c.fsrs.state === State.New).length,
      }
    })
}

export async function getTodayCounts(now = Date.now()) {
  const q = await buildQueue(now)
  const due = q.filter((x) => x.card.fsrs.state !== State.New).length
  const nieuw = q.length - due
  return { total: q.length, due, nieuw }
}

export async function setActiveCount(chapter: number, n: number) {
  await db.chapters.update(chapter, { activeCount: Math.max(0, Math.round(n)) })
}

export async function toggleFavorite(cardId: string) {
  const c = await db.cards.get(cardId)
  if (c) await db.cards.update(cardId, { favorite: !c.favorite })
}

export async function toggleFlag(cardId: string) {
  const c = await db.cards.get(cardId)
  if (c) await db.cards.update(cardId, { flagged: !c.flagged })
}

export async function getFavorites(): Promise<CardWithWord[]> {
  const { cards, wordMap } = await loadAll()
  return cards
    .filter((c) => c.favorite)
    .map((c) => ({ card: c, word: wordMap.get(c.wordId)! }))
    .filter((x) => x.word)
}

// --- Module 3: zinnen ---

export interface SentenceCardJoined {
  card: SentenceCard
  sentence: Sentence
}

// Hoeveel nieuwe zinkaarten je per sessie krijgt (anders staan er honderden klaar).
const NEW_SENTENCE_LIMIT = 10

export async function buildSentenceQueue(now = Date.now()): Promise<SentenceCardJoined[]> {
  const [cards, sentences] = await Promise.all([db.sentenceCards.toArray(), db.sentences.toArray()])
  const map = new Map(sentences.map((s) => [s.id!, s]))
  const joined = cards
    .map((c) => ({ card: c, sentence: map.get(c.sentenceId)! }))
    .filter((x) => x.sentence)
  const reviews = joined
    .filter((x) => x.card.fsrs.state !== State.New && ms(x.card.fsrs.due) <= now)
    .sort((a, b) => ms(a.card.fsrs.due) - ms(b.card.fsrs.due))
  const news = joined
    .filter((x) => x.card.fsrs.state === State.New)
    .sort((a, b) => (a.sentence.id ?? 0) - (b.sentence.id ?? 0))
    .slice(0, NEW_SENTENCE_LIMIT)
  return [...reviews, ...news]
}

export async function getSentenceCounts(now = Date.now()) {
  const q = await buildSentenceQueue(now)
  const due = q.filter((x) => x.card.fsrs.state !== State.New).length
  return { total: q.length, due, nieuw: q.length - due }
}

export async function listSentences(): Promise<Sentence[]> {
  return db.sentences.toArray()
}

export async function addUserSentence(gr: string, nl: string, note?: string): Promise<void> {
  const id = (await db.sentences.add({
    gr: gr.trim(),
    nl: nl.trim(),
    note: note?.trim() || undefined,
    source: 'user',
    createdAt: Date.now(),
  } as Sentence)) as number
  const s = await db.sentences.get(id)
  if (s) await db.sentenceCards.bulkAdd(cardsForSentence(s))
}

/** Bulkimport: regels in de vorm `grieks | nederlands`. Geeft aantal terug. */
export async function bulkImportSentences(text: string): Promise<number> {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  let n = 0
  for (const line of lines) {
    const idx = line.indexOf('|')
    if (idx === -1) continue
    const gr = line.slice(0, idx).trim()
    const nl = line.slice(idx + 1).trim()
    if (!gr || !nl) continue
    await addUserSentence(gr, nl)
    n++
  }
  return n
}

export async function deleteSentence(id: number): Promise<void> {
  await db.sentenceCards.where('sentenceId').equals(id).delete()
  await db.sentences.delete(id)
}

// --- Module 2: vervoegingen ---

export interface VerbCardJoined {
  card: VerbCard
  verb: Verb
}

// Hoeveel nieuwe werkwoord-kaarten je per sessie krijgt.
const NEW_VERB_LIMIT = 10

/** Set met woord-id's die in Module 1 al gestart zijn (niet meer 'nieuw'). */
async function startedWordIds(): Promise<Set<number>> {
  const cards = await db.cards.toArray()
  const ids = new Set<number>()
  for (const c of cards) if (c.fsrs.state !== State.New) ids.add(c.wordId)
  return ids
}

/**
 * De drill-rij voor werkwoorden. Een werkwoord doet pas mee als het
 * bijbehorende woord in Module 1 al gestart is (geleerd). Reviews eerst,
 * daarna beperkt nieuwe kaarten.
 */
export async function buildVerbQueue(now = Date.now()): Promise<VerbCardJoined[]> {
  const [cards, verbs, started] = await Promise.all([
    db.verbCards.toArray(),
    db.verbs.toArray(),
    startedWordIds(),
  ])
  const map = new Map(verbs.map((v) => [v.id, v]))
  const joined = cards
    .map((c) => ({ card: c, verb: map.get(c.verbId)! }))
    .filter((x) => x.verb && started.has(x.verb.id))
  const reviews = joined
    .filter((x) => x.card.fsrs.state !== State.New && ms(x.card.fsrs.due) <= now)
    .sort((a, b) => ms(a.card.fsrs.due) - ms(b.card.fsrs.due))
  const news = joined
    .filter((x) => x.card.fsrs.state === State.New)
    .sort((a, b) => a.verb.chapter - b.verb.chapter || a.verb.id - b.verb.id)
    .slice(0, NEW_VERB_LIMIT)
  return [...reviews, ...news]
}

export async function getVerbCounts(now = Date.now()) {
  const [q, verbs, started] = await Promise.all([
    buildVerbQueue(now),
    db.verbs.toArray(),
    startedWordIds(),
  ])
  const due = q.filter((x) => x.card.fsrs.state !== State.New).length
  const ready = verbs.filter((v) => started.has(v.id)).length
  return { total: q.length, due, nieuw: q.length - due, ready, totaal: verbs.length }
}

export async function listVerbs(): Promise<Verb[]> {
  return db.verbs.toArray()
}
