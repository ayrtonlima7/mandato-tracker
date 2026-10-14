// Valida a integridade dos dados reais (presidente + governadores + propostas + notícias).
// Roda no Node, sem navegador, antes do build.
import { mandateTree, STATUS } from '../src/data/mandateData.js'

const erros = []
const assert = (cond, msg) => {
  if (!cond) erros.push(msg)
}

const STATUS_VALIDOS = new Set([STATUS.CUMPRIU, STATUS.EM_PARTE, STATUS.NAO_CUMPRIU])
const UFS = new Set([
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI',
  'RJ','RN','RS','RO','RR','SC','SP','SE','TO',
])

// 1) Achata a árvore (presidente → regiões → governadores)
const regioes = mandateTree.filhos ?? []
const governadores = regioes.flatMap((r) => r.filhos ?? [])
const politicos = [mandateTree, ...governadores]

// 2) Regiões têm marcador tipo='regiao'
for (const r of regioes) {
  assert(r.tipo === 'regiao', `Nó "${r.nome}" deveria ter tipo='regiao'.`)
  assert((r.filhos ?? []).length > 0, `Região "${r.nome}" sem governadores.`)
}

// 3) Presidente é a raiz, sem UF
assert(mandateTree.uf === null, 'O presidente deveria ter uf=null.')
assert(governadores.length === 27, `Esperado 27 governadores, encontrado ${governadores.length}.`)

// 4) UF válidas e únicas entre governadores
const ufs = governadores.map((g) => g.uf)
assert(new Set(ufs).size === ufs.length, 'Existem UFs duplicadas entre governadores.')
for (const uf of ufs) {
  assert(UFS.has(uf), `UF inválida: "${uf}".`)
}

// 5) Ids únicos
const ids = politicos.map((p) => p.id)
assert(new Set(ids).size === ids.length, 'Existem ids duplicados.')

// 6) Campos obrigatórios e status/propostas válidos
for (const p of politicos) {
  assert(p.nome, `Político "${p.id}" sem nome.`)
  assert(p.cargo, `"${p.nome}" sem cargo.`)
  assert(p.mandato?.inicio && p.mandato?.fim, `"${p.nome}" sem mandato completo.`)
  assert(p.propostas.length > 0, `"${p.nome}" não tem propostas.`)

  for (const prop of p.propostas) {
    assert(prop.titulo, `Proposta sem título em "${p.nome}".`)
    assert(STATUS_VALIDOS.has(prop.status), `"${p.nome}": status inválido "${prop.status}" em "${prop.titulo}".`)
    for (const n of prop.atualizacoes ?? []) {
      assert(n.url && n.titulo, `Notícia sem url/título em "${p.nome}" → "${prop.titulo}".`)
    }
  }

  for (const n of p.noticiasGerais ?? []) {
    assert(n.url && n.titulo, `Notícia geral sem url/título em "${p.nome}".`)
  }
}

if (erros.length) {
  console.error(`❌ ${erros.length} erro(s):`)
  for (const e of erros) console.error('  - ' + e)
  process.exit(1)
}

const totalPropostas = politicos.reduce((s, p) => s + p.propostas.length, 0)
const totalNoticias = politicos.reduce(
  (s, p) =>
    s +
    (p.noticiasGerais?.length ?? 0) +
    p.propostas.reduce((s2, x) => s2 + x.atualizacoes.length, 0),
  0,
)
console.log(
  `✅ Dados válidos: 1 presidente + ${governadores.length} governadores | ${totalPropostas} propostas | ${totalNoticias} notícias.`,
)
