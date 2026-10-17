// Municípios de uma UF (malha + nomes, IBGE) e prefeitos eleitos em 2024 (TSE),
// carregados sob demanda quando o usuário entra no estado — nada disso vai no
// bundle inicial. Cada UF é baixada no máximo uma vez por sessão (cache de
// promessas em memória); se a requisição falhar, a entrada sai do cache para
// que "Tentar novamente" refaça o download.
//
// Fontes (verificadas: ambas respondem com Access-Control-Allow-Origin: *):
//   - Malha:  IBGE API de Malhas v3, GeoJSON com uma feição por município,
//             propriedade `codarea` = código IBGE de 7 dígitos.
//   - Nomes:  IBGE API de Localidades v1 (view=nivelado: `municipio-id`/`municipio-nome`).
//   - Prefeitos: public/data/prefeitos-2024/<UF>.json, gerado por
//             scripts/data-pipeline/fetch-prefeitos.js a partir dos dados abertos do TSE.

import { ESTADOS_PEQUENOS, geradorDePath, normalizarFeature } from './geo.js'

export const UF_CODIGO_IBGE = {
  RO: 11, AC: 12, AM: 13, RR: 14, PA: 15, AP: 16, TO: 17,
  MA: 21, PI: 22, CE: 23, RN: 24, PB: 25, PE: 26, AL: 27, SE: 28, BA: 29,
  MG: 31, ES: 32, RJ: 33, SP: 35,
  PR: 41, SC: 42, RS: 43,
  MS: 50, MT: 51, GO: 52, DF: 53,
}

const IBGE_API = 'https://servicodados.ibge.gov.br/api'

export const FONTE_IBGE = {
  nome: 'IBGE — APIs de Malhas (v3) e Localidades (v1)',
  url: 'https://servicodados.ibge.gov.br/api/docs/',
}

// Lugares sem prefeito por desenho institucional (não é falta de dado).
export const SEM_PREFEITURA = {
  5300108: 'Brasília não tem prefeito(a): o Distrito Federal é administrado pelo governo distrital.',
  2605459:
    'Fernando de Noronha é um distrito estadual administrado pelo governo de Pernambuco, sem eleição para prefeito(a).',
}

// Estados pequenos ficam muito ampliados no drilldown: a malha "mínima" ficaria
// serrilhada. Neles vale pagar ~3x mais bytes pela "intermediária" (ex.: SE
// 31 KB → 81 KB); nos grandes, a mínima já basta (MG, 853 municípios: ~120 KB gzip).
export function qualidadeDaMalha(uf) {
  return ESTADOS_PEQUENOS.has(uf) ? 'intermediaria' : 'minima'
}

function codigoDaUf(uf) {
  const codigo = UF_CODIGO_IBGE[uf]
  if (!codigo) throw new Error(`UF desconhecida: "${uf}"`)
  return codigo
}

export function urlMalhaMunicipal(uf, qualidade = qualidadeDaMalha(uf)) {
  return (
    `${IBGE_API}/v3/malhas/estados/${codigoDaUf(uf)}` +
    `?formato=application/vnd.geo%2Bjson&intrarregiao=municipio&qualidade=${qualidade}`
  )
}

export function urlMunicipiosIbge(uf) {
  return `${IBGE_API}/v1/localidades/estados/${codigoDaUf(uf)}/municipios?view=nivelado`
}

// Mesmo esquema de urlDaFoto: caminho relativo + BASE_URL do Vite (GitHub Pages).
// O `?.` permite importar este módulo fora do Vite (testes, Node).
export function urlPrefeitos(uf) {
  const base = import.meta.env?.BASE_URL ?? '/'
  return `${base}data/prefeitos-2024/${uf}.json`
}

