import { useEffect, useMemo, useState } from 'react'
import BrazilMap from '../components/BrazilMap/BrazilMap.jsx'
import StateSidebar from '../components/StateSidebar/StateSidebar.jsx'
import DetailSidebar from '../components/DetailSidebar/DetailSidebar.jsx'
import { mandateTree } from '../data/mandateData.js'
import { UF_NOME, politicosPorUf, agruparPorCargo } from '../lib/estados.js'
import './MapPage.css'

export default function MapPage() {
  const [ufSelecionada, setUfSelecionada] = useState(null)
  const [politicoSelecionado, setPoliticoSelecionado] = useState(null)

  const gruposDoEstado = useMemo(
    () => agruparPorCargo(ufSelecionada ? politicosPorUf.get(ufSelecionada) ?? [] : []),
    [ufSelecionada],
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
        {ufSelecionada && (
          <StateSidebar
            nomeEstado={UF_NOME[ufSelecionada]}
            grupos={gruposDoEstado}
            politicoSelecionadoId={politicoSelecionado?.id}
            onSelecionarPolitico={setPoliticoSelecionado}
            onClose={() => {
              setUfSelecionada(null)
              setPoliticoSelecionado(null)
            }}
          />
        )}

        <div className="map-page__mapa">
          <BrazilMap
            ufSelecionada={ufSelecionada}
            onSelecionarUf={selecionarUf}
            presidente={mandateTree}
            presidenteSelecionado={politicoSelecionado?.id === mandateTree.id}
            onSelecionarPresidente={selecionarPresidente}
          />
        </div>

        {politicoSelecionado && (
          <DetailSidebar
            key={politicoSelecionado.id}
            politico={politicoSelecionado}
            onClose={() => setPoliticoSelecionado(null)}
          />
        )}
      </div>
    </div>
  )
}
