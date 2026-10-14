import { useState } from 'react'
import Avatar from '../Avatar/Avatar.jsx'
import MandateCard from '../MandateCard/MandateCard.jsx'
import { countByStatus } from '../../lib/status.js'
import './MobileTree.css'

function MobileNode({ politico, nivel }) {
  const [filhosAbertos, setFilhosAbertos] = useState(nivel === 0)
  const [planosAbertos, setPlanosAbertos] = useState(false)
  const counts = countByStatus(politico.planos)
  const temFilhos = (politico.filhos?.length ?? 0) > 0

  return (
    <li className="mobile-node">
      <div className="mobile-node__card">
        <button
          type="button"
          className="mobile-node__corpo"
          onClick={() => setPlanosAbertos((v) => !v)}
        >
          <Avatar nome={politico.nome} foto={politico.foto} size={44} />
          <span className="mobile-node__texto">
            <strong>{politico.nome}</strong>
            <small>
              {politico.cargo}
              {politico.partido ? ` · ${politico.partido}` : ''}
            </small>
          </span>
          <span className="mobile-node__contagem">
            {counts.concluido}✔ {counts.em_andamento}↻
          </span>
        </button>

        {temFilhos && (
          <button
            type="button"
            className="mobile-node__toggle-filhos"
            onClick={() => setFilhosAbertos((v) => !v)}
            aria-label={filhosAbertos ? 'Recolher subordinados' : 'Expandir subordinados'}
          >
            {filhosAbertos ? '–' : '+'}
          </button>
        )}
      </div>

      {planosAbertos && (
        <div className="mobile-node__planos">
          {politico.planos?.length ? (
            politico.planos.map((plano) => <MandateCard key={plano.id} plano={plano} />)
          ) : (
            <p className="mobile-node__vazio">Nenhum plano de mandato registrado.</p>
          )}
        </div>
      )}

      {temFilhos && filhosAbertos && (
        <ul className="mobile-node__filhos">
          {politico.filhos.map((filho) => (
            <MobileNode key={filho.id} politico={filho} nivel={nivel + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export default function MobileTree({ data }) {
  return (
    <ul className="mobile-tree">
      <MobileNode politico={data} nivel={0} />
    </ul>
  )
}
