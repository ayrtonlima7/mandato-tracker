import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { select } from 'd3-selection'
import { zoom as d3zoom, zoomIdentity } from 'd3-zoom'
import 'd3-transition' // side-effect: habilita selection.transition() usado pelos botões de zoom
import PoliticianCard from '../PoliticianCard/PoliticianCard.jsx'
import MandateDrawer from '../MandateDrawer/MandateDrawer.jsx'
import ZoomControls from '../ZoomControls/ZoomControls.jsx'
import { buildLayout, CARD_HEIGHT, CARD_WIDTH } from '../../lib/layout.js'
import { sketchyPath } from '../../lib/sketchy.js'
import { flattenTree } from '../../lib/tree.js'
import './OrgChart.css'

// Começa com todo nó que tem filhos recolhido (exceto a raiz): mostrar as 23
// pessoas de uma vez deixa os cards ilegíveis no primeiro paint, e recolher
// só os ministros faria o primeiro "+" revelar a subárvore inteira deles de
// uma vez. Assim cada clique expande exatamente um nível por vez.
function colapsoInicial(data) {
  return new Set(
    flattenTree(data)
      .filter((n) => n.id !== data.id && (n.filhos?.length ?? 0) > 0)
      .map((n) => n.id),
  )
}

export default function OrgChart({ data }) {
  const [collapsedIds, setCollapsedIds] = useState(() => colapsoInicial(data))
  const [selecionado, setSelecionado] = useState(null)

  const viewportRef = useRef(null)
  const innerRef = useRef(null)
  const zoomBehaviorRef = useRef(null)
  const anchorRef = useRef(null)

  const { nodes, links, width, height } = useMemo(
    () => buildLayout(data, collapsedIds),
    [data, collapsedIds],
  )

  function toggleCollapse(id) {
    const atual = nodes.find((n) => n.id === id)
    if (atual) anchorRef.current = { id, x: atual.x, y: atual.y }

    setCollapsedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function fitToScreen(animate) {
    const viewport = viewportRef.current
    const zoomBehavior = zoomBehaviorRef.current
    if (!viewport || !zoomBehavior) return

    const rect = viewport.getBoundingClientRect()
    const rawScale = Math.min((rect.width - 48) / width, (rect.height - 48) / height)
    const scale = Math.max(0.25, Math.min(1.1, rawScale || 1))
    const tx = (rect.width - width * scale) / 2
    const ty = 32

    const transform = zoomIdentity.translate(tx, ty).scale(scale)
    const selection = select(viewport)
    if (animate) {
      selection.transition().duration(300).call(zoomBehavior.transform, transform)
    } else {
      selection.call(zoomBehavior.transform, transform)
    }
  }

  // Zoom/pan via d3-zoom: a transformação é escrita direto no DOM através da
  // ref (innerRef), nunca em state do React, para não re-renderizar a árvore
  // inteira a cada frame de zoom/pan.
  useEffect(() => {
    const viewport = viewportRef.current
    const inner = innerRef.current
    if (!viewport || !inner) return

    const zoomBehavior = d3zoom()
      .scaleExtent([0.25, 1.75])
      .filter(
        (event) =>
          (!event.ctrlKey || event.type === 'wheel') &&
          !event.button &&
          (event.type === 'wheel' || !event.target.closest('button, .politician-card')),
      )
      .on('zoom', (event) => {
        const t = event.transform
        inner.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.k})`
      })

    zoomBehaviorRef.current = zoomBehavior
    select(viewport).call(zoomBehavior)

    return () => {
      select(viewport).on('.zoom', null)
    }
  }, [])

  useEffect(() => {
    fitToScreen(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Ao expandir/recolher, o nó clicado pode mudar de posição (x,y) porque o
  // layout inteiro é recalculado. Sem isso, a árvore "salta" embaixo do
  // cursor. Compensamos com um pan igual à diferença de posição do mesmo nó.
  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    anchorRef.current = null

    const novo = nodes.find((n) => n.id === anchor.id)
    const zoomBehavior = zoomBehaviorRef.current
    const viewport = viewportRef.current
    if (!novo || !zoomBehavior || !viewport) return

    const dx = anchor.x - novo.x
    const dy = anchor.y - novo.y
    if (dx !== 0 || dy !== 0) {
      select(viewport).call(zoomBehavior.translateBy, dx, dy)
    }
  }, [nodes])

  return (
    <div className="org-chart">
      <div className="org-chart__viewport" ref={viewportRef}>
        <div className="org-chart__inner" ref={innerRef} style={{ width, height }}>
          <svg className="org-chart__svg" width={width} height={height}>
            {links.map((link) => {
              const x1 = link.source.x
              const y1 = link.source.y + CARD_HEIGHT / 2
              const x2 = link.target.x
              const y2 = link.target.y - CARD_HEIGHT / 2
              return (
                <g key={link.id} className="org-chart__link">
                  <path
                    className="org-chart__link-sombra"
                    d={sketchyPath(x1 + 2, y1 + 2, x2 + 2, y2 + 2, `${link.id}__sombra`)}
                  />
                  <path d={sketchyPath(x1, y1, x2, y2, link.id)} />
                </g>
              )
            })}
          </svg>

          {nodes.map((node) => (
            <div
              key={node.id}
              className="org-chart__node"
              style={{ left: node.x - CARD_WIDTH / 2, top: node.y - CARD_HEIGHT / 2 }}
            >
              <PoliticianCard
                politico={node.data}
                hasChildren={node.hasChildren}
                collapsed={node.collapsed}
                onToggleCollapse={toggleCollapse}
                onAbrirPlanos={setSelecionado}
              />
            </div>
          ))}
        </div>
      </div>

      <ZoomControls
        onZoomIn={() =>
          select(viewportRef.current).transition().call(zoomBehaviorRef.current.scaleBy, 1.25)
        }
        onZoomOut={() =>
          select(viewportRef.current).transition().call(zoomBehaviorRef.current.scaleBy, 0.8)
        }
        onCenter={() => fitToScreen(true)}
      />

      <MandateDrawer politico={selecionado} onClose={() => setSelecionado(null)} />
    </div>
  )
}
