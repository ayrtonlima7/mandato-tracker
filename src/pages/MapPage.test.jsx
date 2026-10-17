// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MapPage from './MapPage.jsx'
import { limparCacheMunicipios } from '../lib/municipios.js'

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

const MALHA_SE = {
  type: 'FeatureCollection',
  features: [quadrado('2800308', -37.2), quadrado('2800100', -37.0), quadrado('2800605', -36.8)],
}
const LOCALIDADES_SE = [
  { 'municipio-id': 2800308, 'municipio-nome': 'Aracaju' },
  { 'municipio-id': 2800100, 'municipio-nome': 'Amparo do São Francisco' },
  { 'municipio-id': 2800605, 'municipio-nome': 'Barra dos Coqueiros' },
]
const PREFEITOS_SE = {
  uf: 'SE',
  fonte: {
    nome: 'TSE — Portal de Dados Abertos: Candidatos 2024',
    url: 'https://dadosabertos.tse.jus.br/dataset/candidatos-2024',
    dadosGeradosEm: '2026-10-16',
  },
  coletadoEm: '2026-10-16',
  mandato: { inicio: '2025-01-01', fim: '2028-12-31' },
  municipios: {
    2800308: {
      nomeUrna: 'EMILIA CORREA',
      nomeCompleto: 'EMÍLIA CORRÊA SANTOS BEZERRA',
      partido: 'PL',
      turno: 2,
      dataEleicao: '2024-10-27',
    },
  },
  semEleito: ['2800605'],
}

function resposta(corpo, status = 200) {
  return Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(corpo) })
}

