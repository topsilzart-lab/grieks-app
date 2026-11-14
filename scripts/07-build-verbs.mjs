// Bouwt src/data/verbs.json voor Module 2 (vervoegingen).
// Bron: scripts/.cache/verbForms.json (uit kaikki.org, echte vormen + klemtonen)
// gekoppeld aan de werkwoorden die al in src/data/words.json staan (Module 1).
// GEEN vormen uit geheugen: alles komt uit de gecachte Wiktionary-data.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const words = JSON.parse(readFileSync(join(root, 'src/data/words.json'), 'utf8'))
const vf = JSON.parse(readFileSync(join(root, 'scripts/.cache/verbForms.json'), 'utf8'))

const has = (tags, ...need) => need.every((t) => tags.includes(t))
// Verwijder Wiktionary-voetnootmarkeringen (superscript-cijfers) en dubbele spaties.
const clean = (s) =>
  s
    ? s
        .replace(/[¹²³⁰-₟]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    : s
const pick = (forms, ...need) => {
  const m = forms.find((f) => has(f.tags, ...need))
  return m ? clean(m.form) : null
}
const present = (forms, person, num) =>
  pick(forms, 'active', 'present', 'indicative', person, num) || pick(forms, 'present', person, num)

// Echt onregelmatige werkwoorden die niet in een patroon passen.
const IRREGULAR = new Set(['είμαι'])

function classify(p1, p2) {
  if (IRREGULAR.has(p1)) return 'onregelmatig'
  if (/(ομαι|άμαι|ιέμαι|ούμαι|ιούμαι)$/.test(p1)) return 'mediopassief'
  if (p2 && /άς$/.test(p2)) return 'B1'
  if (p2 && /είς$/.test(p2)) return 'B2'
  return 'A'
}

const GROUP_INFO = {
  A: { model: 'γράφω', uitgang: '-ω (klemtoon op de stam)' },
  B1: { model: 'αγαπάω', uitgang: '-άω / -ώ (klemtoon op het einde, -άς)' },
  B2: { model: 'μπορώ', uitgang: '-ώ (klemtoon op het einde, -είς)' },
  mediopassief: { model: 'έρχομαι', uitgang: '-ομαι' },
}

const verbs = []
let skipped = 0
for (const w of words) {
  if (!(w.pos && w.pos.includes('werkwoord'))) continue
  const forms = vf[w.lemma]
  if (!forms) {
    skipped++
    continue
  }
  const p = [
    present(forms, 'first-person', 'singular'),
    present(forms, 'second-person', 'singular'),
    present(forms, 'third-person', 'singular'),
    present(forms, 'first-person', 'plural'),
    present(forms, 'second-person', 'plural'),
    present(forms, 'third-person', 'plural'),
  ]
  const aorist =
    pick(forms, 'active', 'first-person', 'singular', 'past', 'perfective') ||
    pick(forms, 'first-person', 'singular', 'past') ||
    pick(forms, 'past')
  const dep =
    pick(forms, 'active', 'dependent', 'first-person', 'singular', 'perfective') ||
    pick(forms, 'dependent', 'first-person', 'singular')
  const future = dep ? `θα ${dep}` : null

  // Minimaal bruikbaar: compleet present-paradigma OF (1e persoon + aorist).
  const presentComplete = p.every(Boolean)
  if (!presentComplete && !(p[0] && aorist)) {
    skipped++
    continue
  }
  const group = presentComplete ? classify(p[0], p[1]) : 'onregelmatig'
  verbs.push({
    id: w.id,
    lemma: w.lemma,
    nl: w.nl,
    chapter: w.chapter,
    group,
    present: presentComplete ? p : null,
    aorist: aorist || null,
    future,
  })
}

verbs.sort((a, b) => a.chapter - b.chapter || a.id - b.id)
writeFileSync(join(root, 'src/data/verbs.json'), JSON.stringify(verbs))

const byGroup = {}
for (const v of verbs) byGroup[v.group] = (byGroup[v.group] || 0) + 1
console.log('verbs geschreven:', verbs.length, '| overgeslagen:', skipped)
console.log('per groep:', JSON.stringify(byGroup))
console.log('met aorist:', verbs.filter((v) => v.aorist).length, '| met toekomst:', verbs.filter((v) => v.future).length)
console.log('groep-info:', JSON.stringify(GROUP_INFO))
