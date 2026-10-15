// Revisão por IA do match de notícias (DeepSeek, API OpenAI-compatible).
//
// Para cada notícia associada a uma proposta, o LLM classifica em:
//   "especifica"   → a notícia trata daquela proposta (mantém no card)
//   "geral"        → trata do político/mandato de forma ampla (move para "Notícias gerais")
//   "irrelevante"  → sem relação (descarta)
//
// Entrada:  src/data/news/all.json (propostas + notícias) e src/data/news-general/all.json
// Saída:    reescreve os MESMOS arquivos já revisados (news/all.json com só "especifica";
//           news-general/all.json com as gerais originais + as reclassificadas, dedup por URL).
//
// Uso: node scripts/data-pipeline/review-match.js [id] [--max=N]
// Requer: DEEPSEEK_API_KEY no ambiente.

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')
const NEWS_FILE = path.join(ROOT, 'src', 'data', 'news', 'all.json')
const GENERAL_FILE = path.join(ROOT, 'src', 'data', 'news-general', 'all.json')

const MODEL = 'deepseek-chat'
const API_URL = 'https://api.deepseek.com/chat/completions'
const CHUNK = 40 // notícias por requisição

// Carrega .env da raiz do projeto (a chave do .env TEM PRECEDÊNCIA sobre o ambiente/shell).
function loadEnv() {
  const envPath = path.join(__dirname, '..', '..', '.env')
  let raw = ''
  try {
    raw = readFileSync(envPath, 'utf8')
  } catch {
    return // sem .env; usa process.env como está
  }
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const val = m[2].replace(/^["']|["']$/g, '')
    process.env[m[1]] = val // sobrescreve, garantindo precedência do .env
  }
}

function parseArgs(argv) {
  let id = null
  let max = 0 // 0 = todas
  for (const a of argv) {
    if (a.startsWith('--max=')) max = parseInt(a.slice(6), 10)
    else if (!a.startsWith('--')) id = a
  }
  return { id, max }
}

async function classificar(chunk, politico) {
  const key = process.env.DEEPSEEK_API_KEY
  if (!key) throw new Error('DEEPSEEK_API_KEY não definida no ambiente.')

  const items = chunk.map((c) => ({
    id: c.id,
    proposta: c.proposta,
    manchete: c.manchete,
  }))

  const sys =
    'Você classifica manchetes de notícias políticas brasileiras. Para cada item, dado o TÍTULO DA PROPOSTA de mandato e a MANCHETE, responda a categoria em JSON.\n' +
    'Categorias:\n' +
    '- "especifica": a manchete trata diretamente do assunto daquela proposta específica.\n' +
    '- "geral": trata do político ou do governo de forma ampla (ex. balanço geral de promessas, aprovação do governo, eleições), NÃO da proposta específica.\n' +
    '- "irrelevante": não tem relação com a proposta nem com o político.\n' +
    'Responda SOMENTE um objeto JSON: {"resultados":[{"id":0,"categoria":"especifica"},...]} preservando o id de cada item.'

  const user =
    `Político: ${politico}\n\n` + JSON.stringify(items, null, 1)

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: user },
      ],
      temperature: 0,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  return JSON.parse(content).resultados
}

