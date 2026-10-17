import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  carregarMunicipios,
  carregarPrefeitos,
  filtrarMunicipios,
  formatarNomeProprio,
  limparCacheMunicipios,
  montarMunicipios,
  prefeitoDoMunicipio,
  qualidadeDaMalha,
  urlMalhaMunicipal,
  urlMunicipiosIbge,
  urlPrefeitos,
} from './municipios.js'

function quadrado(codigo, lon0) {
  const [lat0, lat1, lon1] = [-10.6, -10.4, lon0 + 0.2]
  return {
    type: 'Feature',
    properties: { codarea: codigo },
    geometry: {
      type: 'Polygon',
      coordinates: [[[lon0, lat0], [lon1, lat0], [lon1, lat1], [lon0, lat1], [lon0, lat0]]],
    },
  }
}

const MALHA_SE = { type: 'FeatureCollection', features: [quadrado('2800308', -37.2), quadrado('2800100', -37.0)] }
const LOCALIDADES_SE = [
  { 'municipio-id': 2800308, 'municipio-nome': 'Aracaju' },
  { 'municipio-id': 2800100, 'municipio-nome': 'Amparo do São Francisco' },
  { 'municipio-id': 2899999, 'municipio-nome': 'Sem Malha' },
]

function resposta(corpo, status = 200) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(corpo) })
}

beforeEach(() => limparCacheMunicipios())
afterEach(() => vi.unstubAllGlobals())

describe('URLs', () => {
  it('usa o código IBGE da UF e a qualidade conforme o tamanho do estado', () => {
    expect(urlMalhaMunicipal('MG')).toBe(
      'https://servicodados.ibge.gov.br/api/v3/malhas/estados/31' +
        '?formato=application/vnd.geo%2Bjson&intrarregiao=municipio&qualidade=minima',
    )
    expect(qualidadeDaMalha('SE')).toBe('intermediaria')
    expect(urlMunicipiosIbge('SE')).toBe(
      'https://servicodados.ibge.gov.br/api/v1/localidades/estados/28/municipios?view=nivelado',
    )
    expect(urlPrefeitos('SE')).toMatch(/data\/prefeitos-2024\/SE\.json$/)
  })

  it('rejeita UF desconhecida', () => {
    expect(() => urlMalhaMunicipal('XX')).toThrow(/UF desconhecida/)
  })
})

describe('montarMunicipios', () => {
  it('junta malha e nomes pelo código IBGE, ordena por nome e mantém quem não tem malha', () => {
    const lista = montarMunicipios(MALHA_SE, LOCALIDADES_SE)
    expect(lista.map((m) => m.nome)).toEqual(['Amparo do São Francisco', 'Aracaju', 'Sem Malha'])
    expect(lista[0].d).toMatch(/^M/)
    expect(lista[2]).toEqual({ codigo: '2899999', nome: 'Sem Malha', d: null })
  })

  it('normaliza o sentido dos anéis (senão o caminho cobriria o mapa todo)', () => {
    const lista = montarMunicipios({ features: [quadrado('2800308', -37.2)] }, LOCALIDADES_SE)
    const m = lista.find((x) => x.codigo === '2800308')
    // Caminho de um município pequeno: poucos pontos, sem o retângulo da esfera.
    expect(m.d.split(/[MLZ]/).filter(Boolean).length).toBeLessThan(10)
  })

  it('falha com resposta em formato inesperado', () => {
    expect(() => montarMunicipios({ erro: 'x' }, [])).toThrow(/inesperada/)
  })
})

describe('carregarMunicipios', () => {
  it('baixa malha e nomes uma vez por UF e reaproveita o cache', async () => {
    const fetchMock = vi.fn((url) => resposta(url.includes('/malhas/') ? MALHA_SE : LOCALIDADES_SE))
    vi.stubGlobal('fetch', fetchMock)

    const primeira = await carregarMunicipios('SE')
    const segunda = await carregarMunicipios('SE')
    expect(primeira).toBe(segunda)
    expect(primeira).toHaveLength(3)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('não guarda falha no cache: nova tentativa refaz o download', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => resposta({}, 503))
      .mockImplementationOnce(() => resposta(LOCALIDADES_SE))
      .mockImplementation((url) => resposta(url.includes('/malhas/') ? MALHA_SE : LOCALIDADES_SE))
    vi.stubGlobal('fetch', fetchMock)

    await expect(carregarMunicipios('SE')).rejects.toThrow(/HTTP 503/)
    await expect(carregarMunicipios('SE')).resolves.toHaveLength(3)
  })
})

describe('carregarPrefeitos', () => {
  it('404 vira "sem dados" (null), não erro', async () => {
    vi.stubGlobal('fetch', vi.fn(() => resposta({}, 404)))
    await expect(carregarPrefeitos('SE')).resolves.toBeNull()
  })

  it('HTML no lugar do JSON (fallback de SPA do servidor) também vira "sem dados"', async () => {
    const html = {
      ok: true,
      status: 200,
      headers: { get: () => 'text/html; charset=utf-8' },
      json: () => Promise.reject(new SyntaxError('Unexpected token <')),
    }
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(html)))
    await expect(carregarPrefeitos('SE')).resolves.toBeNull()
  })

  it('DF não tem eleição municipal: nem faz requisição', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(carregarPrefeitos('DF')).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('outros erros HTTP propagam', async () => {
    vi.stubGlobal('fetch', vi.fn(() => resposta({}, 500)))
    await expect(carregarPrefeitos('SE')).rejects.toThrow(/HTTP 500/)
  })

  it('rejeita arquivo sem o mapa de municípios', async () => {
    vi.stubGlobal('fetch', vi.fn(() => resposta({ uf: 'SE' })))
    await expect(carregarPrefeitos('SE')).rejects.toThrow(/formato inesperado/)
  })
})

describe('prefeitoDoMunicipio', () => {
  const dados = {
    municipios: { 2800308: { nomeUrna: 'EMILIA CORREA', partido: 'PL', turno: 2 } },
    semEleito: ['2801306'],
  }

  it('distingue eleito, sem eleito, não encontrado, sem dados e sem prefeitura', () => {
    expect(prefeitoDoMunicipio(dados, '2800308')).toMatchObject({ tipo: 'eleito', registro: { partido: 'PL' } })
    expect(prefeitoDoMunicipio(dados, '2801306')).toEqual({ tipo: 'sem-eleito' })
    expect(prefeitoDoMunicipio(dados, '2800100')).toEqual({ tipo: 'nao-encontrado' })
    expect(prefeitoDoMunicipio(null, '2800308')).toEqual({ tipo: 'sem-dados' })
    expect(prefeitoDoMunicipio(null, '5300108').tipo).toBe('sem-prefeitura')
    expect(prefeitoDoMunicipio(dados, '2605459').tipo).toBe('sem-prefeitura')
  })
})

describe('busca e formatação', () => {
  it('busca ignora acentos e caixa', () => {
    const lista = montarMunicipios(MALHA_SE, LOCALIDADES_SE)
    expect(filtrarMunicipios(lista, 'sao fran').map((m) => m.nome)).toEqual(['Amparo do São Francisco'])
    expect(filtrarMunicipios(lista, '  ')).toBe(lista)
  })

  it('formata nomes em caixa alta do TSE', () => {
    expect(formatarNomeProprio('ANA HELENA DE DR MÁRIO')).toBe('Ana Helena de Dr Mário')
    expect(formatarNomeProprio('JOSÉ DA SILVA-SANTOS')).toBe('José da Silva-Santos')
    expect(formatarNomeProprio('DE PAULA')).toBe('De Paula')
  })
})
