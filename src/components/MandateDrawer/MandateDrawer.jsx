import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../Avatar/Avatar.jsx'
import MandateCard from '../MandateCard/MandateCard.jsx'
import { countByStatus } from '../../lib/status.js'
import './MandateDrawer.css'

export default function MandateDrawer({ politico, onClose }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!politico) return null

  const counts = countByStatus(politico.propostas)

  return (
    <div className="mandate-drawer__overlay" onClick={onClose}>
      <aside
        className="mandate-drawer"
        role="dialog"
        aria-label={`Propostas de mandato de ${politico.nome}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="mandate-drawer__fechar" onClick={onClose} aria-label="Fechar">
          ×
        </button>

        <header className="mandate-drawer__header">
          <Avatar nome={politico.nome} foto={politico.foto} size={64} />
          <div>
            <h2 className="mandate-drawer__nome">{politico.nome}</h2>
            <p className="mandate-drawer__cargo">
              {politico.cargo}
              {politico.partido ? ` · ${politico.partido}` : ''}
            </p>
            <Link className="mandate-drawer__link-pagina" to={`/politico/${politico.id}`}>
              Ver página completa →
            </Link>
          </div>
        </header>

        <div className="mandate-drawer__resumo">
          <span>{counts.cumpriu} cumpridas</span>
          <span>{counts.em_parte} em parte</span>
          <span>{counts.nao_cumpriu} não cumpridas</span>
        </div>

        <div className="mandate-drawer__lista">
          {politico.propostas?.length ? (
            politico.propostas.map((proposta) => (
              <MandateCard key={proposta.id} proposta={proposta} />
            ))
          ) : (
            <p className="mandate-drawer__vazio">Nenhuma proposta de mandato registrada.</p>
          )}
        </div>
      </aside>
    </div>
  )
}
