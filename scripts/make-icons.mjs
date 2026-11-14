import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const outDir = path.join(root, 'public')

// Full-bleed variant (geschikt als maskable icon): emerald vlak met witte Ελ.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#059669"/>
  <text x="50%" y="52%" dominant-baseline="central" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-size="280" font-weight="700" fill="#ffffff">Ελ</text>
</svg>`

const buf = Buffer.from(svg)

for (const size of [192, 512, 180]) {
  const name = size === 180 ? 'apple-touch-icon.png' : `pwa-${size}.png`
  await sharp(buf, { density: 300 }).resize(size, size).png().toFile(path.join(outDir, name))
  console.log('ok', name)
}
