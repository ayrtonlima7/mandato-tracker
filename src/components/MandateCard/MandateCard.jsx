import { statusMeta } from '../../lib/status.js'
import ProgressBar from '../ProgressBar/ProgressBar.jsx'
import './MandateCard.css'

export default function MandateCard({ plano }) {
  const meta = statusMeta(plano.status)

  return (
    <article className="mandate-card">
      <header className="mandate-card__header">
        <h4 className="mandate-card__titulo">{plano.titulo}</h4>
        <span
          className="mandate-card__badge"
          style={{ color: meta.color, borderColor: meta.color }}
        >
          {meta.label}
        </span>
      </header>

      <p className="mandate-card__descricao">{plano.descricao}</p>

      <ProgressBar progresso={plano.progresso} status={plano.status} />

      {plano.marcos?.length > 0 && (
        <ol className="mandate-card__timeline">
          {plano.marcos.map((marco) => (
            <li
              key={marco.titulo}
              className={marco.concluido ? 'is-feito' : 'is-pendente'}
            >
              <span className="mandate-card__marco-ponto" />
              <span className="mandate-card__marco-texto">{marco.titulo}</span>
              <span className="mandate-card__marco-data">{marco.data}</span>
            </li>
          ))}
        </ol>
      )}
    </article>
  )
}
