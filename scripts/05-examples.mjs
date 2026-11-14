// Koppelt per lemma een korte Griekse voorbeeldzin uit Tatoeba (CC-BY).
// Voorkeur voor korte zinnen waarvan de meeste woorden tot de 2000 behoren (i+1).
// Output: scripts/.cache/examples.json  (lemma -> { gr, id })
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bz2 from 'unbzip2-stream'
import readline from 'node:readline'
import { normalizeGreek } from './lib/greek.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(ROOT, '.cache')

const form2lemma = JSON.parse(fs.readFileSync(path.join(CACHE, 'form2lemma.json'), 'utf8'))
const words = JSON.parse(fs.readFileSync(path.join(CACHE, 'words-structural.json'), 'utf8'))
const targetLemmas = new Set(words.map((w) => w.lemma))

function tokensToLemmas(text) {
  const toks = text.split(/[^Ͱ-Ͽἀ-῿]+/).filter(Boolean)
  return toks.map((t) => form2lemma[normalizeGreek(t)] || null)
}

// lemma -> best { gr, id, score }
const best = new Map()

const rl = readline.createInterface({
  input: fs.createReadStream(path.join(CACHE, 'ell_sentences.tsv.bz2')).pipe(bz2()),
  crlfDelay: Infinity,
})

let n = 0
for await (const line of rl) {
  if (!line) continue
  const tab = line.split('\t')
  const id = tab[0]
  const text = tab[2]
  if (!text) continue
  n++
  const words0 = text.split(/\s+/).filter(Boolean)
  const wc = words0.length
  if (wc < 3 || wc > 10) continue
  if (!/[.!?]$/.test(text.trim())) continue // echte zin
  const lemmas = tokensToLemmas(text)
  const known = lemmas.filter((l) => l && targetLemmas.has(l)).length
  const coverage = known / Math.max(1, lemmas.length)
  const present = new Set(lemmas.filter(Boolean))
  // kortere zin + hogere dekking = betere score
  const score = coverage * 100 - wc
  for (const lem of present) {
    if (!targetLemmas.has(lem)) continue
    const cur = best.get(lem)
    if (!cur || score > cur.score) best.set(lem, { gr: text.trim(), id, score })
  }
}

const out = {}
for (const [lem, v] of best) out[lem] = { gr: v.gr, id: v.id }

fs.writeFileSync(path.join(CACHE, 'examples.json'), JSON.stringify(out))
console.log(`Tatoeba-zinnen gelezen: ${n}, lemma's met voorbeeld: ${Object.keys(out).length} / ${words.length}`)
// steekproef
for (const l of ['πίνω', 'σπίτι', 'θέλω', 'γυναίκα', 'νερό']) {
  console.log(`  ${l}: ${out[l]?.gr ?? '(geen)'}`)
}
