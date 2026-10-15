import Avatar from '../Avatar/Avatar.jsx'
import { calcularPosicaoFoto } from '../../lib/calloutPosicao.js'

const TAMANHO_AVATAR = 56

// Foto do político selecionado sobre o mapa.
//   - Estado grande: foto centralizada DENTRO do estado.
//   - Estado pequeno: foto FORA do país (margem do mapa) com aresta/linha até o estado.
// Desenhado dentro do próprio <svg> para escalar junto com o mapa.
export default function BrazilMapCallout({ politico }) {
  const posicao = calcularPosicaoFoto(politico.uf, TAMANHO_AVATAR)
  if (!posicao) return null

  return (
    <g className="brazil-map__callout" aria-hidden="true">
      {!posicao.dentro && (
        <>
          <circle
            className="brazil-map__callout-pino"
            cx={posicao.ancoraX}
            cy={posicao.ancoraY}
            r={4}
          />
          <line
            className="brazil-map__callout-linha"
            x1={posicao.ancoraX}
            y1={posicao.ancoraY}
            x2={posicao.x}
            y2={posicao.y}
          />
        </>
      )}
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
