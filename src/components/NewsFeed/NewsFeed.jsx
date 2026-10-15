import { useState } from 'react'
import { formatarDataNoticia, ordenarNoticiasPorData } from '../../lib/noticias.js'
import './NewsFeed.css'

// Lista de notícias reutilizada pelo feed de uma proposta (MandateCard) e
// pela seção "Notícias gerais" do político (DetailSidebar). `limiteColapso`
// decide quando o botão de recolher aparece: 0 = colapsa pra zero itens
// quando fechado (comportamento original do MandateCard); N>0 com
// `mostrarParcialAoFechar` = mantém os N primeiros visíveis e revela o
// resto ao clicar (usado pela seção "Notícias gerais").
export default function NewsFeed({
  noticias,
  rotulo = 'Notícias',
  vazioTexto = null,
  limiteColapso = null,
  mostrarParcialAoFechar = false,
}) {
  const [aberto, setAberto] = useState(false)
  const lista = ordenarNoticiasPorData(noticias)

  if (lista.length === 0) {
    return vazioTexto ? <p className="news-feed__vazio">{vazioTexto}</p> : null
  }

  const precisaColapsar = limiteColapso != null && lista.length > limiteColapso
  const fechado = precisaColapsar && !aberto
  const visiveis = fechado ? (mostrarParcialAoFechar ? lista.slice(0, limiteColapso) : []) : lista

  const botao = precisaColapsar && (
    <button
      type="button"
      className="news-feed__toggle"
      aria-expanded={aberto}
      onClick={() => setAberto((v) => !v)}
    >
      {mostrarParcialAoFechar
        ? aberto
          ? '– Mostrar menos'
          : `+ Ver mais (${lista.length - limiteColapso})`
        : `${aberto ? '–' : '+'} ${rotulo} (${lista.length})`}
    </button>
  )

  const classeLista = `news-feed__lista ${fechado && mostrarParcialAoFechar ? 'news-feed__lista--parcial' : ''}`.trim()

  const listaEl = visiveis.length > 0 && (
    <ol className={classeLista}>
      {visiveis.map((noticia, i) => {
        const data = formatarDataNoticia(noticia.data)
        return (
          <li key={`${noticia.url}-${i}`} className="news-feed__item">
            {data && <span className="news-feed__data">{data}</span>}
            <a className="news-feed__titulo" href={noticia.url} target="_blank" rel="noopener noreferrer">
              {noticia.titulo}
            </a>
            {noticia.fonte && <span className="news-feed__fonte">{noticia.fonte}</span>}
          </li>
        )
      })}
    </ol>
  )

  return (
    <div className="news-feed">
      {mostrarParcialAoFechar ? (
        <>
          {listaEl}
          {botao}
        </>
      ) : (
        <>
          {botao}
          {listaEl}
        </>
      )}
    </div>
  )
}
