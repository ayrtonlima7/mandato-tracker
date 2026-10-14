import { useIsMobile } from '../hooks/useIsMobile.js'
import OrgChart from '../components/OrgChart/OrgChart.jsx'
import MobileTree from '../components/MobileTree/MobileTree.jsx'
import { mandateTree } from '../data/mandateData.js'
import './TreePage.css'

export default function TreePage() {
  const isMobile = useIsMobile()

  return (
    <div className="tree-page">
      <header className="tree-page__header">
        <h1>Painel de Mandatos</h1>
        <p>
          Da Presidência da República aos Vereadores — clique em um card para ver os planos de
          mandato.
        </p>
        <span className="tree-page__aviso">Dados fictícios — protótipo</span>
      </header>
      <div className="tree-page__corpo">
        {isMobile ? <MobileTree data={mandateTree} /> : <OrgChart data={mandateTree} />}
      </div>
    </div>
  )
}
