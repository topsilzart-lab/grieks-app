// Schoont de Engelse glossen op tot korte termen en past handmatige NL-overrides
// toe voor veelvoorkomende functiewoorden (die kaikki soms verkeerd labelt).
// Output: scripts/.cache/words-clean.json
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(ROOT, '.cache')

const words = JSON.parse(fs.readFileSync(path.join(CACHE, 'words-structural.json'), 'utf8'))

// Handmatige NL-vertalingen + woordsoort voor hoogfrequente grammaticawoorden.
// (lemma -> { nl, posNl? })
const OVERRIDES = {
  να: { nl: 'om te, dat', posNl: 'partikel' },
  το: { nl: 'het; de (lidwoord)', posNl: 'lidwoord' },
  δεν: { nl: 'niet', posNl: 'bijwoord' },
  είναι: { nl: 'is, zijn', posNl: 'werkwoord' },
  θα: { nl: 'zal (toekomst)', posNl: 'partikel' },
  και: { nl: 'en', posNl: 'voegwoord' },
  μου: { nl: 'mijn, mij', posNl: 'voornaamwoord' },
  με: { nl: 'met; mij', posNl: 'voorzetsel' },
  για: { nl: 'voor, om', posNl: 'voorzetsel' },
  την: { nl: 'haar; de (lidwoord)', posNl: 'voornaamwoord' },
  τον: { nl: 'hem; de (lidwoord)', posNl: 'voornaamwoord' },
  τα: { nl: 'de (lidwoord, mv.)', posNl: 'lidwoord' },
  που: { nl: 'die, dat, waar', posNl: 'voornaamwoord' },
  σου: { nl: 'jouw, jou', posNl: 'voornaamwoord' },
  σε: { nl: 'in, op, naar, aan', posNl: 'voorzetsel' },
  του: { nl: 'zijn, hem; de (lidwoord)', posNl: 'voornaamwoord' },
  τι: { nl: 'wat', posNl: 'voornaamwoord' },
  ότι: { nl: 'dat', posNl: 'voegwoord' },
  από: { nl: 'van, vanaf', posNl: 'voorzetsel' },
  στο: { nl: 'in het, op het, naar het', posNl: 'voorzetsel' },
  της: { nl: 'haar; de (lidwoord)', posNl: 'voornaamwoord' },
  όχι: { nl: 'nee', posNl: 'tussenwerpsel' },
  ναι: { nl: 'ja', posNl: 'tussenwerpsel' },
  ένας: { nl: 'een (mannelijk)', posNl: 'telwoord' },
  τη: { nl: 'de (lidwoord); haar', posNl: 'voornaamwoord' },
  αν: { nl: 'als, indien', posNl: 'voegwoord' },
  αλλά: { nl: 'maar', posNl: 'voegwoord' },
  εδώ: { nl: 'hier', posNl: 'bijwoord' },
  σας: { nl: 'jullie, uw', posNl: 'voornaamwoord' },
  τους: { nl: 'hun, hen; de (lidwoord)', posNl: 'voornaamwoord' },
  μας: { nl: 'ons, onze', posNl: 'voornaamwoord' },
  πολύ: { nl: 'heel, erg, veel', posNl: 'bijwoord' },
  γιατί: { nl: 'waarom, omdat', posNl: 'bijwoord' },
  πως: { nl: 'dat (voegwoord)', posNl: 'voegwoord' },
  πώς: { nl: 'hoe', posNl: 'bijwoord' },
  τώρα: { nl: 'nu', posNl: 'bijwoord' },
  εγώ: { nl: 'ik', posNl: 'voornaamwoord' },
  εσύ: { nl: 'jij', posNl: 'voornaamwoord' },
  εμείς: { nl: 'wij', posNl: 'voornaamwoord' },
  εσείς: { nl: 'jullie, u', posNl: 'voornaamwoord' },
  αυτός: { nl: 'hij, deze', posNl: 'voornaamwoord' },
  αυτή: { nl: 'zij, deze', posNl: 'voornaamwoord' },
  αυτό: { nl: 'het, dit', posNl: 'voornaamwoord' },
  εντάξει: { nl: 'oké, in orde', posNl: 'bijwoord' },
  κάτι: { nl: 'iets', posNl: 'voornaamwoord' },
  στην: { nl: 'in de, op de, naar de', posNl: 'voorzetsel' },
  στη: { nl: 'in de, op de, naar de', posNl: 'voorzetsel' },
  στον: { nl: 'in de, op de, naar de', posNl: 'voorzetsel' },
  τις: { nl: 'de (lidwoord, mv.); ze', posNl: 'voornaamwoord' },
  δέ: { nl: 'maar, en', posNl: 'voegwoord' },
  όταν: { nl: 'wanneer, als', posNl: 'voegwoord' },
  γεια: { nl: 'hallo, dag', posNl: 'tussenwerpsel' },
  ευχαριστώ: { nl: 'dank je, bedankt', posNl: 'werkwoord' },
  παρακαλώ: { nl: 'alsjeblieft, graag gedaan', posNl: 'werkwoord' },
}

function cleanGloss(g, pos) {
  if (!g) return null
  let s = g.split(';')[0]
  s = s.replace(/\([^)]*\)/g, ' ').replace(/\[[^\]]*\]/g, ' ').replace(/["“”]/g, '')
  s = s.replace(/\s+/g, ' ').trim()
  // te lange grammaticale omschrijvingen inkorten
  const partsComma = s.split(',').map((x) => x.trim()).filter(Boolean)
  s = partsComma.slice(0, 2).join(', ')
  if (s.split(' ').length > 7) s = s.split(' ').slice(0, 7).join(' ')
  return s || null
}

let overridden = 0
let noGloss = 0
const out = words.map((w) => {
  const ov = OVERRIDES[w.lemma]
  const cleanEn = cleanGloss(w.gloss, w.pos)
  if (!cleanEn && !ov) noGloss++
  if (ov) overridden++
  return {
    lemma: w.lemma,
    posNl: ov?.posNl || w.posNl,
    gender: w.gender,
    article: w.article,
    plural: w.plural,
    past: w.past,
    cleanEn,
    nl: ov?.nl || null, // door overrides al ingevuld; rest vertaal ik
  }
})

fs.writeFileSync(path.join(CACHE, 'words-clean.json'), JSON.stringify(out, null, 1))
console.log(`woorden: ${out.length}, overrides toegepast: ${overridden}, zonder gloss: ${noGloss}`)
console.log('\n--- steekproef cleanEn (46-90) ---')
for (let i = 45; i < 90; i++) {
  const w = out[i]
  console.log(`${String(i + 1).padStart(4)}  ${w.lemma} [${w.posNl}] = ${w.nl ?? w.cleanEn ?? '???'}`)
}
