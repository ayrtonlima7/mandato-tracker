import { memo, useEffect, useMemo, useRef, useState } from 'react'
import Avatar from '../Avatar/Avatar.jsx'
import BrazilMapCallout from './BrazilMapCallout.jsx'
import {
  ESTADOS,
  ESTADOS_PEQUENOS,
  MAPA_LARGURA,
  MAPA_ALTURA,
  PATH_POR_UF,
  transformParaUf,
} from '../../lib/geo.js'
import { UF_NOME, regiaoPorUf, corDaRegiao, CARGOS_LABEL_POR_UF } from '../../lib/estados.js'
import { formatarNomeProprio, prefeitoDoMunicipio } from '../../lib/municipios.js'
import './BrazilMap.css'

const SEM_ZOOM = { k: 1, tx: 0, ty: 0 }

// Até 853 caminhos (MG): memoizado para não re-renderizar a cada onMouseMove
// do mapa. Hover/clique chegam por delegação no <g> pai (data-codigo), então
// esta camada não depende de nenhum handler nem do estado de hover.
const CamadaMunicipios = memo(function CamadaMunicipios({ municipios, cor }) {
  return municipios.map(({ codigo, d }) =>
    d ? (
      <path
        key={codigo}
        d={d}
        data-codigo={codigo}
        className="brazil-map__municipio"
        style={{ fill: cor }}
      />
    ) : null,
  )
})

function codigoDoEvento(e) {
  return e.target.getAttribute?.('data-codigo') ?? null
}

