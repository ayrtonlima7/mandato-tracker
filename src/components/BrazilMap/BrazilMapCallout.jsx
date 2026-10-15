import Avatar from '../Avatar/Avatar.jsx'
import { calcularPosicaoCallout } from '../../lib/calloutPosicao.js'

const TAMANHO_AVATAR = 56

// Callout com foto + aresta para estados pequenos demais para o realce de
// seleção no mapa ser suficiente (ver ESTADOS_PEQUENOS em lib/geo.js).
// Desenhado dentro do próprio <svg> do mapa para escalar junto com ele, sem
// contas de reposicionamento em pixels de tela.
export default function BrazilMapCallout({ politico }) {
  const posicao = calcularPosicaoCallout(politico.uf)
  if (!posicao) return null

  return (
    <g className="brazil-map__callout" aria-hidden="true">
      <circle className="brazil-map__callout-pino" cx={posicao.ancoraX} cy={posicao.ancoraY} r={4} />
      <line
        className="brazil-map__callout-linha"
        x1={posicao.ancoraX}
        y1={posicao.ancoraY}
        x2={posicao.x}
        y2={posicao.y}
      />
      <foreignObject
        x={posicao.x - TAMANHO_AVATAR / 2}
        y={posicao.y - TAMANHO_AVATAR / 2}
        width={TAMANHO_AVATAR}
        height={TAMANHO_AVATAR}
        style={{ overflow: 'visible' }}
      >
        <div className="brazil-map__callout-avatar">
          <Avatar nome={politico.nome} foto={politico.foto} size={TAMANHO_AVATAR} />
        </div>
      </foreignObject>
    </g>
  )
}
