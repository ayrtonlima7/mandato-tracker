import Avatar from '../Avatar/Avatar.jsx'
import './StateSidebar.css'

export default function StateSidebar({
  nomeEstado,
  grupos,
  politicoSelecionadoId,
  onSelecionarPolitico,
  onClose,
  saindo = false,
}) {
  return (
    <aside
      className={`state-sidebar ${saindo ? 'state-sidebar--saindo' : ''}`}
      role="dialog"
      aria-label={`Políticos de ${nomeEstado}`}
    >
      <button type="button" className="state-sidebar__fechar" onClick={onClose} aria-label="Fechar">
        ×
      </button>

      <h2 className="state-sidebar__titulo">{nomeEstado}</h2>

      {grupos.length === 0 ? (
        <p className="state-sidebar__vazio">Nenhum político cadastrado para este estado ainda.</p>
      ) : (
        grupos.map((grupo) => (
          <section key={grupo.chave} className="state-sidebar__grupo">
            <h3 className="state-sidebar__grupo-titulo">{grupo.rotulo}</h3>
            <ul className="state-sidebar__lista">
              {grupo.itens.map((politico) => (
                <li key={politico.id}>
                  <button
                    type="button"
                    className={`state-sidebar__item ${
                      politico.id === politicoSelecionadoId ? 'state-sidebar__item--selecionado' : ''
                    }`}
                    onClick={() => onSelecionarPolitico(politico)}
                  >
                    <Avatar nome={politico.nome} foto={politico.foto} size={40} />
                    <span className="state-sidebar__item-texto">
                      <strong>{politico.nome}</strong>
                      <small>
                        {politico.cargo}
                        {politico.partido ? ` · ${politico.partido}` : ''}
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </aside>
  )
}
