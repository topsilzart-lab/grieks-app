// Voegt alles samen tot src/data/words.json (2000 woorden).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const CACHE = path.join(ROOT, 'scripts', '.cache')
const DATA = path.join(ROOT, 'src', 'data')
const CHAPTER_SIZE = 100

const structural = JSON.parse(fs.readFileSync(path.join(CACHE, 'words-structural.json'), 'utf8'))
const clean = JSON.parse(fs.readFileSync(path.join(CACHE, 'words-clean.json'), 'utf8'))
const examples = JSON.parse(fs.readFileSync(path.join(CACHE, 'examples.json'), 'utf8'))
const manual = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'translations', 'manual.json'), 'utf8'))

const cleanByLemma = new Map(clean.map((c) => [c.lemma, c]))

let fallbackCount = 0
const out = structural.map((w, i) => {
  const rank = i + 1
  const c = cleanByLemma.get(w.lemma)
  let nl = manual[w.lemma] || c?.nl || null
  let englishFallback = false
  if (!nl) {
    nl = c?.cleanEn || w.gloss || w.lemma
    englishFallback = true
    fallbackCount++
  }
  const ex = examples[w.lemma]
  return {
    id: rank,
    rank,
    chapter: Math.ceil(rank / CHAPTER_SIZE),
    idxInChapter: (rank - 1) % CHAPTER_SIZE,
    lemma: w.lemma,
    pos: c?.posNl || w.posNl,
    article: w.article,
    plural: w.plural,
    past: w.past,
    nl,
    englishFallback,
    exampleGr: ex?.gr,
    exampleId: ex?.id,
    generated: true,
  }
})

fs.mkdirSync(DATA, { recursive: true })
fs.writeFileSync(path.join(DATA, 'words.json'), JSON.stringify(out))
fs.writeFileSync(
  path.join(DATA, 'attribution.json'),
  JSON.stringify(
    {
      woordenEnVervoegingen: 'Wiktionary (via kaikki.org wiktextract), CC BY-SA 4.0',
      frequentie: 'hermitdave/FrequencyWords (OpenSubtitles 2018, el), MIT',
      voorbeeldzinnen: 'Tatoeba.org, CC BY 2.0 FR',
      vertalingenNL: 'AI-gegenereerd (generated: true)',
    },
    null,
    2,
  ),
)

const withExample = out.filter((w) => w.exampleGr).length
console.log(`words.json: ${out.length} woorden`)
console.log(`  NL vertaald: ${out.length - fallbackCount}, Engelse terugval: ${fallbackCount}`)
console.log(`  met voorbeeldzin: ${withExample}`)
console.log(`  hoofdstukken: ${Math.ceil(out.length / CHAPTER_SIZE)}`)
