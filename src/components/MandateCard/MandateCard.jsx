import { useState } from 'react'
import { statusMeta } from '../../lib/status.js'
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

function formatarData(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function ordenarAtualizacoes(atualizacoes) {
  return [...(atualizacoes ?? [])].sort((a, b) => {
    const ta = a.data ? new Date(a.data).getTime() : NaN
    const tb = b.data ? new Date(b.data).getTime() : NaN
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
    if (Number.isNaN(ta)) return 1
    if (Number.isNaN(tb)) return -1
    return tb - ta
  })
}

export default function MandateCard({ proposta }) {
  const [feedAberto, setFeedAberto] = useState(false)
  const meta = statusMeta(proposta.status)
  const tema = temaLabel(proposta.tema)
  const atualizacoes = ordenarAtualizacoes(proposta.atualizacoes)

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
        {atualizacoes.length > 0 ? (
          <>
            <button
              type="button"
              className="mandate-card__feed-toggle"
              aria-expanded={feedAberto}
              onClick={() => setFeedAberto((v) => !v)}
            >
              {feedAberto ? '–' : '+'} Notícias ({atualizacoes.length})
            </button>

            {feedAberto && (
              <ol className="mandate-card__noticias">
                {atualizacoes.map((noticia, i) => {
                  const data = formatarData(noticia.data)
                  return (
                    <li key={`${noticia.url}-${i}`} className="mandate-card__noticia">
                      {data && <span className="mandate-card__noticia-data">{data}</span>}
                      <a
                        className="mandate-card__noticia-titulo"
                        href={noticia.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {noticia.titulo}
                      </a>
                      {noticia.fonte && (
                        <span className="mandate-card__noticia-fonte">{noticia.fonte}</span>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </>
        ) : (
          <p className="mandate-card__sem-noticias">Sem notícias recentes</p>
        )}
      </div>
    </article>
  )
}
