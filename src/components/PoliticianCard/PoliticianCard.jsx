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
  const counts = countByStatus(politico.propostas)
  const totalPropostas = politico.propostas?.length ?? 0

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
        <span className="politician-card__contagem" title="Cumpridas">
          ✔ {counts.cumpriu}
        </span>
        <span className="politician-card__contagem" title="Em parte">
          ◐ {counts.em_parte}
        </span>
        <span className="politician-card__contagem" title="Não cumpridas">
          ✘ {counts.nao_cumpriu}
        </span>
        <span className="politician-card__total">{totalPropostas} propostas</span>
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
