// Gera public/data/prefeitos-2024/<UF>.json: o(a) prefeito(a) eleito(a) de cada
// município no pleito ordinário de 2024, a partir de dados OFICIAIS do TSE.
//
// - Candidatos: Portal de Dados Abertos do TSE, "Candidatos 2024"
//   (consulta_cand_2024.zip, ~64 MB; um CSV por UF). Só são guardados os campos
//   necessários à interface (nome de urna, nome, partido, turno, data) — nada de
//   CPF, e-mail, título eleitoral etc.
// - Código IBGE: config de municípios do resultado oficial de 2024 do TSE
//   (campo `cdi`), cruzada com a lista de municípios da API de Localidades do IBGE.
// - Os arquivos ficam em public/ e são baixados pelo navegador só quando o
//   usuário entra no estado (não vão para o bundle).
// - Resultado de eleição passada praticamente não muda: rodar à mão quando
//   necessário (não faz parte do cron diário/semanal).
//
// Uso: node scripts/data-pipeline/fetch-prefeitos.js [caminho/local/consulta_cand_2024.zip]

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extrairEntrada } from './lib/zip.js'
import {
  MANDATO_2024,
  corrigirCodigosIbge,
  extrairPrefeitosEleitos,
  mapaTseParaIbge,
  nomesDaConfigTse,
} from './lib/prefeitos.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')
const SAIDA_DIR = path.join(ROOT, 'public', 'data', 'prefeitos-2024')

const UA = 'mandato-tracker/0.1 (https://github.com/ayrtonlima7/mandato-tracker)'
const URL_PORTAL = 'https://dadosabertos.tse.jus.br/dataset/candidatos-2024'
const URL_ZIP = 'https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2024.zip'
const URL_CONFIG_MUNICIPIOS = 'https://resultados.tse.jus.br/oficial/ele2024/619/config/mun-e000619-cm.json'
const URL_IBGE_MUNICIPIOS = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado'

// UFs com eleição municipal (o DF não tem municípios nem prefeito).
const UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
  'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

async function baixar(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} para ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  const zipLocal = process.argv[2]
  console.log('→ Correspondência TSE → IBGE (config oficial do resultado de 2024)…')
  const config = JSON.parse((await baixar(URL_CONFIG_MUNICIPIOS)).toString('utf8'))
  const tseParaIbge = mapaTseParaIbge(config)

  console.log('→ Lista oficial de municípios do IBGE…')
  const ibge = JSON.parse((await baixar(URL_IBGE_MUNICIPIOS)).toString('utf8'))
  const ufPorCodigoIbge = new Map(ibge.map((m) => [String(m['municipio-id']), m['UF-sigla']]))
  const avisos = corrigirCodigosIbge(tseParaIbge, ibge, nomesDaConfigTse(config))

  console.log(zipLocal ? `→ Lendo ${zipLocal}…` : `→ Baixando ${URL_ZIP} (~64 MB)…`)
  const zip = zipLocal ? readFileSync(zipLocal) : await baixar(URL_ZIP)

  mkdirSync(SAIDA_DIR, { recursive: true })
  // Data (sem hora) exibida na interface: no fuso de Brasília, não em UTC —
  // o cron do projeto roda às 22h BRT, quando em UTC já é o dia seguinte.
  const coletadoEm = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
  let totalEleitos = 0
  let totalSemEleito = 0

  for (const uf of UFS) {
    // Os CSVs do TSE vêm em Latin-1.
    const csv = new TextDecoder('latin1').decode(extrairEntrada(zip, `consulta_cand_2024_${uf}.csv`))
    const resultado = extrairPrefeitosEleitos(csv, tseParaIbge)

    // Sanidade: todo código IBGE precisa existir na lista do IBGE e ser da UF.
    for (const codigo of [...Object.keys(resultado.municipios), ...resultado.semEleito]) {
      const ufIbge = ufPorCodigoIbge.get(codigo)
      if (ufIbge !== uf) avisos.push(`${uf}: código IBGE ${codigo} pertence a "${ufIbge ?? 'nenhuma UF'}".`)
    }
    avisos.push(...resultado.avisos.map((a) => `${uf}: ${a}`))

    const eleitos = Object.keys(resultado.municipios).length
    totalEleitos += eleitos
    totalSemEleito += resultado.semEleito.length

    const arquivo = {
      uf,
      eleicao: 'Eleições Municipais 2024 (pleito ordinário)',
      fonte: {
        nome: 'TSE — Portal de Dados Abertos: Candidatos 2024',
        url: URL_PORTAL,
        arquivo: URL_ZIP,
        correspondenciaIbge: URL_CONFIG_MUNICIPIOS,
        dadosGeradosEm: resultado.dadosGeradosEm,
      },
      coletadoEm,
      mandato: MANDATO_2024,
      municipios: resultado.municipios,
      semEleito: resultado.semEleito,
    }
    writeFileSync(path.join(SAIDA_DIR, `${uf}.json`), JSON.stringify(arquivo) + '\n')
    console.log(`  ${uf}: ${eleitos} eleitos, ${resultado.semEleito.length} sem eleito`)
  }

  console.log(`✅ ${totalEleitos} prefeitos eleitos; ${totalSemEleito} municípios sem eleito no pleito ordinário.`)
  if (avisos.length) {
    console.warn(`⚠️  ${avisos.length} aviso(s):`)
    for (const a of avisos) console.warn('  - ' + a)
  }
  // Cobertura muito baixa indica mudança de formato no TSE, não realidade.
  if (totalEleitos < 5000) {
    console.error('❌ Cobertura abaixo do esperado (< 5000 eleitos): verifique o formato dos dados do TSE.')
    process.exit(1)
  }
}

main().catch((erro) => {
  console.error(erro)
  process.exit(1)
})
