// Busca notícias GERAIS de cada político (query do campo newsQuery da config, ex: "Lula presidente").
// Essas notícias vão para a seção "Notícias gerais" no topo, em vez de poluir as propostas.
// Escreve src/data/news-general/all.json.
//
// Uso: node scripts/data-pipeline/fetch-general.js [id] [--max=N]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { POLITICIANS } from './config.js'
import { fetchNews } from './lib/news.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', '..', 'src', 'data', 'news-general')

function parseArgs(argv) {
  let id = null
  let max = 20
  for (const a of argv) {
    if (a.startsWith('--max=')) max = parseInt(a.slice(6), 10)
    else if (!a.startsWith('--')) id = a
  }
  return { id, max }
}

async function main() {
  const { id, max } = parseArgs(process.argv.slice(2))
  const list = id ? POLITICIANS.filter((p) => p.id === id) : POLITICIANS
  if (!list.length) {
    console.error(`Político "${id}" não encontrado.`)
    process.exit(1)
  }

  mkdirSync(OUT_DIR, { recursive: true })
  const results = []
  for (const pol of list) {
    try {
      const items = await fetchNews(pol.newsQuery, max)
      console.log(`[${pol.id}] ${items.length} notícias gerais <- "${pol.newsQuery}"`)
      results.push({
        id: pol.id,
        newsQuery: pol.newsQuery,
        noticiasGerais: items,
        fetchedAt: new Date().toISOString(),
      })
    } catch (e) {
      console.error(`[${pol.id}] FALHOU: ${e.message}`)
      results.push({ id: pol.id, newsQuery: pol.newsQuery, noticiasGerais: [], fetchedAt: null })
    }
    await new Promise((r) => setTimeout(r, 600))
  }

  const outFile = path.join(OUT_DIR, id ? `${id}.json` : 'all.json')
  writeFileSync(outFile, JSON.stringify(results, null, 2))
  console.log(`\nEscrito em ${outFile}`)
}

main()
