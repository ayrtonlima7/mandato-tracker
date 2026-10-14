// Validação da integridade dos dados mock e do layout da árvore.
// Não substitui testes de UI — roda no Node, sem navegador, antes do build.
import { mandateTree, STATUS } from '../src/data/mandateData.js'
import { buildLayout } from '../src/lib/layout.js'
import { flattenTree } from '../src/lib/tree.js'

const erros = []
const assert = (cond, msg) => {
  if (!cond) erros.push(msg)
}

const todos = flattenTree(mandateTree)

const ids = todos.map((n) => n.id)
assert(new Set(ids).size === ids.length, 'Existem ids duplicados na árvore.')

const ministros = mandateTree.filhos
const secretarios = ministros.flatMap((m) => m.filhos ?? [])
const prefeitos = secretarios.flatMap((s) => s.filhos ?? [])
const vereadores = prefeitos.flatMap((p) => p.filhos ?? [])

assert(ministros.length === 5, `Esperado 5 ministros, encontrado ${ministros.length}.`)

for (const ministro of ministros) {
  const n = ministro.filhos?.length ?? 0
  assert(n >= 2 && n <= 3, `Ministro "${ministro.nome}" deveria ter 2-3 secretários, tem ${n}.`)
}

assert(prefeitos.length === 2, `Esperado 2 prefeitos, encontrado ${prefeitos.length}.`)
assert(
  vereadores.length >= 3 && vereadores.length <= 4,
  `Esperado 3-4 vereadores, encontrado ${vereadores.length}.`,
)

for (const pessoa of todos) {
  const n = pessoa.planos?.length ?? 0
  const min = pessoa.id === 'lula' ? 5 : 3
  const max = pessoa.id === 'lula' ? 7 : 5
  assert(n >= min && n <= max, `"${pessoa.nome}" tem ${n} planos (esperado ${min}-${max}).`)

  for (const plano of pessoa.planos ?? []) {
    if (plano.status === STATUS.CONCLUIDO) {
      assert(
        plano.progresso === 100,
        `Plano "${plano.titulo}" concluído deveria ter 100%, tem ${plano.progresso}%.`,
      )
    }
    if (plano.status === STATUS.NAO_INICIADO) {
      assert(
        plano.progresso === 0,
        `Plano "${plano.titulo}" não iniciado deveria ter 0%, tem ${plano.progresso}%.`,
      )
    }
    if (plano.status === STATUS.ABANDONADO) {
      assert(
        plano.progresso > 0 && plano.progresso < 100,
        `Plano "${plano.titulo}" abandonado deveria ter progresso parcial, tem ${plano.progresso}%.`,
      )
    }
  }
}

const layoutCompleto = buildLayout(mandateTree, new Set())
assert(
  Number.isFinite(layoutCompleto.width) && Number.isFinite(layoutCompleto.height),
  'Largura/altura do layout completo inválidas.',
)
for (const node of layoutCompleto.nodes) {
  assert(Number.isFinite(node.x) && Number.isFinite(node.y), `Nó "${node.id}" com coordenadas inválidas.`)
}
for (const link of layoutCompleto.links) {
  assert(Boolean(link.source) && Boolean(link.target), `Link "${link.id}" com extremidade ausente.`)
}
assert(layoutCompleto.nodes.length === todos.length, 'Layout completo perdeu ou duplicou nós.')

const idsMinistros = new Set(ministros.map((m) => m.id))
const layoutColapsado = buildLayout(mandateTree, idsMinistros)
assert(
  layoutColapsado.nodes.length === 1 + ministros.length,
  'Colapsar todos os ministros deveria esconder todos os seus descendentes.',
)

if (erros.length > 0) {
  console.error(`Validação falhou com ${erros.length} problema(s):`)
  for (const e of erros) console.error(` - ${e}`)
  process.exit(1)
}

const totalPlanos = todos.reduce((acc, p) => acc + (p.planos?.length ?? 0), 0)
console.log(
  `OK — ${todos.length} políticos (${ministros.length} ministros, ${secretarios.length} secretários, ${prefeitos.length} prefeitos, ${vereadores.length} vereadores), ${totalPlanos} planos de mandato, layout sem NaN.`,
)

function escalaParaViewport(layout, viewportW, viewportH) {
  const escala = Math.min((viewportW - 48) / layout.width, (viewportH - 48) / layout.height)
  return Math.max(0.25, Math.min(1.1, escala))
}

console.log(
  `Layout completo (23 nós): ${Math.round(layoutCompleto.width)}x${Math.round(layoutCompleto.height)}px` +
    ` — escala em 1440x800: ${escalaParaViewport(layoutCompleto, 1440, 800).toFixed(2)}`,
)
console.log(
  `Layout inicial (ministros colapsados, ${layoutColapsado.nodes.length} nós): ` +
    `${Math.round(layoutColapsado.width)}x${Math.round(layoutColapsado.height)}px` +
    ` — escala em 1440x800: ${escalaParaViewport(layoutColapsado, 1440, 800).toFixed(2)}`,
)