async function revisarPolitico(polId, nome, propostas, noticiasGerais, max) {
  // Achata todas as notícias de propostas com contexto, com índice global
  const flat = []
  let counter = 0
  const propostaPorId = []
  for (const prop of propostas) {
    for (const n of prop.updates ?? []) {
      flat.push({ id: counter, proposta: prop.title, manchete: n.title, item: n, propTitle: prop.title })
      propostaPorId.push(prop.title)
      counter++
    }
  }

  const categorias = new Map() // id -> categoria
  const total = max && max < flat.length ? flat.slice(0, max) : flat
  const chunks = []
  for (let i = 0; i < total.length; i += CHUNK) chunks.push(total.slice(i, i + CHUNK))

  for (const chunk of chunks) {
    let tentativas = 3
    while (tentativas > 0) {
      try {
        const resultados = await classificar(chunk, nome)
        for (const r of resultados) categorias.set(r.id, r.categoria)
        break
      } catch (e) {
        tentativas--
        if (tentativas === 0) {
          console.error(`  [${polId}] falhou classificar um lote: ${e.message}`)
          for (const c of chunk) if (!categorias.has(c.id)) categorias.set(c.id, 'especifica') // conservador
        } else {
          await new Promise((r) => setTimeout(r, 1500))
        }
      }
    }
    process.stdout.write('.')
    await new Promise((r) => setTimeout(r, 300))
  }

  // Aplica a classificação
  const especificas = [] // volta para as propostas (mapa propTitle -> updates)
  const gerais = [] // move para notícias gerais
  for (const f of flat) {
    const cat = categorias.get(f.id) || 'especifica'
    if (cat === 'irrelevante') continue
    if (cat === 'geral') gerais.push(f.item)
    else especificas.push(f)
  }

  const propostasRevisadas = propostas.map((prop) => ({
    ...prop,
    updates: especificas.filter((f) => f.propTitle === prop.title).map((f) => f.item),
  }))

  // Junta notícias gerais: originais + reclassificadas, dedup por URL
  const visto = new Set()
  const noticiasGeraisFinais = []
  for (const n of [...noticiasGerais, ...gerais]) {
    if (n.url && visto.has(n.url)) continue
    if (n.url) visto.add(n.url)
    noticiasGeraisFinais.push(n)
  }
  noticiasGeraisFinais.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))

  return { propostas: propostasRevisadas, noticiasGerais: noticiasGeraisFinais }
}

async function main() {
  loadEnv()
  const { id, max } = parseArgs(process.argv.slice(2))
  const news = JSON.parse(readFileSync(NEWS_FILE, 'utf8'))
  const general = JSON.parse(readFileSync(GENERAL_FILE, 'utf8'))
  const generalByPol = new Map(general.map((g) => [g.id, g.noticiasGerais || []]))
  const list = id ? news.filter((p) => p.id === id) : news

  let totalEspecificas = 0
  let totalGerais = 0
  let totalDescartadas = 0

  for (const pol of list) {
    const antes = pol.proposals.reduce((s, p) => s + (p.updates?.length ?? 0), 0)
    process.stdout.write(`[${pol.id}] revisando ${antes} notícias`)
    const { propostas, noticiasGerais } = await revisarPolitico(
      pol.id,
      pol.name,
      pol.proposals,
      generalByPol.get(pol.id) || [],
      max,
    )
    const depois = propostas.reduce((s, p) => s + (p.updates?.length ?? 0), 0)
    totalEspecificas += depois
    totalGerais += noticiasGerais.length
    totalDescartadas += antes - depois - (noticiasGerais.length - (generalByPol.get(pol.id)?.length ?? 0))
    pol.proposals = propostas
    pol.noticiasGerais = noticiasGerais
    process.stdout.write(` → ${depois} específicas, ${noticiasGerais.length} gerais\n`)
  }

  // Solo (com id) escreve em {id}.json para NÃO sobrescrever all.json; full escreve all.json.
  const isSolo = Boolean(id)
  const newsOut = isSolo ? path.join(path.dirname(NEWS_FILE), `${id}.json`) : NEWS_FILE
  const geralOutFile = isSolo ? path.join(path.dirname(GENERAL_FILE), `${id}.json`) : GENERAL_FILE
  writeFileSync(newsOut, JSON.stringify(list, null, 2))
  // news-general: preserva estrutura [{id, noticiasGerais}]
  const geralOut = list.map((p) => ({ id: p.id, newsQuery: p.newsQuery, noticiasGerais: p.noticiasGerais }))
  writeFileSync(geralOutFile, JSON.stringify(geralOut, null, 2))

  console.log(
    `\nRevisado: ${totalEspecificas} específicas | ${totalGerais} gerais | ${totalDescartadas} descartadas como irrelevantes`,
  )
  console.log(`Escrito em ${newsOut} e ${geralOutFile}`)
}

main()
