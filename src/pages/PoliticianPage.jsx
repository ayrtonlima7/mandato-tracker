import { Link, useParams } from 'react-router-dom'
import { mandateTree } from '../data/mandateData.js'
import { findPoliticoById } from '../lib/tree.js'
import { countByStatus } from '../lib/status.js'
import Avatar from '../components/Avatar/Avatar.jsx'
import MandateCard from '../components/MandateCard/MandateCard.jsx'
import './PoliticianPage.css'

export default function PoliticianPage() {
  const { id } = useParams()
  const politico = findPoliticoById(mandateTree, id)

  if (!politico) {
    return (
      <div className="politician-page">
        <Link className="politician-page__voltar" to="/">
          ← Voltar para a árvore
        </Link>
        <p>Político não encontrado.</p>
      </div>
    )
  }

  const counts = countByStatus(politico.propostas)

  return (
    <div className="politician-page">
      <Link className="politician-page__voltar" to="/">
        ← Voltar para a árvore
      </Link>

      <header className="politician-page__header">
        <Avatar nome={politico.nome} foto={politico.foto} size={72} />
        <div>
          <h1>{politico.nome}</h1>
          <p>
            {politico.cargo}
            {politico.partido ? ` · ${politico.partido}` : ''}
          </p>
        </div>
      </header>

      <div className="politician-page__resumo">
        <span>{counts.cumpriu} cumpridas</span>
        <span>{counts.em_parte} em parte</span>
        <span>{counts.nao_cumpriu} não cumpridas</span>
      </div>

      <div className="politician-page__lista">
        {politico.propostas?.length ? (
          politico.propostas.map((proposta) => (
            <MandateCard key={proposta.id} proposta={proposta} />
          ))
        ) : (
          <p>Nenhuma proposta de mandato registrada.</p>
        )}
      </div>
    </div>
  )
}
