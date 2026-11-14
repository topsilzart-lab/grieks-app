import { createEmptyCard } from 'ts-fsrs'
import type { Verb, VerbCard, VerbCardKind, VerbGroup } from '../db/types'

// Nederlandse voornaamwoorden bij de 6 vormen van het present.
export const PRONOUNS = ['εγώ', 'εσύ', 'αυτός/ή', 'εμείς', 'εσείς', 'αυτοί/ές'] as const
export const PRONOUNS_NL = ['ik', 'jij', 'hij/zij', 'wij', 'jullie', 'zij'] as const

export const GROUPS: Record<VerbGroup, { label: string; model: string; uitgang: string }> = {
  A: { label: 'Groep A', model: 'γράφω', uitgang: '-ω, klemtoon op de stam' },
  B1: { label: 'Groep B1', model: 'αγαπάω', uitgang: '-άω / -ώ, klemtoon op het einde (-άς)' },
  B2: { label: 'Groep B2', model: 'μπορώ', uitgang: '-ώ, klemtoon op het einde (-είς)' },
  mediopassief: { label: 'Mediopassief', model: 'έρχομαι', uitgang: '-ομαι' },
  onregelmatig: { label: 'Onregelmatig', model: 'είμαι', uitgang: 'eigen vormen' },
}

export const GROUP_ORDER: VerbGroup[] = ['A', 'B1', 'B2', 'mediopassief', 'onregelmatig']

export const KIND_LABEL: Record<VerbCardKind, string> = {
  present: 'tegenwoordige tijd',
  aorist: 'aorist (verleden, ik)',
  future: 'toekomst (ik)',
}

/** Welke kaarten horen bij een werkwoord (alleen aspecten waarvoor data bestaat). */
export function cardsForVerb(v: Verb, now: Date = new Date()): VerbCard[] {
  const out: VerbCard[] = []
  const add = (kind: VerbCardKind) =>
    out.push({ id: `${v.id}:${kind}`, verbId: v.id, kind, fsrs: createEmptyCard(now), favorite: false, flagged: false })
  if (v.present) add('present')
  if (v.aorist) add('aorist')
  if (v.future) add('future')
  return out
}
