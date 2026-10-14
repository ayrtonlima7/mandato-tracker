import { hierarchy, tree } from 'd3-hierarchy'

export const CARD_WIDTH = 216
export const CARD_HEIGHT = 128
export const LEVEL_HEIGHT = 190
export const SIBLING_GAP = 36

// Remove os filhos de nós colapsados ANTES de montar a hierarquia do D3, para
// que a subárvore escondida não continue reservando espaço horizontal no
// layout (d3 tree() calcula largura com base em quem está em `children`).
function pruneCollapsed(node, collapsedIds) {
  const temChilhos = (node.filhos?.length ?? 0) > 0
  const colapsado = collapsedIds.has(node.id)
  return {
    ...node,
    hasChildren: temChilhos,
    collapsed: colapsado,
    filhos: !temChilhos || colapsado ? [] : node.filhos.map((child) => pruneCollapsed(child, collapsedIds)),
  }
}

// Função pura: dado os dados hierárquicos e o conjunto de ids colapsados,
// devolve nós já posicionados (x, y) e links prontos para desenhar.
// Sem JSX, sem CSS — pode ser testada isoladamente (ver scripts/validate-data.mjs).
export function buildLayout(data, collapsedIds = new Set()) {
  const pruned = pruneCollapsed(data, collapsedIds)
  const root = hierarchy(pruned, (d) => d.filhos)

  // Separação padrão do d3 dobra o espaço entre primos (2x vs. 1x entre
  // irmãos). Numa árvore de 5 níveis isso infla muito a largura total;
  // reduzimos para 1.15x para caber mais política em menos espaço.
  const layoutFn = tree()
    .nodeSize([CARD_WIDTH + SIBLING_GAP, LEVEL_HEIGHT])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.15))
  layoutFn(root)

  const descendants = root.descendants()

  let minX = 0
  let maxX = 0
  let maxY = 0
  descendants.forEach((d, i) => {
    if (i === 0 || d.x < minX) minX = d.x
    if (i === 0 || d.x > maxX) maxX = d.x
    if (d.y > maxY) maxY = d.y
  })

  const paddingX = CARD_WIDTH / 2 + SIBLING_GAP
  const paddingY = CARD_HEIGHT / 2 + 48
  const offsetX = -minX + paddingX

  const nodes = descendants.map((d) => ({
    id: d.data.id,
    data: d.data,
    depth: d.depth,
    hasChildren: d.data.hasChildren,
    collapsed: d.data.collapsed,
    x: d.x + offsetX,
    y: d.y + paddingY,
  }))

  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  const links = root.links().map((l) => ({
    id: `${l.source.data.id}__${l.target.data.id}`,
    source: nodeById.get(l.source.data.id),
    target: nodeById.get(l.target.data.id),
  }))

  return {
    nodes,
    links,
    width: maxX - minX + paddingX * 2,
    height: maxY + paddingY * 2,
  }
}
