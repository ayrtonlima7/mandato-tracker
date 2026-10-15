import { useState } from 'react'
import Avatar from '../Avatar/Avatar.jsx'
import BrazilMapCallout from './BrazilMapCallout.jsx'
import { ESTADOS, ESTADOS_PEQUENOS, MAPA_LARGURA, MAPA_ALTURA, PATH_POR_UF } from '../../lib/geo.js'
import { UF_NOME, regiaoPorUf, corDaRegiao, CARGOS_LABEL_POR_UF } from '../../lib/estados.js'
import './BrazilMap.css'

export default function BrazilMap({
  ufSelecionada,
  onSelecionarUf,
  presidente,
  presidenteSelecionado,
  onSelecionarPresidente,
  politicoSelecionado,
}) {
  const [ufHover, setUfHover] = useState(null)
  const [mousePos, setMousePos] = useState(null)

  return (
    <div
      className="brazil-map"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }}
    >
      <svg
        className="brazil-map__svg"
        viewBox={`0 0 ${MAPA_LARGURA} ${MAPA_ALTURA}`}
        role="group"
        aria-label="Mapa do Brasil por estado"
      >
        <g className="brazil-map__sombra">
          {ESTADOS.map(({ uf, d }) => (
            <path key={uf} d={d} />
          ))}
        </g>

        <g>
          {ESTADOS.map(({ uf, d }) => {
            const cor = corDaRegiao(regiaoPorUf.get(uf))
            const selecionado = uf === ufSelecionada
            const hover = uf === ufHover

            return (
              <path
                key={uf}
                d={d}
                className={[
                  'brazil-map__estado',
                  selecionado && 'brazil-map__estado--selecionado',
                  hover && 'brazil-map__estado--hover',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ fill: hover ? cor.hover : cor.base }}
                role="button"
                tabIndex={0}
                aria-label={`${UF_NOME[uf]} — ${CARGOS_LABEL_POR_UF.get(uf)}`}
                onMouseEnter={() => setUfHover(uf)}
                onMouseLeave={() => setUfHover((v) => (v === uf ? null : v))}
                onClick={() => onSelecionarUf(uf)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelecionarUf(uf)
                  }
                }}
              />
            )
          })}
        </g>

        {/* Área de toque ampliada para os estados pequenos (DF, SE, AL...):
            um traço largo e invisível por cima do caminho real, hit-testável
            só em telas de toque (onde o dedo é mais impreciso que o mouse). */}
        <g className="brazil-map__tap-targets" aria-hidden="true">
          {ESTADOS.map(({ uf, d }) => {
            if (!ESTADOS_PEQUENOS.has(uf)) return null
            return (
              <path
                key={uf}
                d={d}
                className="brazil-map__estado-tap"
                onClick={() => onSelecionarUf(uf)}
              />
            )
          })}
        </g>

        {/* Camada de realce desenhada por cima: evita que o traço grosso do
            estado selecionado/hover fique coberto pelos vizinhos. */}
        {(ufSelecionada || ufHover) && (
          <g className="brazil-map__realce" aria-hidden="true">
            {ufSelecionada && ufSelecionada !== ufHover && (
              <path
                className="brazil-map__estado-realce brazil-map__estado-realce--selecionado"
                d={PATH_POR_UF.get(ufSelecionada)}
              />
            )}
            {ufHover && (
              <path
                className={[
                  'brazil-map__estado-realce',
                  ufHover === ufSelecionada
                    ? 'brazil-map__estado-realce--selecionado'
                    : 'brazil-map__estado-realce--hover',
                ].join(' ')}
                d={PATH_POR_UF.get(ufHover)}
              />
            )}
          </g>
        )}

        {politicoSelecionado?.uf && <BrazilMapCallout politico={politicoSelecionado} />}
      </svg>

      {ufHover && mousePos && (
        <div className="brazil-map__tooltip" style={{ left: mousePos.x, top: mousePos.y }}>
          <strong>{UF_NOME[ufHover]}</strong>
          <span>{CARGOS_LABEL_POR_UF.get(ufHover)}</span>
        </div>
      )}

      <div className="brazil-map__legenda">
        {['Região Norte', 'Região Nordeste', 'Região Centro-Oeste', 'Região Sudeste', 'Região Sul'].map(
          (nome) => (
            <span key={nome} className="brazil-map__legenda-item">
              <i style={{ backgroundColor: corDaRegiao(nome).base }} />
              {nome.replace('Região ', '')}
            </span>
          ),
        )}
      </div>

      <button
        type="button"
        className={`brazil-map__presidente ${
          presidenteSelecionado ? 'brazil-map__presidente--selecionado' : ''
        }`}
        onClick={onSelecionarPresidente}
        aria-label={`Selecionar ${presidente.nome}, ${presidente.cargo}`}
      >
        <Avatar nome={presidente.nome} foto={presidente.foto} size={56} />
        <span className="brazil-map__presidente-nome">{presidente.nome}</span>
        <small className="brazil-map__presidente-cargo">{presidente.cargo}</small>
      </button>
    </div>
  )
}
