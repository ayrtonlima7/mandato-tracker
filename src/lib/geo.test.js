import { describe, expect, it } from 'vitest'
import { geoArea } from 'd3-geo'
import { BOUNDS_POR_UF, MAPA_ALTURA, MAPA_LARGURA, normalizarFeature, transformParaUf } from './geo.js'

// Quadrado em Sergipe no sentido anti-horário (como a API de Malhas do IBGE
// entrega): para o d3-geo isso é "o globo inteiro menos o quadrado".
const quadradoIbge = {
  type: 'Feature',
  properties: { codarea: '2800000' },
  geometry: {
    type: 'Polygon',
    coordinates: [[[-37.2, -10.6], [-37.0, -10.6], [-37.0, -10.4], [-37.2, -10.4], [-37.2, -10.6]]],
  },
}

describe('normalizarFeature', () => {
  it('inverte anéis no sentido oposto ao do d3-geo', () => {
    expect(geoArea(quadradoIbge)).toBeGreaterThan(2 * Math.PI)
    const corrigido = normalizarFeature(quadradoIbge)
    expect(geoArea(corrigido)).toBeLessThan(0.001)
    expect(corrigido.properties).toEqual(quadradoIbge.properties)
  })

  it('não mexe em feições que já estão no sentido certo', () => {
    const certo = normalizarFeature(quadradoIbge)
    expect(normalizarFeature(certo)).toBe(certo)
  })
})

describe('transformParaUf', () => {
  it.each(['MG', 'DF', 'SE', 'AM'])('enquadra %s dentro do mapa, centralizado', (uf) => {
    const { k, tx, ty } = transformParaUf(uf)
    const b = BOUNDS_POR_UF.get(uf)
    const x0 = b.x0 * k + tx
    const x1 = b.x1 * k + tx
    const y0 = b.y0 * k + ty
    const y1 = b.y1 * k + ty
    expect(k).toBeGreaterThan(1)
    expect(x0).toBeGreaterThanOrEqual(0)
    expect(y0).toBeGreaterThanOrEqual(0)
    expect(x1).toBeLessThanOrEqual(MAPA_LARGURA)
    expect(y1).toBeLessThanOrEqual(MAPA_ALTURA)
    expect((x0 + x1) / 2).toBeCloseTo(MAPA_LARGURA / 2)
    expect((y0 + y1) / 2).toBeCloseTo(MAPA_ALTURA / 2)
  })

  it('estado pequeno amplia mais que estado grande', () => {
    expect(transformParaUf('DF').k).toBeGreaterThan(transformParaUf('MG').k)
  })

  it('UF desconhecida não aplica zoom', () => {
    expect(transformParaUf('XX')).toEqual({ k: 1, tx: 0, ty: 0 })
  })
})
