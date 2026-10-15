import { useEffect, useMemo, useState } from 'react'
import BrazilMap from '../components/BrazilMap/BrazilMap.jsx'
import StateSidebar from '../components/StateSidebar/StateSidebar.jsx'
import DetailSidebar from '../components/DetailSidebar/DetailSidebar.jsx'
import { usePanelTransition } from '../hooks/usePanelTransition.js'
import { mandateTree } from '../data/mandateData.js'
import { UF_NOME, politicosPorUf, agruparPorCargo } from '../lib/estados.js'
import './MapPage.css'

export default function MapPage() {
  const [ufSelecionada, setUfSelecionada] = useState(null)
  const [politicoSelecionado, setPoliticoSelecionado] = useState(null)

  const painelEstado = usePanelTransition(ufSelecionada)
  const painelDetalhe = usePanelTransition(politicoSelecionado)

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
  }

  function selecionarPresidente() {
    setUfSelecionada(null)
    setPoliticoSelecionado(mandateTree)
  }

  // Escape fecha primeiro o painel de detalhes (direita), depois a lista do
  // estado (esquerda) — um nível por vez, como um "voltar".
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'Escape') return
      if (politicoSelecionado) setPoliticoSelecionado(null)
      else if (ufSelecionada) setUfSelecionada(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [politicoSelecionado, ufSelecionada])

  return (
    <div className="map-page">
      <header className="map-page__header">
        <h1>Painel de Mandatos</h1>
        <p>
          Clique em um estado para ver seus políticos, ou no presidente, e confira as propostas de
          mandato e o noticiário de cada um.
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
          />
        </div>

        {painelEstado.mounted && (
          <StateSidebar
            nomeEstado={UF_NOME[painelEstado.value]}
            grupos={gruposDoEstado}
            politicoSelecionadoId={politicoSelecionado?.id}
            onSelecionarPolitico={setPoliticoSelecionado}
            saindo={painelEstado.saindo}
            onClose={() => {
              setUfSelecionada(null)
              setPoliticoSelecionado(null)
            }}
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
      </div>
    </div>
  )
}
