import { describe, expect, it } from 'vitest'
import {
  corrigirCodigosIbge,
  dataBrParaIso,
  extrairPrefeitosEleitos,
  lerCsvTse,
  mapaTseParaIbge,
  nomesDaConfigTse,
} from './prefeitos.js'

const COLUNAS = [
  'DT_GERACAO', 'ANO_ELEICAO', 'CD_TIPO_ELEICAO', 'NR_TURNO', 'DT_ELEICAO', 'SG_UE', 'NM_UE',
  'CD_CARGO', 'NM_CANDIDATO', 'NM_URNA_CANDIDATO', 'NM_SOCIAL_CANDIDATO', 'SG_PARTIDO', 'DS_SIT_TOT_TURNO',
]

// Monta um CSV no formato do TSE (aspas, ";", CRLF) a partir de objetos parciais.
function csv(linhas) {
  const base = {
    DT_GERACAO: '16/10/2026', ANO_ELEICAO: '2024', CD_TIPO_ELEICAO: '2', NR_TURNO: '1',
    DT_ELEICAO: '06/10/2024', CD_CARGO: '11', NM_SOCIAL_CANDIDATO: '#NULO',
  }
  const corpo = linhas.map((l) => COLUNAS.map((c) => `"${{ ...base, ...l }[c] ?? ''}"`).join(';'))
  return [COLUNAS.map((c) => `"${c}"`).join(';'), ...corpo].join('\r\n') + '\r\n'
}

const TSE_PARA_IBGE = mapaTseParaIbge({
  abr: [
    {
      cd: 'se',
      mu: [
        { cd: '31054', cdi: '2800308', nm: 'ARACAJU' },
        { cd: '31119', cdi: '2800605', nm: 'BARRA DOS COQUEIROS' },
        { cd: '31259', cdi: '2801306', nm: 'CAPELA' },
        { cd: '31232', cdi: '2801207', nm: 'CANINDÉ DE SÃO FRANCISCO' },
      ],
    },
  ],
})

describe('lerCsvTse', () => {
  it('lida com aspas, aspas duplicadas, ";" dentro de aspas e CRLF', () => {
    const linhas = [...lerCsvTse('"a";"b ""c""";3\r\n"x;y";"";\r\n')]
    expect(linhas).toEqual([
      ['a', 'b "c"', '3'],
      ['x;y', '', ''],
    ])
  })
})

describe('dataBrParaIso', () => {
  it('converte dd/mm/aaaa e rejeita o resto', () => {
    expect(dataBrParaIso('27/10/2024')).toBe('2024-10-27')
    expect(dataBrParaIso('#NULO')).toBeNull()
  })
})

