import { geoMercator, geoPath } from 'd3-geo'
import brasilUfRaw from '../assets/brasil-uf.json'

// O GeoJSON de origem (IBGE) usa o sentido de rotação oposto ao que o d3-geo
// espera (regra da mão direita / RFC 7946). Sem essa correção, d3.geoPath
// desenha cada estado como "o globo inteiro menos o estado" — confirmado
// comparando bounding boxes antes/depois da reversão. Corrigimos em memória,
// nunca no arquivo original.
function inverterAnel(anel) {
  return [...anel].reverse()
}

function normalizarGeometria(geometry) {
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

export const brasilGeo = {
  ...brasilUfRaw,
  features: brasilUfRaw.features.map((feature) => ({
    ...feature,
    geometry: normalizarGeometria(feature.geometry),
  })),
}

export const MAPA_LARGURA = 760
export const MAPA_ALTURA = 760

const projecao = geoMercator().fitSize([MAPA_LARGURA, MAPA_ALTURA], brasilGeo)
export const geradorDePath = geoPath(projecao)

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
