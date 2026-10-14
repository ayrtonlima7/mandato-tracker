import { Link } from 'react-router-dom'
import Avatar from '../Avatar/Avatar.jsx'
import MandateCard from '../MandateCard/MandateCard.jsx'
import { countByStatus } from '../../lib/status.js'
import './DetailSidebar.css'

// As datas vêm como "AAAA-MM-DD" (sem hora). new Date(iso) interpreta como
// UTC meia-noite; formatar com timeZone America/Sao_Paulo mostraria o dia
// anterior. Fatiar a string evita esse desvio de fuso.
function formatarDataSimples(iso) {
  if (!iso) return null
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

export default function DetailSidebar({ politico, onClose }) {
  if (!politico) return null

  const counts = countByStatus(politico.propostas)
  const inicio = formatarDataSimples(politico.mandato?.inicio)
  const fim = formatarDataSimples(politico.mandato?.fim)

  return (
    <aside className="detail-sidebar" role="dialog" aria-label={`Propostas de mandato de ${politico.nome}`}>
      <button type="button" className="detail-sidebar__fechar" onClick={onClose} aria-label="Fechar">
        ×
      </button>

      <header className="detail-sidebar__header">
        <Avatar nome={politico.nome} foto={politico.foto} size={64} />
        <div>
          <h2 className="detail-sidebar__nome">{politico.nome}</h2>
          <p className="detail-sidebar__cargo">
            {politico.cargo}
            {politico.partido ? ` · ${politico.partido}` : ''}
          </p>
          {(inicio || fim) && (
            <p className="detail-sidebar__mandato">
              Mandato: {inicio ?? '?'} – {fim ?? '?'}
            </p>
          )}
          <Link className="detail-sidebar__link-pagina" to={`/politico/${politico.id}`}>
            Ver página completa →
          </Link>
        </div>
      </header>

      <div className="detail-sidebar__resumo">
        <span>{counts.cumpriu} cumpridas</span>
        <span>{counts.em_parte} em parte</span>
        <span>{counts.nao_cumpriu} não cumpridas</span>
      </div>

      <div className="detail-sidebar__lista">
        {politico.propostas?.length ? (
          politico.propostas.map((proposta) => <MandateCard key={proposta.id} proposta={proposta} />)
        ) : (
          <p className="detail-sidebar__vazio">Nenhuma proposta de mandato registrada.</p>
        )}
      </div>
    </aside>
  )
}
