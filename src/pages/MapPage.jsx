import { useEffect, useMemo, useState } from 'react'
import BrazilMap from '../components/BrazilMap/BrazilMap.jsx'
import StateSidebar from '../components/StateSidebar/StateSidebar.jsx'
import DetailSidebar from '../components/DetailSidebar/DetailSidebar.jsx'
import MunicipioSidebar from '../components/MunicipioSidebar/MunicipioSidebar.jsx'
import { usePanelTransition } from '../hooks/usePanelTransition.js'
import { useMunicipiosDaUf } from '../hooks/useMunicipiosDaUf.js'
import { useIsMobile } from '../hooks/useIsMobile.js'
import { mandateTree } from '../data/mandateData.js'
import { UF_NOME, politicosPorUf, agruparPorCargo } from '../lib/estados.js'
import './MapPage.css'

export default function MapPage() {
  const [ufSelecionada, setUfSelecionada] = useState(null)
  const [politicoSelecionado, setPoliticoSelecionado] = useState(null)
  const [municipioSelecionado, setMunicipioSelecionado] = useState(null)
  // No celular o painel do estado cobre a tela inteira; este estado deixa o
  // usuário escondê-lo para ver o mapa dos municípios (e reabrir pela legenda).
  const [listaOcultaNoMobile, setListaOcultaNoMobile] = useState(false)
  const isMobile = useIsMobile()

  const { municipios, prefeitos, recarregarMunicipios, recarregarPrefeitos } =
    useMunicipiosDaUf(ufSelecionada)

  const painelEstado = usePanelTransition(
    ufSelecionada && !(isMobile && listaOcultaNoMobile) ? ufSelecionada : null,
  )
  const painelDetalhe = usePanelTransition(politicoSelecionado)
  const painelMunicipio = usePanelTransition(municipioSelecionado)

  // Usa o valor retido pelo hook (painelEstado.value), não ufSelecionada
  // direto: durante a animação de saída ufSelecionada já é null, mas o
  // painel ainda está montado e precisa mostrar o conteúdo do último estado.
  const gruposDoEstado = useMemo(
    () => agruparPorCargo(painelEstado.value ? politicosPorUf.get(painelEstado.value) ?? [] : []),
    [painelEstado.value],
  )

  function selecionarUf(uf) {
    setUfSelecionada(uf)
    setPoliticoSelecionado(null)
    setMunicipioSelecionado(null)
    setListaOcultaNoMobile(false)
  }

  function voltarAoBrasil() {
    selecionarUf(null)
  }

  function selecionarPresidente() {
    selecionarUf(null)
    setPoliticoSelecionado(mandateTree)
  }

  // Painel da direita é um só: político OU município.
  function selecionarPolitico(politico) {
    setMunicipioSelecionado(null)
    setPoliticoSelecionado(politico)
  }

  function selecionarMunicipio(municipio) {
    setPoliticoSelecionado(null)
    setMunicipioSelecionado({ codigo: municipio.codigo, nome: municipio.nome, uf: ufSelecionada })
  }

  // Escape volta um nível por vez: detalhe (município ou político) → estado
  // (sai do drilldown) → Brasil.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Escape') return
      if (municipioSelecionado) setMunicipioSelecionado(null)
      else if (politicoSelecionado) setPoliticoSelecionado(null)
      else if (ufSelecionada) voltarAoBrasil()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [municipioSelecionado, politicoSelecionado, ufSelecionada])

  return (
    <div className="map-page">
      <header className="map-page__header">
        <h1>Painel de Mandatos</h1>
        <p>
          Clique em um estado para ver seus políticos e municípios, ou no presidente, e confira as
          propostas de mandato e o noticiário de cada um.
        </p>
      </header>

      <div className="map-page__corpo">
        <div className="map-page__mapa">
          <BrazilMap
            ufSelecionada={ufSelecionada}
            onSelecionarUf={selecionarUf}
            presidente={mandateTree}
            presidenteSelecionado={politicoSelecionado?.id === mandateTree.id}
            onSelecionarPresidente={selecionarPresidente}
            politicoSelecionado={politicoSelecionado}
            municipios={municipios}
            prefeitos={prefeitos}
            municipioSelecionado={municipioSelecionado?.codigo ?? null}
            onSelecionarMunicipio={selecionarMunicipio}
            onRecarregarMunicipios={recarregarMunicipios}
            onVoltarAoBrasil={voltarAoBrasil}
            onAbrirListaMunicipios={
              isMobile && listaOcultaNoMobile ? () => setListaOcultaNoMobile(false) : undefined
            }
          />
        </div>

        {painelEstado.mounted && (
          <StateSidebar
            nomeEstado={UF_NOME[painelEstado.value]}
            grupos={gruposDoEstado}
            politicoSelecionadoId={politicoSelecionado?.id}
            onSelecionarPolitico={selecionarPolitico}
            saindo={painelEstado.saindo}
            onClose={voltarAoBrasil}
            municipios={municipios.uf === painelEstado.value ? municipios : null}
            municipioSelecionado={municipioSelecionado?.codigo ?? null}
            onSelecionarMunicipio={selecionarMunicipio}
            onRecarregarMunicipios={recarregarMunicipios}
            onVerMapa={isMobile ? () => setListaOcultaNoMobile(true) : undefined}
          />
        )}

        {painelDetalhe.mounted && (
          <DetailSidebar
            key={painelDetalhe.value.id}
            politico={painelDetalhe.value}
            saindo={painelDetalhe.saindo}
            onClose={() => setPoliticoSelecionado(null)}
          />
        )}

        {painelMunicipio.mounted && (
          <MunicipioSidebar
            key={painelMunicipio.value.codigo}
            municipio={painelMunicipio.value}
            prefeitos={prefeitos}
            onRecarregarPrefeitos={recarregarPrefeitos}
            saindo={painelMunicipio.saindo}
            onClose={() => setMunicipioSelecionado(null)}
          />
        )}
      </div>
    </div>
  )
}
