// Regras para extrair, dos dados abertos do TSE ("Candidatos 2024"), o(a)
// prefeito(a) eleito(a) de cada município no pleito ORDINÁRIO de 2024.
//
// Armadilhas verificadas nos dados reais:
//   - O arquivo de 2024 também traz eleições SUPLEMENTARES realizadas em 2024
//     para completar mandatos 2021–2024 (CD_TIPO_ELEICAO = 1). Elas não são o
//     pleito de 2024 e são descartadas — senão ~11 municípios teriam dois eleitos.
//   - Municípios com 2º turno têm a linha do 1º turno marcada "2º TURNO" e a
//     do 2º turno marcada "ELEITO".
//   - Há municípios sem nenhum "ELEITO" no pleito ordinário (votação anulada,
//     candidatura sub judice etc.): ficam em `semEleito`, nunca são inventados.
//   - O código de município do TSE (SG_UE) não é o do IBGE; a correspondência
//     oficial vem do próprio TSE (config de municípios do resultado, campo `cdi`).

export const CD_CARGO_PREFEITO = '11'
export const CD_TIPO_ELEICAO_ORDINARIA = '2'
// Mandato dos eleitos no pleito ordinário de 2024 (CF, art. 29, I e III).
export const MANDATO_2024 = { inicio: '2025-01-01', fim: '2028-12-31' }

const NULOS = new Set(['', '#NULO', '#NULO#', '#NE', '#NE#'])

export function valorOuNulo(valor) {
  const v = String(valor ?? '').trim()
  return NULOS.has(v) ? null : v
}

// "06/10/2024" → "2024-10-06"
export function dataBrParaIso(data) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(data ?? '').trim())
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null
}

// CSV do TSE: separador ";", campos opcionalmente entre aspas, aspas internas
// duplicadas (""), linhas terminadas em \r\n. Gera um array de campos por linha.
export function* lerCsvTse(texto) {
  let campo = ''
  let linha = []
  let entreAspas = false

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (entreAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"'
          i++
        } else {
          entreAspas = false
        }
      } else {
        campo += c
      }
    } else if (c === '"') {
      entreAspas = true
    } else if (c === ';') {
      linha.push(campo)
      campo = ''
    } else if (c === '\n') {
      linha.push(campo)
      yield linha
      linha = []
      campo = ''
    } else if (c !== '\r') {
      campo += c
    }
  }
  if (campo !== '' || linha.length) {
    linha.push(campo)
    yield linha
  }
}

// Config de municípios do resultado do TSE → Map(código TSE → { ibge, uf }).
export function mapaTseParaIbge(config) {
  const mapa = new Map()
  for (const estado of config?.abr ?? []) {
    for (const m of estado.mu ?? []) {
      if (/^\d{7}$/.test(String(m.cdi ?? ''))) {
        mapa.set(String(m.cd).padStart(5, '0'), { ibge: String(m.cdi), uf: estado.cd.toUpperCase() })
      }
    }
  }
  return mapa
}

