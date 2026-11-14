import Dexie, { type Table } from 'dexie'
import type {
  Word,
  CardRow,
  ReviewLog,
  ChapterState,
  Meta,
  Sentence,
  SentenceCard,
  Verb,
  VerbCard,
} from './types'

export class GreekDB extends Dexie {
  words!: Table<Word, number>
  cards!: Table<CardRow, string>
  reviews!: Table<ReviewLog, number>
  chapters!: Table<ChapterState, number>
  meta!: Table<Meta, string>
  sentences!: Table<Sentence, number>
  sentenceCards!: Table<SentenceCard, string>
  verbs!: Table<Verb, number>
  verbCards!: Table<VerbCard, string>

  constructor() {
    super('grieks-app')
    this.version(1).stores({
      words: 'id, rank, chapter',
      cards: 'id, wordId, chapter, favorite, flagged',
      reviews: '++id, cardId, ts',
      chapters: 'chapter',
    })
    this.version(2).stores({
      words: 'id, rank, chapter',
      cards: 'id, wordId, chapter, favorite, flagged',
      reviews: '++id, cardId, ts',
      chapters: 'chapter',
      meta: 'key',
    })
    this.version(3).stores({
      words: 'id, rank, chapter',
      cards: 'id, wordId, chapter, favorite, flagged',
      reviews: '++id, cardId, ts',
      chapters: 'chapter',
      meta: 'key',
      sentences: '++id, theme, source',
      sentenceCards: 'id, sentenceId, kind',
    })
    this.version(4).stores({
      words: 'id, rank, chapter',
      cards: 'id, wordId, chapter, favorite, flagged',
      reviews: '++id, cardId, ts',
      chapters: 'chapter',
      meta: 'key',
      sentences: '++id, theme, source',
      sentenceCards: 'id, sentenceId, kind',
      verbs: 'id, chapter, group',
      verbCards: 'id, verbId, kind',
    })
  }
}

export const db = new GreekDB()
