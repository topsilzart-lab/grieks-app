// Leest de kaikki Griekse JSONL en bouwt:
//  - form2lemma.json : genormaliseerde vorm -> lemma (headword wint van verbuiging)
//  - lemmaInfo.json  : lemma -> { pos, gender, article, plural, past, gloss }
//  - verbForms.json  : werkwoord -> [ {form, tags} ]  (voor fase 3, vervoegingen)
import fs from 'node:fs'
import readline from 'node:readline'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeGreek, isSingleGreekWord, hasGreek, GENDER_ARTICLE } from './lib/greek.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(ROOT, '.cache')
const INPUT = path.join(CACHE, 'kaikki-greek.jsonl')

const NOISE_TAGS = new Set(['romanization', 'table-tags', 'inflection-template'])
// Woordsoorten die we overslaan (eigennamen, symbolen, affixen, uitdrukkingen).
const SKIP_POS = new Set([
  'name',
  'symbol',
  'character',
  'punct',
  'phrase',
  'proverb',
  'prefix',
  'suffix',
  'infix',
  'interfix',
  'affix',
  'romanization',
  'abbrev',
])

function cleanForms(e) {
  return (e.forms || []).filter(
    (f) =>
      f.form &&
      Array.isArray(f.tags) &&
      !f.tags.some((t) => NOISE_TAGS.has(t)) &&
      !/no-table-tags/.test(f.form) &&
      !/^el-/.test(f.form) &&
      hasGreek(f.form),
  )
}

function hasAll(tags, needed) {
  return needed.every((t) => tags.includes(t))
}

function firstGloss(e) {
  for (const s of e.senses || []) {
    if (s.form_of) continue
    if (s.glosses && s.glosses.length) return s.glosses.slice(0, 2).join('; ')
  }
  return null
}

const selfMap = new Map() // norm(headword) -> headword
const formMap = new Map() // norm(form) -> lemma (verbuigingen)
const lemmaInfo = new Map() // headword -> info
const verbForms = new Map() // werkwoord -> [{form,tags}]

const POS_PRIORITY = ['verb', 'noun', 'adj', 'adv', 'num', 'pron', 'det', 'article', 'adp', 'conj', 'particle', 'intj']
function posRank(pos) {
  const i = POS_PRIORITY.indexOf(pos)
  return i === -1 ? 99 : i
}

let n = 0
const rl = readline.createInterface({ input: fs.createReadStream(INPUT), crlfDelay: Infinity })

for await (const line of rl) {
  n++
  if (!line) continue
  let e
  try {
    e = JSON.parse(line)
  } catch {
    continue
  }
  if (e.lang_code !== 'el' || !e.word) continue
  if (SKIP_POS.has(e.pos)) continue
  if (!isSingleGreekWord(e.word)) continue

  const isFormOf = (e.senses || []).some((s) => s.form_of)

  if (isFormOf) {
    // Verbuigde vorm: map naar het lemma.
    const fo = e.senses.find((s) => s.form_of)?.form_of?.[0]?.word
    if (fo) {
      const key = normalizeGreek(e.word)
      if (!formMap.has(key)) formMap.set(key, fo)
    }
    continue
  }

  // Lemma (headword).
  const word = e.word
  const nkey = normalizeGreek(word)
  if (!selfMap.has(nkey)) selfMap.set(nkey, word)

  const forms = cleanForms(e)
  // Verbuigingen -> formMap (alleen enkelvoudige woorden; meerwoordsvormen voor fase 3 apart).
  for (const f of forms) {
    if (f.form.includes(' ')) continue
    const fk = normalizeGreek(f.form)
    if (!formMap.has(fk)) formMap.set(fk, word)
  }

  // Lemma-info samenstellen (beste woordsoort per woord bewaren).
  const gloss = firstGloss(e)
  let gender, article, plural, past
  if (e.pos === 'noun') {
    gender = e.head_templates?.[0]?.args?.g || undefined
    if (gender && !['m', 'f', 'n'].includes(gender)) gender = undefined
    article = gender ? GENDER_ARTICLE[gender] : undefined
    const pf =
      forms.find((f) => hasAll(f.tags, ['nominative', 'plural']) && !f.form.includes(' ')) ||
      forms.find((f) => f.tags.includes('plural') && !f.form.includes(' '))
    plural = pf?.form
    const ha = e.head_templates?.[0]?.args
    if (!plural && ha && ha['5'] === 'plural' && ha['6']) plural = ha['6']
  }
  if (e.pos === 'verb') {
    const pastForm = forms.find(
      (f) =>
        !f.tags.includes('passive') &&
        hasAll(f.tags, ['first-person', 'singular', 'past', 'perfective', 'active']) &&
        !f.form.includes(' '),
    )
    past = pastForm?.form
    // Volledige vormen bewaren voor fase 3.
    verbForms.set(word, forms.map((f) => ({ form: f.form, tags: f.tags })))
  }

  const info = { pos: e.pos, gender, article, plural, past, gloss }
  const existing = lemmaInfo.get(word)
  if (!existing || posRank(e.pos) < posRank(existing.pos) || (!existing.gloss && gloss)) {
    // Behoud eerder gevonden detail als het nieuwe minder heeft.
    lemmaInfo.set(word, {
      pos: existing && posRank(existing.pos) < posRank(e.pos) ? existing.pos : info.pos,
      gender: info.gender ?? existing?.gender,
      article: info.article ?? existing?.article,
      plural: info.plural ?? existing?.plural,
      past: info.past ?? existing?.past,
      gloss: info.gloss ?? existing?.gloss,
    })
  }
  if (n % 50000 === 0) process.stderr.write(`\r${n} regels...`)
}

// Samenvoegen: headword wint van verbuiging.
const merged = {}
for (const [k, v] of formMap) merged[k] = v
for (const [k, v] of selfMap) merged[k] = v

const lemmaObj = Object.fromEntries(lemmaInfo)
const verbObj = Object.fromEntries(verbForms)

fs.writeFileSync(path.join(CACHE, 'form2lemma.json'), JSON.stringify(merged))
fs.writeFileSync(path.join(CACHE, 'lemmaInfo.json'), JSON.stringify(lemmaObj))
fs.writeFileSync(path.join(CACHE, 'verbForms.json'), JSON.stringify(verbObj))

console.log(`\nregels: ${n}`)
console.log(`lemmas: ${lemmaInfo.size}, vorm->lemma: ${Object.keys(merged).length}, werkwoorden met vormen: ${verbForms.size}`)
// Sanity
for (const t of ['ήπια', 'είναι', 'παιδιά', 'έκανα', 'σπίτια', 'γυναίκες']) {
  const nk = normalizeGreek(t)
  console.log(`  ${t} -> ${merged[nk] ?? '(niet gevonden)'}`)
}
