import type { Card as FsrsCard } from 'ts-fsrs'

export interface Word {
  id: number
  rank: number
  chapter: number
  idxInChapter: number // 0-based positie binnen het hoofdstuk
  lemma: string // met klemtoon
  pos: string // woordsoort (Nederlands)
  nl: string // Nederlandse vertaling
  article?: string // ο / η / το bij zelfstandige naamwoorden
  plural?: string // meervoudsvorm
  past?: string // verledentijdsvorm bij werkwoorden
  exampleGr?: string
  exampleNl?: string
  generated: boolean // vertaling door AI gegenereerd
}

export type Direction = 'gr-nl'

export interface CardRow {
  id: string // `${wordId}:gr-nl`
  wordId: number
  chapter: number
  idxInChapter: number
  direction: Direction
  fsrs: FsrsCard
  favorite: boolean
  flagged: boolean
}

export interface ReviewLog {
  id?: number
  cardId: string
  rating: number
  state: number
  ts: number // epoch ms van de beoordeling
  due: number // epoch ms van de nieuwe due-datum
}

export interface ChapterState {
  chapter: number
  activeCount: number // slider: 0..(aantal woorden in hoofdstuk)
}
