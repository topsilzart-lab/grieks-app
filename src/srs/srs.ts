import {
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card as FsrsCard,
  type Grade,
} from 'ts-fsrs'

// Eén scheduler voor de hele app. Fuzz zorgt dat kaarten niet allemaal op
// exact dezelfde dag terugkomen.
export const scheduler = fsrs(generatorParameters({ enable_fuzz: true }))

export const RATINGS = [
  { grade: Rating.Again, label: 'Opnieuw', cls: 'bg-rose-600 active:bg-rose-500' },
  { grade: Rating.Hard, label: 'Moeilijk', cls: 'bg-amber-600 active:bg-amber-500' },
  { grade: Rating.Good, label: 'Goed', cls: 'bg-emerald-600 active:bg-emerald-500' },
  { grade: Rating.Easy, label: 'Makkelijk', cls: 'bg-sky-600 active:bg-sky-500' },
] as const

export function ms(due: Date | string | number): number {
  if (due instanceof Date) return due.getTime()
  return new Date(due).getTime()
}

/** Beoordeel een kaart. Geeft de nieuwe FSRS-kaart + log terug. */
export function gradeCard(card: FsrsCard, grade: Grade, now: Date = new Date()) {
  return scheduler.next(card, now, grade)
}

/** Voorbeeld van de volgende due-datum per beoordeling (voor de knop-labels). */
export function previewDue(card: FsrsCard, grade: Grade, now: Date = new Date()): Date {
  const rec = scheduler.repeat(card, now)
  return rec[grade].card.due
}

export { Rating, State }
export type { Grade, FsrsCard }
