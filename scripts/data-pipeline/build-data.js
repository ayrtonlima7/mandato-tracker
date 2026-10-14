// Monta o arquivo de dados final do frontend (src/data/mandateData.js) a partir dos dados
// coletados: propostas do G1 (src/data/g1/all.json) + notícias (src/data/news/all.json).
//
// Uso: node scripts/data-pipeline/build-data.js

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')
const G1_FILE = path.join(ROOT, 'src', 'data', 'g1', 'all.json')
const NEWS_FILE = path.join(ROOT, 'src', 'data', 'news', 'all.json')
const OUT_FILE = path.join(ROOT, 'src', 'data', 'mandateData.js')

// Ordem de exibição dos governadores: agrupados por região, depois por UF.
const REGIAO_ORDEM = { N: 0, NE: 1, CO: 2, SE: 3, S: 4 }
const UF_REGIAO = {
  AC: 'N', AP: 'N', AM: 'N', PA: 'N', RO: 'N', RR: 'N', TO: 'N',
  AL: 'NE', BA: 'NE', CE: 'NE', MA: 'NE', PB: 'NE', PE: 'NE', PI: 'NE', RN: 'NE', SE: 'NE',
  DF: 'CO', GO: 'CO', MT: 'CO', MS: 'CO',
  ES: 'SE', MG: 'SE', RJ: 'SE', SP: 'SE',
  PR: 'S', RS: 'S', SC: 'S',
}

function slugify(s) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function main() {
  const g1 = JSON.parse(readFileSync(G1_FILE, 'utf8'))
  const news = JSON.parse(readFileSync(NEWS_FILE, 'utf8'))

  // Índice de notícias por político + proposta (título como chave)
  const newsByPolitician = new Map(news.map((p) => [p.id, p]))

  const nodes = g1.map((pol) => {
    const newsPol = newsByPolitician.get(pol.id)
    const propostas = pol.proposals.map((prop, i) => {
      const newsProp = newsPol?.proposals?.find((n) => n.title === prop.title) || {}
      return {
        id: `${pol.id}-${i}`,
        titulo: prop.title,
        tema: prop.theme,
        status: prop.status,
        descricao: prop.description || '',
        atualizacoes: (newsProp.updates || []).map((u) => ({
          data: u.date,
          titulo: u.title,
          fonte: u.source,
          url: u.url,
        })),
      }
    })
    return {
      id: pol.id,
      nome: pol.name,
      cargo: pol.role,
      partido: pol.party,
      uf: pol.uf,
      foto: null,
      mandato: pol.mandate ? { inicio: pol.mandate.start, fim: pol.mandate.end } : null,
      propostas,
      filhos: [],
    }
  })

  // Separa presidente (raiz) dos governadores (filhos, ordenados por região/UF)
  const presidente = nodes.find((n) => !n.uf)
  const governadores = nodes
    .filter((n) => n.uf)
    .sort((a, b) => {
      const ra = REGIAO_ORDEM[UF_REGIAO[a.uf]] ?? 9
      const rb = REGIAO_ORDEM[UF_REGIAO[b.uf]] ?? 9
      if (ra !== rb) return ra - rb
      return a.uf.localeCompare(b.uf)
    })

  presidente.filhos = governadores

  const generatedAt = new Date().toISOString()
  const body = `// ARQUIVO GERADO AUTOMATICAMENTE pelo pipeline de dados (scripts/data-pipeline).
// NÃO edite à mão — rode: node scripts/data-pipeline/build-data.js
// Fonte das propostas: projeto "Promessas dos Políticos" (G1). Status: cumpriu | em_parte | nao_cumpriu.
// Notícias: Google News (feed RSS), atualizadas por scripts/data-pipeline/fetch-news.js.
// Gerado em: ${generatedAt}

export const STATUS = {
  CUMPRIU: 'cumpriu',
  EM_PARTE: 'em_parte',
  NAO_CUMPRIU: 'nao_cumpriu',
}

export const generatedAt = '${generatedAt}'

export const mandateTree = ${JSON.stringify(presidente, null, 2)}
`

  writeFileSync(OUT_FILE, body)
  const totalPropostas = nodes.reduce((s, n) => s + n.propostas.length, 0)
  const totalNoticias = nodes.reduce(
    (s, n) => s + n.propostas.reduce((s2, p) => s2 + p.atualizacoes.length, 0),
    0
  )
  console.log(`Escrito em ${OUT_FILE}`)
  console.log(`Presidente + ${governadores.length} governadores | ${totalPropostas} propostas | ${totalNoticias} notícias`)
}

main()
