import Avatar from '../Avatar/Avatar.jsx'
import { UF_NOME } from '../../lib/estados.js'
import {
  FONTE_IBGE,
  SEM_PREFEITURA,
  formatarDataIso,
  formatarNomeProprio,
  prefeitoDoMunicipio,
} from '../../lib/municipios.js'
// Mesmo contêiner (largura, slide, tela cheia no mobile) do painel de detalhes
// do político: os dois ocupam o mesmo lugar e nunca aparecem juntos.
import '../DetailSidebar/DetailSidebar.css'
import './MunicipioSidebar.css'

function Prefeito({ situacao, dados }) {
  if (situacao.tipo === 'sem-prefeitura') {
    return <p className="municipio-sidebar__aviso">{situacao.mensagem}</p>
  }
  if (situacao.tipo === 'sem-dados') {
    return (
      <p className="municipio-sidebar__aviso">
        Os dados de prefeitos eleitos ainda não estão disponíveis para este estado.
      </p>
    )
  }
  if (situacao.tipo === 'sem-eleito') {
    return (
      <p className="municipio-sidebar__aviso">
        O TSE não registra candidato(a) eleito(a) para prefeito(a) neste município no pleito
        ordinário de 2024 (por exemplo, votação anulada ou candidatura sub judice). Uma eleição
        suplementar posterior, se houve, não está coberta aqui.
      </p>
    )
  }
  if (situacao.tipo === 'nao-encontrado') {
    return (
      <p className="municipio-sidebar__aviso">
        Não há registro de prefeito(a) eleito(a) em 2024 para este município nos dados do TSE.
      </p>
    )
  }

  const { nomeUrna, nomeCompleto, partido, turno, dataEleicao } = situacao.registro
  const nome = formatarNomeProprio(nomeUrna)
  const mandato = dados.mandato

  return (
    <div className="municipio-sidebar__prefeito">
      <Avatar nome={nome} size={56} />
      <div>
        <strong className="municipio-sidebar__prefeito-nome">{nome}</strong>
        {nomeCompleto && nomeCompleto !== nomeUrna && (
          <small className="municipio-sidebar__nome-civil">
            Nome civil: {formatarNomeProprio(nomeCompleto)}
          </small>
        )}
        <dl className="municipio-sidebar__dados">
          {partido && (
            <>
              <dt>Partido na eleição</dt>
              <dd>{partido}</dd>
            </>
          )}
          {turno && (
            <>
              <dt>Eleito(a) no</dt>
              <dd>
                {turno}º turno{dataEleicao ? `, ${formatarDataIso(dataEleicao)}` : ''}
              </dd>
            </>
          )}
          {mandato?.inicio && mandato?.fim && (
            <>
              <dt>Mandato previsto</dt>
              <dd>
                {formatarDataIso(mandato.inicio)} – {formatarDataIso(mandato.fim)}
              </dd>
            </>
          )}
        </dl>
      </div>
    </div>
  )
}

export default function MunicipioSidebar({
  municipio,
  prefeitos,
  onRecarregarPrefeitos,
  onClose,
  saindo = false,
}) {
  // O estado de prefeitos pode ser de outra UF por um instante (troca de estado
  // durante a animação): nesse caso, trata como ainda carregando.
  const prefeitosDaUf = prefeitos?.uf === municipio.uf ? prefeitos : null
  // Sem prefeitura por desenho institucional (Brasília, Fernando de Noronha):
  // a resposta não depende do arquivo do TSE, então nem espera/erra por ele.
  const status = SEM_PREFEITURA[municipio.codigo] ? 'pronto' : (prefeitosDaUf?.status ?? 'carregando')
  const dados = prefeitosDaUf?.dados ?? null

  return (
    <aside
      className={`detail-sidebar municipio-sidebar ${saindo ? 'detail-sidebar--saindo' : ''}`}
      role="dialog"
      aria-label={`Prefeitura de ${municipio.nome}`}
    >
      <button
        type="button"
        className="detail-sidebar__fechar"
        onClick={onClose}
        aria-label={`Fechar ${municipio.nome} e voltar ao estado`}
      >
        ×
      </button>

      <header className="detail-sidebar__header">
        <div>
          <h2 className="detail-sidebar__nome">{municipio.nome}</h2>
          <p className="detail-sidebar__cargo">
            {UF_NOME[municipio.uf]} ({municipio.uf}) · código IBGE {municipio.codigo}
          </p>
        </div>
      </header>

      <section className="municipio-sidebar__secao" aria-labelledby="municipio-sidebar-prefeito">
        <h3 id="municipio-sidebar-prefeito" className="detail-sidebar__subtitulo">
          Prefeito(a) eleito(a) em 2024
        </h3>

        {status === 'carregando' && (
          <p className="municipio-sidebar__aviso" role="status">
            Carregando resultado do TSE…
          </p>
        )}

        {status === 'erro' && (
          <div className="municipio-sidebar__aviso municipio-sidebar__aviso--erro" role="alert">
            <p>Não foi possível carregar os dados de prefeitos.</p>
            <button type="button" className="municipio-sidebar__botao" onClick={onRecarregarPrefeitos}>
              Tentar novamente
            </button>
          </div>
        )}

        {status === 'pronto' && (
          <Prefeito situacao={prefeitoDoMunicipio(dados, municipio.codigo)} dados={dados} />
        )}

        <p className="municipio-sidebar__ressalva">
          Resultado oficial da eleição de 2024 — não confirma quem ocupa o cargo hoje. Cassações,
          renúncias, afastamentos e eleições suplementares posteriores não são acompanhados.
        </p>
      </section>

      <footer className="municipio-sidebar__fontes">
        <h3 className="detail-sidebar__subtitulo">Fontes</h3>
        <ul>
          {dados?.fonte && (
            <li>
              <a href={dados.fonte.url} target="_blank" rel="noreferrer">
                {dados.fonte.nome}
              </a>
              {dados.fonte.dadosGeradosEm &&
                ` — arquivo gerado pelo TSE em ${formatarDataIso(dados.fonte.dadosGeradosEm)}`}
              {dados.coletadoEm && `; coletado em ${formatarDataIso(dados.coletadoEm)}`}.
            </li>
          )}
          <li>
            Limites e nomes dos municípios:{' '}
            <a href={FONTE_IBGE.url} target="_blank" rel="noreferrer">
              {FONTE_IBGE.nome}
            </a>
            .
          </li>
        </ul>
      </footer>
    </aside>
  )
}