// Roteia o fetch mockado por URL; cada teste pode sobrescrever uma rota.
function mockarFetch(rotas = {}) {
  const padrao = {
    malha: () => resposta(MALHA_SE),
    localidades: () => resposta(LOCALIDADES_SE),
    prefeitos: () => resposta(PREFEITOS_SE),
  }
  const r = { ...padrao, ...rotas }
  const fetchMock = vi.fn((url) => {
    if (url.includes('/malhas/')) return r.malha()
    if (url.includes('/localidades/')) return r.localidades()
    if (url.includes('prefeitos-2024')) return r.prefeitos()
    return Promise.reject(new Error(`URL inesperada: ${url}`))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderizar() {
  return render(
    <MemoryRouter>
      <MapPage />
    </MemoryRouter>,
  )
}

async function entrarEmSergipe() {
  fireEvent.click(screen.getByRole('button', { name: /^Sergipe —/ }))
  await screen.findByRole('heading', { name: 'Municípios (3)' })
}

beforeEach(() => {
  limparCacheMunicipios()
  // jsdom não implementa matchMedia (usado por useIsMobile e usePanelTransition).
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('drilldown estado → município', () => {
  it('entra no estado, mostra municípios e o(a) prefeito(a) eleito(a) com fonte', async () => {
    const fetchMock = mockarFetch()
    const { container } = renderizar()

    expect(screen.getByRole('group', { name: 'Mapa do Brasil por estado' })).toBeTruthy()
    await entrarEmSergipe()

    expect(screen.getByRole('group', { name: 'Mapa de Sergipe por município' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Voltar ao mapa do Brasil' })).toBeTruthy()
    // Malha com qualidade intermediária (SE é estado pequeno) + nomes + prefeitos.
    expect(fetchMock.mock.calls.map(([u]) => u)).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/\/malhas\/estados\/28\?.*qualidade=intermediaria/),
        expect.stringContaining('/localidades/estados/28/municipios'),
        expect.stringContaining('data/prefeitos-2024/SE.json'),
      ]),
    )
    // Um polígono por município, fora da árvore de acessibilidade.
    const poligonos = container.querySelectorAll('.brazil-map__municipio')
    expect(poligonos).toHaveLength(3)
    expect(container.querySelector('.brazil-map__municipios').getAttribute('aria-hidden')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Aracaju' }))
    const painel = await screen.findByRole('dialog', { name: 'Prefeitura de Aracaju' })
    await within(painel).findByText('Emilia Correa')
    expect(within(painel).getByRole('heading', { name: 'Prefeito(a) eleito(a) em 2024' })).toBeTruthy()
    expect(within(painel).getByText('PL')).toBeTruthy()
    expect(within(painel).getByText('2º turno, 27/10/2024')).toBeTruthy()
    expect(within(painel).getByText('01/01/2025 – 31/12/2028')).toBeTruthy()
    expect(within(painel).getByText(/não confirma quem ocupa o cargo hoje/)).toBeTruthy()
    expect(within(painel).getByRole('link', { name: /Candidatos 2024/ }).getAttribute('href')).toBe(
      'https://dadosabertos.tse.jus.br/dataset/candidatos-2024',
    )
    expect(painel.textContent).toContain('arquivo gerado pelo TSE em 16/10/2026')
  })

  it('clicar no polígono também abre o município', async () => {
    mockarFetch()
    const { container } = renderizar()
    await entrarEmSergipe()

    fireEvent.click(container.querySelector('[data-codigo="2800605"]'))
    const painel = await screen.findByRole('dialog', { name: 'Prefeitura de Barra dos Coqueiros' })
    expect(within(painel).getByText(/não registra candidato\(a\) eleito\(a\)/)).toBeTruthy()
  })

  it('busca filtra a lista ignorando acentos', async () => {
    mockarFetch()
    renderizar()
    await entrarEmSergipe()

    fireEvent.change(screen.getByLabelText('Buscar município'), { target: { value: 'sao fr' } })
    expect(screen.getByRole('button', { name: 'Amparo do São Francisco' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Aracaju' })).toBeNull()
    expect(screen.getByText('1 município.')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Buscar município'), { target: { value: 'xyz' } })
    expect(screen.getByText('Nenhum município encontrado.')).toBeTruthy()
  })

  it('Escape e o botão Voltar sobem um nível por vez até o Brasil', async () => {
    mockarFetch()
    renderizar()
    await entrarEmSergipe()
    fireEvent.click(screen.getByRole('button', { name: 'Aracaju' }))
    await screen.findByRole('dialog', { name: 'Prefeitura de Aracaju' })

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Prefeitura de Aracaju' })).toBeNull())
    expect(screen.getByRole('group', { name: 'Mapa de Sergipe por município' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao mapa do Brasil' }))
    expect(screen.getByRole('group', { name: 'Mapa do Brasil por estado' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Voltar ao mapa do Brasil' })).toBeNull()
  })

  it('pelo teclado: Enter no estado foca "Voltar"; voltar devolve o foco ao estado', async () => {
    mockarFetch()
    renderizar()
    const sergipe = screen.getByRole('button', { name: /^Sergipe —/ })
    sergipe.focus()
    fireEvent.keyDown(sergipe, { key: 'Enter' })

    const voltar = screen.getByRole('button', { name: 'Voltar ao mapa do Brasil' })
    expect(document.activeElement).toBe(voltar)
    await screen.findByRole('heading', { name: 'Municípios (3)' })

    fireEvent.click(voltar)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Sergipe —/ }))
  })

  it('reentrar no estado usa o cache (sem novo download)', async () => {
    const fetchMock = mockarFetch()
    renderizar()
    await entrarEmSergipe()
    fireEvent.click(screen.getByRole('button', { name: 'Voltar ao mapa do Brasil' }))
    await entrarEmSergipe()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})

describe('estados de carregamento, erro e falta de dados', () => {
  it('erro do IBGE mostra alerta e "Tentar novamente" recupera', async () => {
    let falhar = true
    mockarFetch({ malha: () => (falhar ? Promise.reject(new Error('rede')) : resposta(MALHA_SE)) })
    renderizar()
    fireEvent.click(screen.getByRole('button', { name: /^Sergipe —/ }))

    const alertas = await screen.findAllByRole('alert')
    expect(alertas.map((a) => a.textContent).join(' ')).toMatch(/Não foi possível carregar/)

    falhar = false
    fireEvent.click(screen.getAllByRole('button', { name: 'Tentar novamente' })[0])
    await screen.findByRole('heading', { name: 'Municípios (3)' })
    expect(screen.queryAllByRole('alert')).toHaveLength(0)
  })

  it('mostra carregando enquanto o IBGE não responde', async () => {
    let liberar
    mockarFetch({ malha: () => new Promise((r) => (liberar = () => r(resposta(MALHA_SE)))) })
    const { container } = renderizar()
    fireEvent.click(screen.getByRole('button', { name: /^Sergipe —/ }))

    expect(await screen.findAllByText('Carregando municípios do IBGE…')).not.toHaveLength(0)
    expect(container.querySelector('.brazil-map__sr').textContent).toBe('Carregando municípios de Sergipe…')
    liberar()
    await screen.findByRole('heading', { name: 'Municípios (3)' })
  })

  it('sem arquivo de prefeitos (404): avisa que não há dados, sem inventar', async () => {
    mockarFetch({ prefeitos: () => resposta({}, 404) })
    renderizar()
    await entrarEmSergipe()
    fireEvent.click(screen.getByRole('button', { name: 'Aracaju' }))
    const painel = await screen.findByRole('dialog', { name: 'Prefeitura de Aracaju' })
    await within(painel).findByText(/ainda não estão disponíveis/)
    expect(within(painel).queryByText('Emilia Correa')).toBeNull()
  })

  it('Brasília: explica que o DF não tem prefeito, sem depender do arquivo do TSE', async () => {
    const fetchMock = mockarFetch({
      malha: () => resposta({ type: 'FeatureCollection', features: [quadrado('5300108', -47.9)] }),
      localidades: () => resposta([{ 'municipio-id': 5300108, 'municipio-nome': 'Brasília' }]),
      prefeitos: () => Promise.reject(new Error('não deveria buscar')),
    })
    renderizar()
    fireEvent.click(screen.getByRole('button', { name: /^Distrito Federal —/ }))
    await screen.findByRole('heading', { name: 'Municípios (1)' })
    fireEvent.click(screen.getByRole('button', { name: 'Brasília' }))

    const painel = await screen.findByRole('dialog', { name: 'Prefeitura de Brasília' })
    expect(within(painel).getByText(/Brasília não tem prefeito\(a\)/)).toBeTruthy()
    expect(within(painel).queryByRole('alert')).toBeNull()
    expect(fetchMock.mock.calls.some(([u]) => u.includes('prefeitos-2024'))).toBe(false)
  })

  it('falha ao carregar prefeitos não derruba o mapa e permite tentar de novo', async () => {
    let falhar = true
    mockarFetch({ prefeitos: () => (falhar ? resposta({}, 500) : resposta(PREFEITOS_SE)) })
    renderizar()
    await entrarEmSergipe()
    fireEvent.click(screen.getByRole('button', { name: 'Aracaju' }))
    const painel = await screen.findByRole('dialog', { name: 'Prefeitura de Aracaju' })
    await within(painel).findByText('Não foi possível carregar os dados de prefeitos.')

    falhar = false
    fireEvent.click(within(painel).getByRole('button', { name: 'Tentar novamente' }))
    await within(painel).findByText('Emilia Correa')
  })
})
