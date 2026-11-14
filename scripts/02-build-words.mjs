// Bouwt de 2000-woordenlijst uit de frequentielijst + kaikki-index.
// Output: scripts/.cache/words-structural.json  (nog zonder NL-vertaling)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeGreek } from './lib/greek.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(ROOT, '.cache')
const TARGET = 2000

const form2lemma = JSON.parse(fs.readFileSync(path.join(CACHE, 'form2lemma.json'), 'utf8'))
const lemmaInfo = JSON.parse(fs.readFileSync(path.join(CACHE, 'lemmaInfo.json'), 'utf8'))

const POS_NL = {
  noun: 'zelfstandig naamwoord',
  verb: 'werkwoord',
  adj: 'bijvoeglijk naamwoord',
  adv: 'bijwoord',
  pron: 'voornaamwoord',
  num: 'telwoord',
  det: 'bepaler',
  article: 'lidwoord',
  adp: 'voorzetsel',
  conj: 'voegwoord',
  particle: 'partikel',
  intj: 'tussenwerpsel',
}

const freq = fs
  .readFileSync(path.join(CACHE, 'el_50k.txt'), 'utf8')
  .split('\n')
  .map((l) => l.trim().split(' ')[0])
  .filter(Boolean)

const seen = new Set()
const words = []
let skippedNoLemma = 0
let skippedNoInfo = 0

for (const surface of freq) {
  if (words.length >= TARGET) break
  if (!/[Ͱ-Ͽ]/.test(surface)) continue // geen Grieks
  const nk = normalizeGreek(surface)
  const lemma = form2lemma[nk]
  if (!lemma) {
    skippedNoLemma++
    continue
  }
  if (seen.has(lemma)) continue
  const info = lemmaInfo[lemma]
  if (!info || !info.pos) {
    skippedNoInfo++
    continue
  }
  if (lemma.length < 2) continue
  seen.add(lemma)
  words.push({
    lemma,
    pos: info.pos,
    posNl: POS_NL[info.pos] || info.pos,
    gender: info.gender,
    article: info.article,
    plural: info.plural,
    past: info.past,
    gloss: info.gloss || null,
  })
}

fs.writeFileSync(path.join(CACHE, 'words-structural.json'), JSON.stringify(words, null, 1))

console.log(`geselecteerd: ${words.length} (doel ${TARGET})`)
console.log(`overgeslagen - geen lemma: ${skippedNoLemma}, geen info: ${skippedNoInfo}`)
console.log('\n--- eerste 45 ---')
for (let i = 0; i < 45; i++) {
  const w = words[i]
  console.log(
    `${String(i + 1).padStart(4)}  ${w.lemma}  [${w.pos}]${w.article ? ' ' + w.article : ''}${
      w.plural ? ' mv:' + w.plural : ''
    }${w.past ? ' vt:' + w.past : ''}  = ${w.gloss ?? '???'}`,
  )
}
