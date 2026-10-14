// Busca notícias do Google News para cada proposta de cada político e anexa como "updates".
// Lê src/data/g1/all.json (produzido por scrape-g1.js) e escreve src/data/news/all.json.
//
// Estratégia de busca (sem revisão humana, como pedido):
//   query = "TÍTULO DA PROPOSTA" + nome do político (para desambiguar termos genéricos).
//   Os N resultados mais recentes viram "updates" da proposta, ordenados do mais novo ao mais antigo.
//
// Uso: node scripts/data-pipeline/fetch-news.js [id-do-politico] [--max=N]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchNews } from './lib/news.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const G1_FILE = path.join(__dirname, '..', '..', 'src', 'data', 'g1', 'all.json')
const OUT_DIR = path.join(__dirname, '..', '..', 'src', 'data', 'news')

function parseArgs(argv) {
  let id = null
  let max = 10
  for (const a of argv) {
    if (a.startsWith('--max=')) max = parseInt(a.slice(6), 10)
    else if (!a.startsWith('--')) id = a
  }
  return { id, max }
}

async function main() {
  const { id, max } = parseArgs(process.argv.slice(2))
  const politicians = JSON.parse(readFileSync(G1_FILE, 'utf8'))
  const list = id ? politicians.filter((p) => p.id === id) : politicians
  if (!list.length) {
    console.error(`Político "${id}" não encontrado em ${G1_FILE}`)
    process.exit(1)
  }

  mkdirSync(OUT_DIR, { recursive: true })

  let totalQueries = 0
  const results = []
  for (const pol of list) {
    const enriched = { ...pol, proposals: [] }
    for (const prop of pol.proposals) {
      const query = `${prop.title} ${pol.name}`
      let updates = []
      try {
        updates = await fetchNews(query, max)
        totalQueries++
        process.stdout.write(`[${pol.id}] ${updates.length} notícias <- "${prop.title.slice(0, 45)}"\n`)
      } catch (e) {
        process.stdout.write(`[${pol.id}] FALHOU consulta "${prop.title.slice(0, 45)}": ${e.message}\n`)
      }
      enriched.proposals.push({ ...prop, updates })
      await new Promise((r) => setTimeout(r, 500)) // cortesia (~2 req/s)
    }
    results.push(enriched)
  }

  const outFile = path.join(OUT_DIR, id ? `${id}.json` : 'all.json')
  writeFileSync(outFile, JSON.stringify(results, null, 2))
  console.log(`\nEscrito em ${outFile} (${results.length} políticos, ${totalQueries} consultas)`)
}

main()
