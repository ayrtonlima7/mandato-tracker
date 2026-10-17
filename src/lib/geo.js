import { geoArea, geoMercator, geoPath } from 'd3-geo'
import brasilUfRaw from '../assets/brasil-uf.json'

// O GeoJSON de origem (IBGE) usa o sentido de rotação oposto ao que o d3-geo
// espera (regra da mão direita / RFC 7946). Sem essa correção, d3.geoPath
// desenha cada estado como "o globo inteiro menos o estado" — confirmado
// comparando bounding boxes antes/depois da reversão. Corrigimos em memória,
// nunca no arquivo original.
function inverterAnel(anel) {
  return [...anel].reverse()
}

export function normalizarGeometria(geometry) {
  if (geometry.type === 'Polygon') {
    return { ...geometry, coordinates: geometry.coordinates.map(inverterAnel) }
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((poligono) => poligono.map(inverterAnel)),
    }
  }
  return geometry
}

// Variante defensiva para malhas baixadas em tempo de execução (API de Malhas
// do IBGE): só inverte se a feição, como veio, cobrir mais de um hemisfério —
// sinal inequívoco de anel no sentido oposto ao do d3-geo. Assim, se o IBGE um
// dia passar a publicar no sentido RFC 7946, nada quebra.
export function normalizarFeature(feature) {
  if (geoArea(feature) <= 2 * Math.PI) return feature
  return { ...feature, geometry: normalizarGeometria(feature.geometry) }
}

export const brasilGeo = {
  ...brasilUfRaw,
  features: brasilUfRaw.features.map((feature) => ({
    ...feature,
    geometry: normalizarGeometria(feature.geometry),
  })),
}

export const MAPA_LARGURA = 760
export const MAPA_ALTURA = 760
// Margem em volta do Brasil para fotos "fora do país" (estados pequenos demais).
export const MARGEM_MAPA = 80

const projecao = geoMercator().fitExtent(
  [
    [MARGEM_MAPA, MARGEM_MAPA],
    [MAPA_LARGURA - MARGEM_MAPA, MAPA_ALTURA - MARGEM_MAPA],
  ],
  brasilGeo,
)
export const geradorDePath = geoPath(projecao)
export { projecao }
export const BOUNDS_BRASIL = geradorDePath.bounds(brasilGeo) // [[x0,y0],[x1,y1]]

export function siglaDaFeature(feature) {
  return feature.properties.sigla
}

// Os 27 traçados SVG não mudam em tempo de execução (não dependem de hover
// nem de seleção) — calculados uma única vez aqui, em vez de a cada
// re-render disparado por onMouseMove no mapa.
export const ESTADOS = brasilGeo.features.map((feature) => {
  const [[x0, y0], [x1, y1]] = geradorDePath.bounds(feature)
  const [cx, cy] = geradorDePath.centroid(feature)
  return {
    uf: siglaDaFeature(feature),
    d: geradorDePath(feature),
    area: geradorDePath.area(feature),
    bounds: { x0, y0, x1, y1 },
    centroide: { x: cx, y: cy },
  }
})

export const PATH_POR_UF = new Map(ESTADOS.map((estado) => [estado.uf, estado.d]))
export const BOUNDS_POR_UF = new Map(ESTADOS.map((estado) => [estado.uf, estado.bounds]))
export const CENTROIDE_POR_UF = new Map(ESTADOS.map((estado) => [estado.uf, estado.centroide]))

// Limiar escolhido a partir da distribuição real de área (em unidades do
// viewBox) dos 27 estados projetados, não pela área do bounding box (que
// classificaria PE como grande: seu formato alongado estica o bbox até
// ~17000 apesar da área real pequena). O salto proporcional mais nítido na
// distribuição é entre PB (~1556) e PE (~2718), não entre PE e SC (~3277);
// o corte abaixo ficou em 3000 (passando por PE) de propósito, porque PE
// ainda está bem distante do próximo agrupamento real (SC/AP/CE, 3200-4100)
// e porque é um dos estados pequenos que o pipeline de UX já esperava nessa
// categoria. Abaixo do limiar: DF, SE, AL, RJ, ES, RN, PB e PE — os estados
// pequenos demais para o realce de seleção no mapa ser suficiente, que por
// isso ganham callout com foto e área de toque maior (ver BrazilMapCallout
// e brazil-map__estado-tap).
const AREA_LIMIAR_ESTADO_PEQUENO = 3000

export const ESTADOS_PEQUENOS = new Set(
  ESTADOS.filter((estado) => estado.area < AREA_LIMIAR_ESTADO_PEQUENO).map((estado) => estado.uf),
)

// A foto só cabe DENTRO do estado se ele não for "pequeno" (limiar de área acima).
// O bounding box não serve aqui: estados alongados (ex.: PE) têm bbox grande
// mesmo com área pequena, e a foto vazaria para fora do contorno.
export function fotoCabeNaUf(uf) {
  return !ESTADOS_PEQUENOS.has(uf)
}

// Ponto para centralizar a foto DENTRO do estado: o centróide projetado.
export function centroDaFotoNaUf(uf) {
  return CENTROIDE_POR_UF.get(uf) ?? { x: MAPA_LARGURA / 2, y: MAPA_ALTURA / 2 }
}

// Folga (em unidades do viewBox) entre o estado ampliado e a borda do mapa:
// deixa espaço para o botão "Voltar" e o do presidente, que flutuam por cima.
const MARGEM_ZOOM = 70

// Zoom do drilldown: a mesma projeção do Brasil inteiro, só que ampliada e
// transladada para o estado ocupar o mapa. Reaproveitar a projeção (em vez de
// ajustar uma nova por estado) mantém municípios e contorno estadual
// perfeitamente alinhados e permite animar a transição com um único transform.
export function transformParaUf(uf) {
  const bounds = BOUNDS_POR_UF.get(uf)
  if (!bounds) return { k: 1, tx: 0, ty: 0 }
  const largura = Math.max(bounds.x1 - bounds.x0, 1)
  const altura = Math.max(bounds.y1 - bounds.y0, 1)
  const k = Math.min(
    (MAPA_LARGURA - 2 * MARGEM_ZOOM) / largura,
    (MAPA_ALTURA - 2 * MARGEM_ZOOM) / altura,
  )
  const cx = (bounds.x0 + bounds.x1) / 2
  const cy = (bounds.y0 + bounds.y1) / 2
  return { k, tx: MAPA_LARGURA / 2 - k * cx, ty: MAPA_ALTURA / 2 - k * cy }
}
