import { statusMeta } from '../../lib/status.js'
import NewsFeed from '../NewsFeed/NewsFeed.jsx'
import './MandateCard.css'

const TEMA_LABELS = {
  administracao: 'Administração',
  economia: 'Economia',
  educacao: 'Educação',
  esporte: 'Esporte',
  'direitos-humanos': 'Direitos humanos',
  'habitacao-mob': 'Habitação e mobilidade',
  infraestrutura: 'Infraestrutura',
  'meio-ambiente': 'Meio ambiente',
  mobilidade: 'Mobilidade',
  privatizacoes: 'Privatizações',
  saude: 'Saúde',
  seguranca: 'Segurança',
  transparencia: 'Transparência',
}

function temaLabel(tema) {
  if (!tema) return null
  return (
    TEMA_LABELS[tema] ??
    tema.replace(/[-_]/g, ' ').replace(/^(.)/, (c) => c.toUpperCase())
  )
}

export default function MandateCard({ proposta }) {
  const meta = statusMeta(proposta.status)
  const tema = temaLabel(proposta.tema)

  return (
    <article className="mandate-card">
      <header className="mandate-card__header">
        <h4 className="mandate-card__titulo">{proposta.titulo}</h4>
        <span
          className="mandate-card__badge"
          style={{ color: meta.color, borderColor: meta.color }}
        >
          {meta.label}
        </span>
      </header>

      {tema && <span className="mandate-card__tema">{tema}</span>}

      <p className="mandate-card__descricao">{proposta.descricao}</p>

      <div className="mandate-card__feed">
        <NewsFeed
          noticias={proposta.atualizacoes}
          rotulo="Notícias"
          vazioTexto="Sem notícias recentes"
          limiteColapso={0}
        />
      </div>
    </article>
  )
}
