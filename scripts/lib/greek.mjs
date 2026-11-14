// Griekse tekst-hulpjes voor de datapijplijn.

const COMBINING = /[̀-ͯ]/g

/** Kleine letters, klemtonen/diakritieken weg, eind-sigma genormaliseerd. */
export function normalizeGreek(s) {
  return s
    .normalize('NFD')
    .replace(COMBINING, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/ς/g, 'σ')
    .trim()
}

/** Bevat het woord Griekse letters (modern of polytonisch)? */
export function hasGreek(s) {
  return /[Ͱ-Ͽἀ-῿]/.test(s)
}

/** Alleen Grieks + eventueel koppelteken, geen cijfers/latijn/spaties. */
export function isSingleGreekWord(s) {
  return hasGreek(s) && /^[Ͱ-Ͽἀ-῿'’-]+$/.test(s)
}

export const GENDER_ARTICLE = { m: 'ο', f: 'η', n: 'το' }
