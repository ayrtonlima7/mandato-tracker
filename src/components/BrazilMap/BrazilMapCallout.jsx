import { colorFromName, initialsFromName } from '../../lib/avatar.js'
import { calcularPosicaoFoto } from '../../lib/calloutPosicao.js'

const TAMANHO_AVATAR = 56

// Renderização totalmente SVG (sem foreignObject): evita incompatibilidades de
// namespace/DOM ao inserir HTML do Avatar dentro do mapa SVG.
export default function BrazilMapCallout({ politico }) {
  const posicao = calcularPosicaoFoto(politico.uf, TAMANHO_AVATAR)
  if (!posicao) return null

  const clipId = `foto-${String(politico.id).replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const r = TAMANHO_AVATAR / 2
  const bg = colorFromName(politico.nome)

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
      <defs>
        <clipPath id={clipId}>
          <circle cx={posicao.x} cy={posicao.y} r={r - 2} />
        </clipPath>
      </defs>
      <circle
        className="brazil-map__callout-fundo"
        cx={posicao.x}
        cy={posicao.y}
        r={r}
        fill={politico.foto ? 'var(--cor-papel-card)' : bg}
      />
      {politico.foto ? (
        <image
          href={politico.foto}
          x={posicao.x - r + 2}
          y={posicao.y - r + 2}
          width={TAMANHO_AVATAR - 4}
          height={TAMANHO_AVATAR - 4}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      ) : (
        <text
          className="brazil-map__callout-iniciais"
          x={posicao.x}
          y={posicao.y}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {initialsFromName(politico.nome)}
        </text>
      )}
      <circle
        className="brazil-map__callout-contorno"
        cx={posicao.x}
        cy={posicao.y}
        r={r - 1}
      />
    </g>
  )
}
