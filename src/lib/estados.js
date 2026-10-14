import { mandateTree } from '../data/mandateData.js'
import { flattenTree } from './tree.js'

export const UF_NOME = {
  AC: 'Acre',
  AL: 'Alagoas',
  AM: 'Amazonas',
  AP: 'Amapá',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MG: 'Minas Gerais',
  MS: 'Mato Grosso do Sul',
  MT: 'Mato Grosso',
  PA: 'Pará',
  PB: 'Paraíba',
  PE: 'Pernambuco',
  PI: 'Piauí',
  PR: 'Paraná',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RO: 'Rondônia',
  RR: 'Roraima',
  RS: 'Rio Grande do Sul',
  SC: 'Santa Catarina',
  SE: 'Sergipe',
  SP: 'São Paulo',
  TO: 'Tocantins',
}

// Tons sutis derivados da paleta Excalidraw do projeto (azul-marinho/creme/
// marrom), um por região. Mantidos fracos de propósito: o realce de
// hover/seleção é quem deve chamar atenção, não a cor-base.
export const REGIAO_COR = {
  'Região Norte': { base: '#cdddce', hover: '#b7cdb9' },
  'Região Nordeste': { base: '#e6d9bd', hover: '#dcc89f' },
  'Região Centro-Oeste': { base: '#dccfb9', hover: '#cdbb9d' },
  'Região Sudeste': { base: '#cad4e2', hover: '#b2c1d6' },
  'Região Sul': { base: '#d9cdd6', hover: '#c7b3c2' },
}

const COR_PADRAO = { base: '#d8d2c4', hover: '#c7bfac' }

export function corDaRegiao(nomeRegiao) {
  return REGIAO_COR[nomeRegiao] ?? COR_PADRAO
}

// Construído a partir da própria mandateTree (nós tipo 'regiao' → seus
// descendentes com uf), em vez de hardcoded: qualquer cargo futuro que o
// pipeline encaixe em algum lugar da subárvore de uma região já aparece aqui
// automaticamente, sem precisar editar este arquivo.
function construirMapasPorUf() {
  const regiaoPorUf = new Map()
  const politicosPorUf = new Map()

  for (const regiao of mandateTree.filhos ?? []) {
    if (regiao.tipo !== 'regiao') continue
    for (const node of flattenTree(regiao)) {
      if (node === regiao || !node.uf) continue
      regiaoPorUf.set(node.uf, regiao.nome)
      if (!politicosPorUf.has(node.uf)) politicosPorUf.set(node.uf, [])
      politicosPorUf.get(node.uf).push(node)
    }
  }

  return { regiaoPorUf, politicosPorUf }
}

export const { regiaoPorUf, politicosPorUf } = construirMapasPorUf()

// Tabela ordenada de categorias de cargo. Os dados reais trazem o cargo como
// string livre ("Governador do Acre", "Governadora de Pernambuco"), então o
// agrupamento é por prefixo (regex), não por igualdade exata. Pensada para
// comportar senador/deputado/prefeito/vereador quando o pipeline passar a
// gerar esses cargos, sem precisar reescrever a função de agrupamento.
const CATEGORIAS_CARGO = [
  { chave: 'presidente', rotulo: 'Presidente', re: /^presidente/i },
  { chave: 'governador', rotulo: 'Governador', re: /^governador/i },
  { chave: 'vice-governador', rotulo: 'Vice-governador', re: /^vice-governador/i },
  { chave: 'senador', rotulo: 'Senador', re: /^senador/i },
  { chave: 'deputado-federal', rotulo: 'Deputado Federal', re: /^deputad[oa] federal/i },
  { chave: 'deputado-estadual', rotulo: 'Deputado Estadual', re: /^deputad[oa] estadual/i },
  { chave: 'prefeito', rotulo: 'Prefeito', re: /^prefeit/i },
  { chave: 'vereador', rotulo: 'Vereador', re: /^vereador/i },
]

function categoriaDoCargo(cargo) {
  return CATEGORIAS_CARGO.find((categoria) => categoria.re.test(cargo ?? '')) ?? null
}

export function agruparPorCargo(politicos) {
  const grupos = new Map()

  for (const politico of politicos ?? []) {
    const categoria = categoriaDoCargo(politico.cargo)
    const chave = categoria?.chave ?? politico.cargo
    const rotulo = categoria?.rotulo ?? politico.cargo
    if (!grupos.has(chave)) grupos.set(chave, { chave, rotulo, itens: [] })
    grupos.get(chave).itens.push(politico)
  }

  const ordemConhecida = CATEGORIAS_CARGO.map((categoria) => categoria.chave)
  return [...grupos.values()].sort((a, b) => {
    const ia = ordemConhecida.indexOf(a.chave)
    const ib = ordemConhecida.indexOf(b.chave)
    if (ia === -1 && ib === -1) return a.rotulo.localeCompare(b.rotulo, 'pt-BR')
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}

// Rótulo "Governador, Senador, ..." por UF, pré-computado uma única vez:
// tooltip e aria-label do mapa leem este Map em vez de chamar
// agruparPorCargo() a cada hover.
export const CARGOS_LABEL_POR_UF = new Map(
  [...politicosPorUf.entries()].map(([uf, lista]) => [
    uf,
    agruparPorCargo(lista)
      .map((grupo) => grupo.rotulo)
      .join(', ') || 'Sem políticos cadastrados',
  ]),
)
