import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../Avatar/Avatar.jsx'
import MandateCard from '../MandateCard/MandateCard.jsx'
import NewsFeed from '../NewsFeed/NewsFeed.jsx'
import { STATUS } from '../../data/mandateData.js'
import { countByStatus, ordenarPorStatus } from '../../lib/status.js'
import './DetailSidebar.css'

// As datas vêm como "AAAA-MM-DD" (sem hora). new Date(iso) interpreta como
// UTC meia-noite; formatar com timeZone America/Sao_Paulo mostraria o dia
// anterior. Fatiar a string evita esse desvio de fuso.
function formatarDataSimples(iso) {
  if (!iso) return null
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

const FILTROS = [
  { chave: 'todos', status: null, rotulo: 'Todos' },
  { chave: STATUS.CUMPRIU, status: STATUS.CUMPRIU, rotulo: 'Cumpridas' },
  { chave: STATUS.EM_PARTE, status: STATUS.EM_PARTE, rotulo: 'Em parte' },
  { chave: STATUS.NAO_CUMPRIU, status: STATUS.NAO_CUMPRIU, rotulo: 'Não cumpridas' },
]

export default function DetailSidebar({ politico, onClose, saindo = false }) {
  const [filtroAtivo, setFiltroAtivo] = useState('todos')

  if (!politico) return null

  const counts = countByStatus(politico.propostas)
  const inicio = formatarDataSimples(politico.mandato?.inicio)
  const fim = formatarDataSimples(politico.mandato?.fim)

  const propostasOrdenadas = ordenarPorStatus(politico.propostas)
  const propostasFiltradas =
    filtroAtivo === 'todos'
      ? propostasOrdenadas
      : propostasOrdenadas.filter((p) => p.status === filtroAtivo)

  const temPropostas = (politico.propostas?.length ?? 0) > 0

  return (
    <aside
      className={`detail-sidebar ${saindo ? 'detail-sidebar--saindo' : ''}`}
      role="dialog"
      aria-label={`Propostas de mandato de ${politico.nome}`}
    >
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

      {politico.noticiasGerais?.length > 0 && (
        <section className="detail-sidebar__noticias-gerais">
          <h3 className="detail-sidebar__subtitulo">Notícias gerais</h3>
          <NewsFeed
            noticias={politico.noticiasGerais}
            limiteColapso={4}
            mostrarParcialAoFechar
          />
        </section>
      )}

      <div className="detail-sidebar__resumo">
        <span>{counts.cumpriu} cumpridas</span>
        <span>{counts.em_parte} em parte</span>
        <span>{counts.nao_cumpriu} não cumpridas</span>
      </div>

      {temPropostas && (
        <div className="detail-sidebar__filtro" role="group" aria-label="Filtrar propostas por status">
          {FILTROS.map((filtro) => {
            const total =
              filtro.status === null ? politico.propostas.length : (counts[filtro.status] ?? 0)
            return (
              <button
                key={filtro.chave}
                type="button"
                className={`detail-sidebar__filtro-botao ${
                  filtroAtivo === filtro.chave ? 'detail-sidebar__filtro-botao--ativo' : ''
                }`}
                aria-pressed={filtroAtivo === filtro.chave}
                onClick={() => setFiltroAtivo(filtro.chave)}
              >
                {filtro.rotulo} ({total})
              </button>
            )
          })}
        </div>
      )}

      <div className="detail-sidebar__lista">
        {!temPropostas && (
          <p className="detail-sidebar__vazio">Nenhuma proposta de mandato registrada.</p>
        )}
        {temPropostas && propostasFiltradas.length === 0 && (
          <p className="detail-sidebar__vazio">Nenhuma proposta nesse status.</p>
        )}
        {propostasFiltradas.map((proposta) => (
          <MandateCard key={proposta.id} proposta={proposta} />
        ))}
      </div>
    </aside>
  )
}
