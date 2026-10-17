import { useId, useMemo, useState } from 'react'
import { filtrarMunicipios } from '../../lib/municipios.js'

// Estados densos (MG: 853 municípios) não devem despejar centenas de botões
// de uma vez: mostra os primeiros e pede para refinar a busca.
const LIMITE_LISTA = 60

export default function ListaMunicipios({ municipios, municipioSelecionado, onSelecionar, onRecarregar }) {
  const [termo, setTermo] = useState('')
  const idBusca = useId()
  const lista = municipios?.status === 'pronto' ? municipios.dados : null
  const filtrados = useMemo(() => (lista ? filtrarMunicipios(lista, termo) : []), [lista, termo])
  const visiveis = filtrados.slice(0, LIMITE_LISTA)

  return (
    <section className="state-sidebar__grupo state-sidebar__municipios" aria-labelledby={`${idBusca}-titulo`}>
      <h3 id={`${idBusca}-titulo`} className="state-sidebar__grupo-titulo">
        Municípios{lista ? ` (${lista.length})` : ''}
      </h3>

      {municipios?.status === 'carregando' && (
        <p className="state-sidebar__vazio">Carregando municípios do IBGE…</p>
      )}

      {municipios?.status === 'erro' && (
        <div className="state-sidebar__erro" role="alert">
          <p>Não foi possível carregar a lista de municípios do IBGE.</p>
          <button type="button" className="state-sidebar__botao" onClick={onRecarregar}>
            Tentar novamente
          </button>
        </div>
      )}

      {lista && lista.length === 0 && (
        <p className="state-sidebar__vazio">O IBGE não retornou municípios para este estado.</p>
      )}

      {lista && lista.length > 0 && (
        <>
          <label className="state-sidebar__busca-rotulo" htmlFor={idBusca}>
            Buscar município
          </label>
          <input
            id={idBusca}
            type="search"
            className="state-sidebar__busca"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Digite o nome…"
            autoComplete="off"
          />
          <p className="state-sidebar__contagem" role="status" aria-live="polite">
            {filtrados.length === 0
              ? 'Nenhum município encontrado.'
              : filtrados.length > LIMITE_LISTA
                ? `Mostrando ${LIMITE_LISTA} de ${filtrados.length}. Digite para filtrar.`
                : `${filtrados.length} município${filtrados.length > 1 ? 's' : ''}.`}
          </p>
          <ul className="state-sidebar__lista state-sidebar__lista--municipios">
            {visiveis.map((m) => (
              <li key={m.codigo}>
                <button
                  type="button"
                  className={`state-sidebar__municipio ${
                    m.codigo === municipioSelecionado ? 'state-sidebar__municipio--selecionado' : ''
                  }`}
                  aria-pressed={m.codigo === municipioSelecionado}
                  onClick={() => onSelecionar(m)}
                >
                  {m.nome}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
