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
const GENERAL_FILE = path.join(ROOT, 'src', 'data', 'news-general', 'all.json')
const OUT_FILE = path.join(ROOT, 'src', 'data', 'mandateData.js')

// Ordem de exibição dos governadores: agrupados por região, depois por UF.
const REGIOES = [
  { sigla: 'N', id: 'regiao-norte', nome: 'Região Norte' },
  { sigla: 'NE', id: 'regiao-nordeste', nome: 'Região Nordeste' },
  { sigla: 'CO', id: 'regiao-centro-oeste', nome: 'Região Centro-Oeste' },
  { sigla: 'SE', id: 'regiao-sudeste', nome: 'Região Sudeste' },
  { sigla: 'S', id: 'regiao-sul', nome: 'Região Sul' },
]
const REGIAO_ORDEM = { N: 0, NE: 1, CO: 2, SE: 3, S: 4 } // eslint-disable-line no-unused-vars
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

// Separa notícias GERAIS (do político, não de uma proposta específica) das específicas.
// Regra: é "geral" a notícia que (a) veio da busca geral do político (newsQuery) OU
// (b) apareceu em 2+ propostas do mesmo político (sinal de cobertura ampla, ex. "Lula
// cumpriu 80% das promessas"). O resto fica como atualização específica da proposta.
function separarNoticiasGerais(propostas, noticiasGeraisFetch) {
  const urlCount = new Map()
  for (const p of propostas) {
    for (const u of p.atualizacoes) {
      if (u.url) urlCount.set(u.url, (urlCount.get(u.url) || 0) + 1)
    }
  }

  const urlsGerais = new Set()
  const geraisByUrl = new Map()

  // (a) busca dedicada (newsQuery) — gerais por definição
  for (const g of noticiasGeraisFetch) {
    if (g.url) {
      urlsGerais.add(g.url)
      if (!geraisByUrl.has(g.url)) geraisByUrl.set(g.url, g)
    }
  }

  // (b) duplicadas entre propostas
  for (const [url, count] of urlCount) {
    if (count >= 2) urlsGerais.add(url)
  }

  // Remove as gerais das propostas (cada proposta fica só com o específico)
  const propostasLimpa = propostas.map((p) => ({
    ...p,
    atualizacoes: p.atualizacoes.filter((u) => !u.url || !urlsGerais.has(u.url)),
  }))

  // Junta a lista final de gerais (dedup por URL, prioriza a da busca dedicada)
  const seen = new Set(geraisByUrl.keys())
  for (const p of propostas) {
    for (const u of p.atualizacoes) {
      if (u.url && urlsGerais.has(u.url) && !seen.has(u.url)) {
        seen.add(u.url)
        geraisByUrl.set(u.url, u)
      }
    }
  }

  const noticiasGerais = [...geraisByUrl.values()]
    .filter((u) => u.url && u.titulo)
    .sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0))

  return { propostas: propostasLimpa, noticiasGerais }
}

function main() {
  const g1 = JSON.parse(readFileSync(G1_FILE, 'utf8'))
  const news = JSON.parse(readFileSync(NEWS_FILE, 'utf8'))
  let generalNews = []
  try {
    generalNews = JSON.parse(readFileSync(GENERAL_FILE, 'utf8'))
  } catch {
    // sem notícias gerais coletadas ainda — segue só com dedup das duplicadas
  }

  // Índice de notícias por político + proposta (título como chave)
  const newsByPolitician = new Map(news.map((p) => [p.id, p]))
  const generalByPolitician = new Map(generalNews.map((g) => [g.id, g.noticiasGerais || []]))

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

    // Separa notícias GERAIS (do político, não de uma proposta específica) das
    // específicas. Regra: vira "geral" a notícia que (a) veio da busca geral do
    // político (newsQuery) OU (b) apareceu em 2+ propostas (sinal de que é ampla).
    const { propostas: propostasLimpa, noticiasGerais } = separarNoticiasGerais(
      propostas,
      generalByPolitician.get(pol.id) || [],
    )

    return {
      id: pol.id,
      nome: pol.name,
      cargo: pol.role,
      partido: pol.party,
      uf: pol.uf,
      foto: null,
      mandato: pol.mandate ? { inicio: pol.mandate.start, fim: pol.mandate.end } : null,
      propostas: propostasLimpa,
      noticiasGerais,
      filhos: [],
    }
  })

  // Separa presidente (raiz) dos governadores, agrupados por região.
  const presidente = nodes.find((n) => !n.uf)
  const governadores = nodes.filter((n) => n.uf)

  presidente.filhos = REGIOES.map((regiao) => {
    const filhos = governadores
      .filter((g) => UF_REGIAO[g.uf] === regiao.sigla)
      .sort((a, b) => a.uf.localeCompare(b.uf))
    return {
      id: regiao.id,
      nome: regiao.nome,
      cargo: 'Região',
      tipo: 'regiao',
      partido: null,
      uf: null,
      foto: null,
      mandato: null,
      propostas: [],
      filhos,
    }
  }).filter((r) => r.filhos.length > 0)

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
