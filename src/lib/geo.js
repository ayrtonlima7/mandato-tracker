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
export const ESTADOS = brasilGeo.features.map((feature) => ({
  uf: siglaDaFeature(feature),
  d: geradorDePath(feature),
}))

export const PATH_POR_UF = new Map(ESTADOS.map((estado) => [estado.uf, estado.d]))
