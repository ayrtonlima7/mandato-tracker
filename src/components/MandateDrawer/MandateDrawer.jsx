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

  const counts = countByStatus(politico.planos)

  return (
    <div className="mandate-drawer__overlay" onClick={onClose}>
      <aside
        className="mandate-drawer"
        role="dialog"
        aria-label={`Planos de mandato de ${politico.nome}`}
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
          <span>{counts.concluido} concluídos</span>
          <span>{counts.em_andamento} em andamento</span>
          <span>{counts.nao_iniciado} não iniciados</span>
          <span>{counts.abandonado} abandonados</span>
        </div>

        <div className="mandate-drawer__lista">
          {politico.planos?.length ? (
            politico.planos.map((plano) => <MandateCard key={plano.id} plano={plano} />)
          ) : (
            <p className="mandate-drawer__vazio">Nenhum plano de mandato registrado.</p>
          )}
        </div>
      </aside>
    </div>
  )
}
