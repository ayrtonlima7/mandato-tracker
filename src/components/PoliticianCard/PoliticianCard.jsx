import Avatar from '../Avatar/Avatar.jsx'
import { countByStatus } from '../../lib/status.js'
import './PoliticianCard.css'

export default function PoliticianCard({
  politico,
  hasChildren,
  collapsed,
  onToggleCollapse,
  onAbrirPlanos,
}) {
  const counts = countByStatus(politico.planos)
  const totalPlanos = politico.planos?.length ?? 0

  return (
    <div
      className="politician-card"
      role="button"
      tabIndex={0}
      onClick={() => onAbrirPlanos(politico)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onAbrirPlanos(politico)
      }}
    >
      <div className="politician-card__topo">
        <Avatar nome={politico.nome} foto={politico.foto} size={48} />
        <div className="politician-card__texto">
          <h3 className="politician-card__nome">{politico.nome}</h3>
          <p className="politician-card__cargo">{politico.cargo}</p>
          {politico.partido && <span className="politician-card__partido">{politico.partido}</span>}
        </div>
      </div>

      <div className="politician-card__rodape">
        <span className="politician-card__contagem" title="Concluídos">
          ✔ {counts.concluido}
        </span>
        <span className="politician-card__contagem" title="Em andamento">
          ↻ {counts.em_andamento}
        </span>
        <span className="politician-card__total">{totalPlanos} planos</span>
      </div>

      {hasChildren && (
        <button
          type="button"
          className="politician-card__chevron"
          aria-label={collapsed ? 'Expandir subordinados' : 'Recolher subordinados'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse(politico.id)
          }}
        >
          {collapsed ? '+' : '–'}
        </button>
      )}
    </div>
  )
}
