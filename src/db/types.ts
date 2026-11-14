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
  exampleId?: string // Tatoeba-zin-id (bronvermelding)
  englishFallback?: boolean // NL nog niet vertaald; toont Engelse gloss
  generated: boolean // vertaling door AI gegenereerd
}

export interface Meta {
  key: string
  value: unknown
}

export interface Sentence {
  id?: number
  gr: string
  nl: string
  note?: string
  theme?: string
  level?: string // A2 / B1 / B2
  source: 'preset' | 'user'
  createdAt: number
}

export type SentenceCardKind = 'nl-gr' | 'cloze'

export interface SentenceCard {
  id: string // `${sentenceId}:${kind}`
  sentenceId: number
  kind: SentenceCardKind
  clozeWord?: string
  fsrs: FsrsCard
  favorite: boolean
  flagged: boolean
}

// --- Module 2: vervoegingen ---

export type VerbGroup = 'A' | 'B1' | 'B2' | 'mediopassief' | 'onregelmatig'

export interface Verb {
  id: number // = id van het woord in Module 1 (koppeling)
  lemma: string
  nl: string
  chapter: number
  group: VerbGroup
  present: string[] | null // 6 vormen: ik/jij/hij/wij/jullie/zij
  aorist: string | null // verleden tijd, 1e persoon (stamtijd)
  future: string | null // 'θα ...', 1e persoon
}

export type VerbCardKind = 'present' | 'aorist' | 'future'

export interface VerbCard {
  id: string // `${verbId}:${kind}`
  verbId: number
  kind: VerbCardKind
  fsrs: FsrsCard
  favorite: boolean
  flagged: boolean
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
