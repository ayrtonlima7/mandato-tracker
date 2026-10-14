import { useIsMobile } from '../hooks/useIsMobile.js'
import OrgChart from '../components/OrgChart/OrgChart.jsx'
import MobileTree from '../components/MobileTree/MobileTree.jsx'
import { mandateTree, generatedAt } from '../data/mandateData.js'
import './TreePage.css'

export default function TreePage() {
  const isMobile = useIsMobile()
  const atualizadoEm = new Date(generatedAt).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
  })

  return (
    <div className="tree-page">
      <header className="tree-page__header">
        <h1>Painel de Mandatos</h1>
        <p>
          Da Presidência da República aos governadores — clique em um card para ver as propostas
          de mandato e o noticiário de cada uma.
        </p>
        <span className="tree-page__aviso">
          Fontes: G1 (promessas) e Google News · atualizado em {atualizadoEm}
        </span>
      </header>
      <div className="tree-page__corpo">
        {isMobile ? <MobileTree data={mandateTree} /> : <OrgChart data={mandateTree} />}
      </div>
    </div>
  )
}