function normalizarNome(nome) {
  return String(nome ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toUpperCase()
}

// A config do TSE pode trazer código provisório para município recém-criado
// (ex.: Boa Esperança do Norte/MT veio como 5300109, que nem é código de MT; o
// IBGE usa 5101837). Quando o `cdi` não existe na lista do IBGE para aquela UF,
// procura o município de mesmo nome (normalizado) na mesma UF — e só corrige se
// houver exatamente um. Muta o mapa e devolve a lista de correções/pendências.
export function corrigirCodigosIbge(tseParaIbge, localidadesIbge, nomesTse = new Map()) {
  const ufPorCodigo = new Map(localidadesIbge.map((m) => [String(m['municipio-id']), m['UF-sigla']]))
  const porUfENome = new Map()
  for (const m of localidadesIbge) {
    const chave = `${m['UF-sigla']}|${normalizarNome(m['municipio-nome'])}`
    porUfENome.set(chave, [...(porUfENome.get(chave) ?? []), String(m['municipio-id'])])
  }

  const avisos = []
  for (const [cd, entrada] of tseParaIbge) {
    if (ufPorCodigo.get(entrada.ibge) === entrada.uf) continue
    const nome = nomesTse.get(cd)
    const candidatos = porUfENome.get(`${entrada.uf}|${normalizarNome(nome)}`) ?? []
    if (nome && candidatos.length === 1) {
      avisos.push(`Código IBGE corrigido para ${nome}/${entrada.uf} (TSE ${cd}): ${entrada.ibge} → ${candidatos[0]}.`)
      entrada.ibge = candidatos[0]
    } else {
      avisos.push(`Código IBGE ${entrada.ibge} (TSE ${cd}, ${nome ?? '?'}/${entrada.uf}) não existe no IBGE para a UF.`)
    }
  }
  return avisos
}

export function nomesDaConfigTse(config) {
  const nomes = new Map()
  for (const estado of config?.abr ?? []) {
    for (const m of estado.mu ?? []) nomes.set(String(m.cd).padStart(5, '0'), m.nm)
  }
  return nomes
}

export function extrairPrefeitosEleitos(textoCsv, tseParaIbge) {
  const linhas = lerCsvTse(textoCsv)
  const cabecalho = linhas.next().value ?? []
  const col = Object.fromEntries(cabecalho.map((nome, i) => [nome, i]))
  const obrigatorias = ['SG_UE', 'CD_CARGO', 'CD_TIPO_ELEICAO', 'DS_SIT_TOT_TURNO', 'NM_URNA_CANDIDATO']
  for (const nome of obrigatorias) {
    if (!(nome in col)) throw new Error(`Coluna ausente no CSV do TSE: ${nome}`)
  }

  const porUe = new Map()
  let dadosGeradosEm = null

  for (const campos of linhas) {
    if (campos.length < cabecalho.length) continue
    const v = (nome) => campos[col[nome]]
    dadosGeradosEm ??= dataBrParaIso(v('DT_GERACAO'))
    if (v('ANO_ELEICAO') !== '2024') continue
    if (v('CD_TIPO_ELEICAO') !== CD_TIPO_ELEICAO_ORDINARIA) continue
    if (v('CD_CARGO') !== CD_CARGO_PREFEITO) continue

    const ue = String(v('SG_UE')).padStart(5, '0')
    if (!porUe.has(ue)) porUe.set(ue, { nomeUe: v('NM_UE'), eleitos: [] })
    if (v('DS_SIT_TOT_TURNO') !== 'ELEITO') continue

    porUe.get(ue).eleitos.push({
      nomeUrna: valorOuNulo(v('NM_URNA_CANDIDATO')),
      // Nome social, quando declarado, prevalece sobre o nome de registro.
      nomeCompleto: valorOuNulo(v('NM_SOCIAL_CANDIDATO')) ?? valorOuNulo(v('NM_CANDIDATO')),
      partido: valorOuNulo(v('SG_PARTIDO')),
      turno: Number(v('NR_TURNO')) || null,
      dataEleicao: dataBrParaIso(v('DT_ELEICAO')),
    })
  }

  const municipios = {}
  const semEleito = []
  const avisos = []

  for (const [ue, { nomeUe, eleitos }] of porUe) {
    const ibge = tseParaIbge.get(ue)?.ibge
    if (!ibge) {
      avisos.push(`Sem código IBGE para o município TSE ${ue} (${nomeUe}).`)
      continue
    }
    if (eleitos.length === 1) {
      municipios[ibge] = eleitos[0]
    } else {
      if (eleitos.length > 1) {
        avisos.push(`${eleitos.length} eleitos no pleito ordinário em ${nomeUe} (TSE ${ue}): ignorado.`)
      }
      semEleito.push(ibge)
    }
  }

  return { municipios, semEleito: semEleito.sort(), avisos, dadosGeradosEm }
}
