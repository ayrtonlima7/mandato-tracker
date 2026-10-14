// Scraper do G1: baixa a página de promessas de cada político e extrai as propostas.
// Uso: node scripts/data-pipeline/scrape-g1.js [id-do-politico]   (sem id = todos)

import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { POLITICIANS } from './config.js'
import { parseG1Promises } from './lib/g1.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', '..', 'src', 'data', 'g1')

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} para ${url}`)
  return res.text()
}

async function scrapeOne(pol) {
  console.log(`[${pol.id}] baixando ${pol.g1Url}`)
  const html = await fetchPage(pol.g1Url)
  const promises = parseG1Promises(html)
  console.log(`[${pol.id}] ${promises.length} propostas extraídas`)
  return { ...pol, proposals: promises, scrapedAt: new Date().toISOString() }
}

async function main() {
  const target = process.argv[2]
  const list = target ? POLITICIANS.filter((p) => p.id === target) : POLITICIANS
  if (!list.length) {
    console.error(`Político "${target}" não encontrado.`)
    process.exit(1)
  }

  mkdirSync(OUT_DIR, { recursive: true })
  const results = []
  for (const pol of list) {
    try {
      results.push(await scrapeOne(pol))
      await new Promise((r) => setTimeout(r, 1200)) // cortesia entre requisições
    } catch (e) {
      console.error(`[${pol.id}] FALHOU: ${e.message}`)
    }
  }

  const outFile = path.join(OUT_DIR, target ? `${target}.json` : 'all.json')
  writeFileSync(outFile, JSON.stringify(results, null, 2))
  console.log(`\nEscrito em ${outFile} (${results.length} políticos)`)
}

main()
