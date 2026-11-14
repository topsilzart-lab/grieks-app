import Dexie, { type Table } from 'dexie'
import type { Word, CardRow, ReviewLog, ChapterState } from './types'

export class GreekDB extends Dexie {
  words!: Table<Word, number>
  cards!: Table<CardRow, string>
  reviews!: Table<ReviewLog, number>
  chapters!: Table<ChapterState, number>

  constructor() {
    super('grieks-app')
    this.version(1).stores({
      words: 'id, rank, chapter',
      cards: 'id, wordId, chapter, favorite, flagged',
      reviews: '++id, cardId, ts',
      chapters: 'chapter',
    })
  }
}

export const db = new GreekDB()