export default function BrazilMap({
  ufSelecionada,
  onSelecionarUf,
  presidente,
  presidenteSelecionado,
  onSelecionarPresidente,
  politicoSelecionado,
  municipios,
  prefeitos,
  municipioSelecionado,
  onSelecionarMunicipio,
  onRecarregarMunicipios,
  onVoltarAoBrasil,
  onAbrirListaMunicipios,
}) {
  const [ufHover, setUfHover] = useState(null)
  const [municipioHover, setMunicipioHover] = useState(null)
  const [mousePos, setMousePos] = useState(null)
  const svgRef = useRef(null)
  const voltarRef = useRef(null)
  const ufAnteriorRef = useRef(null)

  const drilldown = Boolean(ufSelecionada)

  // Foco no teclado: ao entrar no estado, o caminho focado vira aria-hidden e
  // sai do Tab — o foco vai para "Voltar". Ao voltar, o botão some — o foco
  // retorna ao estado de onde o usuário saiu.
  useEffect(() => {
    const ativo = document.activeElement
    const focoPerdido = !ativo || ativo === document.body
    if (ufSelecionada) {
      if (focoPerdido || svgRef.current?.contains(ativo)) voltarRef.current?.focus()
    } else if (ufAnteriorRef.current && focoPerdido) {
      svgRef.current?.querySelector(`[data-uf="${ufAnteriorRef.current}"]`)?.focus()
    }
    ufAnteriorRef.current = ufSelecionada
  }, [ufSelecionada])
  const zoom = drilldown ? transformParaUf(ufSelecionada) : SEM_ZOOM

  // Só desenha municípios da UF em foco (o hook mantém a UF anterior durante
  // a saída do drilldown, e ela não deve aparecer por cima do Brasil).
  const municipiosProntos =
    drilldown && municipios?.uf === ufSelecionada && municipios.status === 'pronto'
  const listaMunicipios = municipiosProntos ? municipios.dados : null
  const municipioPorCodigo = useMemo(
    () => new Map((listaMunicipios ?? []).map((m) => [m.codigo, m])),
    [listaMunicipios],
  )
  const prefeitosDaUf =
    prefeitos?.uf === ufSelecionada && prefeitos.status === 'pronto' ? prefeitos : null

  const corDoEstado = drilldown ? corDaRegiao(regiaoPorUf.get(ufSelecionada)) : null
  const hoverAtual = municipioHover ? municipioPorCodigo.get(municipioHover) : null
  const selecionadoAtual = municipioSelecionado ? municipioPorCodigo.get(municipioSelecionado) : null

  let mensagemStatus = ''
  if (drilldown && municipios?.uf === ufSelecionada) {
    const nomeUf = UF_NOME[ufSelecionada]
    if (municipios.status === 'carregando') mensagemStatus = `Carregando municípios de ${nomeUf}…`
    else if (municipios.status === 'erro') mensagemStatus = 'Não foi possível carregar os municípios.'
    else if (municipios.status === 'pronto')
      mensagemStatus = `${nomeUf}: ${municipios.dados.length} municípios no mapa.`
  }

  // O mouse está sobre o estado no momento do clique e, já no drilldown, os
  // estados deixam de ter onMouseLeave: sem limpar aqui o hover ficaria preso.
  function selecionarUf(uf) {
    setUfHover(null)
    setMunicipioHover(null)
    onSelecionarUf(uf)
  }

  function descricaoPrefeito(codigo) {
    if (!prefeitosDaUf) return null
    const situacao = prefeitoDoMunicipio(prefeitosDaUf.dados, codigo)
    if (situacao.tipo !== 'eleito') return null
    const { nomeUrna, partido } = situacao.registro
    return `Eleito(a) em 2024: ${formatarNomeProprio(nomeUrna)}${partido ? ` (${partido})` : ''}`
  }

  return (
    <div
      className={`brazil-map ${drilldown ? 'brazil-map--drilldown' : ''}`}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }}
    >
      <svg
        ref={svgRef}
        className="brazil-map__svg"
        viewBox={`0 0 ${MAPA_LARGURA} ${MAPA_ALTURA}`}
        role="group"
        aria-label={
          drilldown ? `Mapa de ${UF_NOME[ufSelecionada]} por município` : 'Mapa do Brasil por estado'
        }
      >
        <g
          className="brazil-map__zoom"
          style={{ transform: `translate(${zoom.tx}px, ${zoom.ty}px) scale(${zoom.k})` }}
        >
          <g className="brazil-map__sombra">
            {ESTADOS.map(({ uf, d }) => (
              <path key={uf} d={d} />
            ))}
          </g>

          <g aria-hidden={drilldown || undefined}>
            {ESTADOS.map(({ uf, d }) => {
              const cor = corDaRegiao(regiaoPorUf.get(uf))
              const selecionado = uf === ufSelecionada
              const hover = !drilldown && uf === ufHover

              return (
                <path
                  key={uf}
                  d={d}
                  data-uf={uf}
                  className={[
                    'brazil-map__estado',
                    selecionado && 'brazil-map__estado--selecionado',
                    hover && 'brazil-map__estado--hover',
                    drilldown && !selecionado && 'brazil-map__estado--contexto',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  style={{ fill: hover ? cor.hover : cor.base }}
                  {...(drilldown
                    ? { tabIndex: -1 }
                    : {
                        role: 'button',
                        tabIndex: 0,
                        'aria-label': `${UF_NOME[uf]} — ${CARGOS_LABEL_POR_UF.get(uf)}`,
                        onMouseEnter: () => setUfHover(uf),
                        onMouseLeave: () => setUfHover((v) => (v === uf ? null : v)),
                        onClick: () => selecionarUf(uf),
                        onKeyDown: (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            selecionarUf(uf)
                          }
                        },
                      })}
                />
              )
            })}
          </g>

          {/* Área de toque ampliada para os estados pequenos (DF, SE, AL...):
              um traço largo e invisível por cima do caminho real, hit-testável
              só em telas de toque (onde o dedo é mais impreciso que o mouse). */}
          {!drilldown && (
            <g className="brazil-map__tap-targets" aria-hidden="true">
              {ESTADOS.map(({ uf, d }) => {
                if (!ESTADOS_PEQUENOS.has(uf)) return null
                return (
                  <path
                    key={uf}
                    d={d}
                    className="brazil-map__estado-tap"
                    onClick={() => selecionarUf(uf)}
                  />
                )
              })}
            </g>
          )}

          {/* Municípios: só mouse/toque. Rotular ou pôr no Tab centenas de
              polígonos seria inutilizável com leitor de tela/teclado — o
              equivalente acessível é a lista pesquisável no painel do estado. */}
          {listaMunicipios && (
            <g
              className="brazil-map__municipios"
              aria-hidden="true"
              onClick={(e) => {
                const m = municipioPorCodigo.get(codigoDoEvento(e))
                if (m) onSelecionarMunicipio(m)
              }}
              onMouseOver={(e) => setMunicipioHover(codigoDoEvento(e))}
              onMouseLeave={() => setMunicipioHover(null)}
            >
              <CamadaMunicipios municipios={listaMunicipios} cor={corDoEstado.base} />
            </g>
          )}

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
              {ufHover && !drilldown && (
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
              {hoverAtual?.d && (
                <path
                  className="brazil-map__municipio-realce brazil-map__municipio-realce--hover"
                  d={hoverAtual.d}
                  style={{ fill: corDoEstado.hover }}
                />
              )}
              {selecionadoAtual?.d && (
                <path
                  className="brazil-map__municipio-realce brazil-map__municipio-realce--selecionado"
                  d={selecionadoAtual.d}
                />
              )}
            </g>
          )}
        </g>

        {!drilldown && politicoSelecionado?.uf && <BrazilMapCallout politico={politicoSelecionado} />}
      </svg>

      {!drilldown && ufHover && mousePos && (
        <div className="brazil-map__tooltip" style={{ left: mousePos.x, top: mousePos.y }}>
          <strong>{UF_NOME[ufHover]}</strong>
          <span>{CARGOS_LABEL_POR_UF.get(ufHover)}</span>
        </div>
      )}

      {hoverAtual && mousePos && (
        <div className="brazil-map__tooltip" style={{ left: mousePos.x, top: mousePos.y }}>
          <strong>{hoverAtual.nome}</strong>
          {descricaoPrefeito(hoverAtual.codigo) && <span>{descricaoPrefeito(hoverAtual.codigo)}</span>}
        </div>
      )}

      <p className="brazil-map__sr" role="status" aria-live="polite">
        {mensagemStatus}
      </p>

      {drilldown && (
        <div className="brazil-map__drilldown-topo">
          <button
            ref={voltarRef}
            type="button"
            className="brazil-map__voltar"
            onClick={onVoltarAoBrasil}
            aria-label="Voltar ao mapa do Brasil"
          >
            ← Brasil
          </button>
          <span className="brazil-map__drilldown-titulo">{UF_NOME[ufSelecionada]}</span>
        </div>
      )}

      {drilldown && municipios?.uf === ufSelecionada && municipios.status === 'carregando' && (
        <div className="brazil-map__aviso" aria-hidden="true">
          Carregando municípios do IBGE…
        </div>
      )}

      {drilldown && municipios?.uf === ufSelecionada && municipios.status === 'erro' && (
        <div className="brazil-map__aviso brazil-map__aviso--erro" role="alert">
          <span>Não foi possível carregar os municípios do IBGE.</span>
          <button type="button" onClick={onRecarregarMunicipios}>
            Tentar novamente
          </button>
        </div>
      )}

      {drilldown ? (
        <div className="brazil-map__legenda">
          {municipiosProntos
            ? 'Clique em um município para ver o(a) prefeito(a) eleito(a) em 2024'
            : 'Limites municipais: IBGE'}
          {onAbrirListaMunicipios && (
            <button type="button" className="brazil-map__abrir-lista" onClick={onAbrirListaMunicipios}>
              Lista de municípios
            </button>
          )}
        </div>
      ) : (
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
      )}

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
