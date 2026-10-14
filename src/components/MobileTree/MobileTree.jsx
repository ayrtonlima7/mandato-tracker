import { useState } from 'react'
import Avatar from '../Avatar/Avatar.jsx'
import MandateCard from '../MandateCard/MandateCard.jsx'
import { countByStatus } from '../../lib/status.js'
import './MobileTree.css'

function MobileNode({ politico, nivel }) {
  const [filhosAbertos, setFilhosAbertos] = useState(nivel === 0)
  const [propostasAbertas, setPropostasAbertas] = useState(false)
  const counts = countByStatus(politico.propostas)
  const temFilhos = (politico.filhos?.length ?? 0) > 0

  return (
    <li className="mobile-node">
      <div className="mobile-node__card">
        <button
          type="button"
          className="mobile-node__corpo"
          onClick={() => setPropostasAbertas((v) => !v)}
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
            ✔{counts.cumpriu} ◐{counts.em_parte} ✘{counts.nao_cumpriu}
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

      {propostasAbertas && (
        <div className="mobile-node__propostas">
          {politico.propostas?.length ? (
            politico.propostas.map((proposta) => (
              <MandateCard key={proposta.id} proposta={proposta} />
            ))
          ) : (
            <p className="mobile-node__vazio">Nenhuma proposta de mandato registrada.</p>
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