async function buscarJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${url}`)
  return res.json()
}

const cache = new Map()

function comCache(chave, carregar) {
  if (!cache.has(chave)) {
    const promessa = carregar().catch((erro) => {
      cache.delete(chave)
      throw erro
    })
    cache.set(chave, promessa)
  }
  return cache.get(chave)
}

export function limparCacheMunicipios() {
  cache.clear()
}

// Junta malha e nomes pelo código IBGE. O SVG de cada município é calculado
// uma única vez aqui (fica no cache), com a mesma projeção do mapa do Brasil.
export function montarMunicipios(malha, localidades) {
  if (!Array.isArray(malha?.features) || !Array.isArray(localidades)) {
    throw new Error('Resposta inesperada das APIs do IBGE.')
  }

  const nomePorCodigo = new Map(
    localidades.map((m) => [String(m['municipio-id']), m['municipio-nome']]),
  )
  const vistos = new Set()
  const municipios = []

  for (const feature of malha.features) {
    const codigo = String(feature.properties?.codarea ?? '')
    if (!codigo || vistos.has(codigo)) continue
    vistos.add(codigo)
    municipios.push({
      codigo,
      nome: nomePorCodigo.get(codigo) ?? `Município ${codigo}`,
      d: geradorDePath(normalizarFeature(feature)),
    })
  }

  // Município presente na lista oficial mas ausente da malha: continua
  // buscável na lista lateral, só não aparece desenhado.
  for (const [codigo, nome] of nomePorCodigo) {
    if (!vistos.has(codigo)) municipios.push({ codigo, nome, d: null })
  }

  return municipios.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

export function carregarMunicipios(uf) {
  return comCache(`municipios:${uf}`, async () => {
    const [malha, localidades] = await Promise.all([
      buscarJson(urlMalhaMunicipal(uf)),
      buscarJson(urlMunicipiosIbge(uf)),
    ])
    return montarMunicipios(malha, localidades)
  })
}

// Resolve com `null` quando a UF não tem arquivo: é "sem dados", não erro.
// "Não tem arquivo" = 404 (GitHub Pages) ou HTML no lugar do JSON (fallback de
// SPA do servidor de desenvolvimento/preview, que responde 200 com index.html).
export function carregarPrefeitos(uf) {
  // O DF não tem municípios nem eleição para prefeito: nem há o que baixar.
  if (uf === 'DF') return Promise.resolve(null)
  return comCache(`prefeitos:${uf}`, async () => {
    const res = await fetch(urlPrefeitos(uf))
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${urlPrefeitos(uf)}`)
    if (/text\/html/.test(res.headers?.get?.('content-type') ?? '')) return null
    const dados = await res.json()
    if (typeof dados?.municipios !== 'object' || dados.municipios === null) {
      throw new Error('Arquivo de prefeitos em formato inesperado.')
    }
    return dados
  })
}

// Situação do prefeito de um município, já resolvida para a interface.
export function prefeitoDoMunicipio(dadosPrefeitos, codigo) {
  if (SEM_PREFEITURA[codigo]) return { tipo: 'sem-prefeitura', mensagem: SEM_PREFEITURA[codigo] }
  if (!dadosPrefeitos) return { tipo: 'sem-dados' }
  const registro = dadosPrefeitos.municipios[codigo]
  if (registro) return { tipo: 'eleito', registro }
  if (dadosPrefeitos.semEleito?.includes(codigo)) return { tipo: 'sem-eleito' }
  return { tipo: 'nao-encontrado' }
}

export function normalizarBusca(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function filtrarMunicipios(municipios, termo) {
  const alvo = normalizarBusca(termo)
  if (!alvo) return municipios
  return municipios.filter((m) => normalizarBusca(m.nome).includes(alvo))
}

const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'd'])

// O TSE publica nomes em CAIXA ALTA; só a exibição é ajustada (o dado fica intacto).
export function formatarNomeProprio(nome) {
  return String(nome ?? '')
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((parte, i) => {
      if (!parte.trim() || parte === '-') return parte
      if (i > 0 && PARTICULAS.has(parte)) return parte
      return parte.charAt(0).toUpperCase() + parte.slice(1)
    })
    .join('')
}

export function formatarDataIso(iso) {
  if (!iso) return null
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}