describe('extrairPrefeitosEleitos', () => {
  const texto = csv([
    // 1º turno com eleito
    { SG_UE: '31259', NM_UE: 'CAPELA', NM_CANDIDATO: 'FULANO DE TAL', NM_URNA_CANDIDATO: 'FULANO', SG_PARTIDO: 'MDB', DS_SIT_TOT_TURNO: 'ELEITO' },
    { SG_UE: '31259', NM_UE: 'CAPELA', NM_URNA_CANDIDATO: 'BELTRANO', DS_SIT_TOT_TURNO: 'NÃO ELEITO' },
    // vereador eleito no mesmo município: ignorado
    { SG_UE: '31259', NM_UE: 'CAPELA', CD_CARGO: '13', NM_URNA_CANDIDATO: 'VEREADOR X', DS_SIT_TOT_TURNO: 'ELEITO POR QP' },
    // 2º turno: a linha do 1º turno diz "2º TURNO"
    { SG_UE: '31054', NM_UE: 'ARACAJU', NM_URNA_CANDIDATO: 'EMILIA CORREA', NM_CANDIDATO: 'EMÍLIA CORRÊA', SG_PARTIDO: 'PL', DS_SIT_TOT_TURNO: '2º TURNO' },
    { SG_UE: '31054', NM_UE: 'ARACAJU', NR_TURNO: '2', DT_ELEICAO: '27/10/2024', NM_URNA_CANDIDATO: 'EMILIA CORREA', NM_CANDIDATO: 'EMÍLIA CORRÊA', SG_PARTIDO: 'PL', DS_SIT_TOT_TURNO: 'ELEITO' },
    // pleito ordinário sem eleito (votos anulados), mas com suplementar de 2024 para o mandato anterior
    { SG_UE: '31119', NM_UE: 'BARRA DOS COQUEIROS', NM_URNA_CANDIDATO: 'SUB JUDICE', DS_SIT_TOT_TURNO: '#NULO' },
    { SG_UE: '31119', NM_UE: 'BARRA DOS COQUEIROS', CD_TIPO_ELEICAO: '1', NM_URNA_CANDIDATO: 'TAMPAO', DS_SIT_TOT_TURNO: 'ELEITO' },
    // nome social prevalece
    { SG_UE: '31232', NM_UE: 'CANINDÉ', NM_CANDIDATO: 'NOME REGISTRO', NM_SOCIAL_CANDIDATO: 'NOME SOCIAL', NM_URNA_CANDIDATO: 'URNA', DS_SIT_TOT_TURNO: 'ELEITO' },
    // município sem correspondência IBGE
    { SG_UE: '99999', NM_UE: 'DESCONHECIDO', NM_URNA_CANDIDATO: 'X', DS_SIT_TOT_TURNO: 'ELEITO' },
  ])
  const resultado = extrairPrefeitosEleitos(texto, TSE_PARA_IBGE)

  it('pega o eleito do 1º turno com os campos mínimos', () => {
    expect(resultado.municipios['2801306']).toEqual({
      nomeUrna: 'FULANO',
      nomeCompleto: 'FULANO DE TAL',
      partido: 'MDB',
      turno: 1,
      dataEleicao: '2024-10-06',
    })
  })

  it('usa a linha do 2º turno quando houve 2º turno', () => {
    expect(resultado.municipios['2800308']).toMatchObject({ turno: 2, dataEleicao: '2024-10-27', partido: 'PL' })
  })

  it('descarta eleição suplementar e não inventa eleito', () => {
    expect(resultado.municipios['2800605']).toBeUndefined()
    expect(resultado.semEleito).toEqual(['2800605'])
  })

  it('prefere o nome social declarado', () => {
    expect(resultado.municipios['2801207'].nomeCompleto).toBe('NOME SOCIAL')
  })

  it('avisa sobre município sem código IBGE e registra a data de geração do TSE', () => {
    expect(resultado.avisos).toEqual([expect.stringMatching(/99999/)])
    expect(resultado.dadosGeradosEm).toBe('2026-10-16')
  })

  it('dois eleitos no pleito ordinário: não escolhe nenhum', () => {
    const conflito = extrairPrefeitosEleitos(
      csv([
        { SG_UE: '31259', NM_UE: 'CAPELA', NM_URNA_CANDIDATO: 'A', DS_SIT_TOT_TURNO: 'ELEITO' },
        { SG_UE: '31259', NM_UE: 'CAPELA', NM_URNA_CANDIDATO: 'B', DS_SIT_TOT_TURNO: 'ELEITO' },
      ]),
      TSE_PARA_IBGE,
    )
    expect(conflito.municipios).toEqual({})
    expect(conflito.semEleito).toEqual(['2801306'])
    expect(conflito.avisos[0]).toMatch(/2 eleitos/)
  })

  it('falha se o TSE mudar o layout do CSV', () => {
    expect(() => extrairPrefeitosEleitos('"A";"B"\r\n"1";"2"\r\n', TSE_PARA_IBGE)).toThrow(/Coluna ausente/)
  })
})

describe('corrigirCodigosIbge', () => {
  const config = {
    abr: [
      {
        cd: 'mt',
        mu: [
          { cd: '73709', cdi: '5300109', nm: 'BOA ESPERANÇA DO NORTE' },
          { cd: '90670', cdi: '5103403', nm: 'CUIABÁ' },
          { cd: '11111', cdi: '5199999', nm: 'INEXISTENTE' },
        ],
      },
    ],
  }
  const ibge = [
    { 'municipio-id': 5101837, 'municipio-nome': 'Boa Esperança do Norte', 'UF-sigla': 'MT' },
    { 'municipio-id': 5103403, 'municipio-nome': 'Cuiabá', 'UF-sigla': 'MT' },
  ]

  it('corrige código provisório pelo nome na mesma UF e avisa o que não resolveu', () => {
    const mapa = mapaTseParaIbge(config)
    const avisos = corrigirCodigosIbge(mapa, ibge, nomesDaConfigTse(config))
    expect(mapa.get('73709').ibge).toBe('5101837')
    expect(mapa.get('90670').ibge).toBe('5103403')
    expect(mapa.get('11111').ibge).toBe('5199999')
    expect(avisos).toEqual([
      expect.stringMatching(/corrigido.*5300109 → 5101837/),
      expect.stringMatching(/5199999.*não existe/),
    ])
  })
})
