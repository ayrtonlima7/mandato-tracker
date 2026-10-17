import { describe, expect, it } from 'vitest'
import zlib from 'node:zlib'
import { extrairEntrada, listarEntradas } from './zip.js'

// Monta um ZIP mínimo (cabeçalhos locais + diretório central + registro final).
function montarZip(arquivos) {
  const locais = []
  const centrais = []
  let offset = 0
  for (const { nome, conteudo, metodo, crc } of arquivos) {
    const nomeBuf = Buffer.from(nome)
    const dados = metodo === 8 ? zlib.deflateRawSync(conteudo) : conteudo
    const crcFinal = crc ?? zlib.crc32(conteudo)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(metodo, 8)
    local.writeUInt32LE(crcFinal, 14)
    local.writeUInt32LE(dados.length, 18)
    local.writeUInt32LE(conteudo.length, 22)
    local.writeUInt16LE(nomeBuf.length, 26)
    locais.push(local, nomeBuf, dados)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(metodo, 10)
    central.writeUInt32LE(crcFinal, 16)
    central.writeUInt32LE(dados.length, 20)
    central.writeUInt32LE(conteudo.length, 24)
    central.writeUInt16LE(nomeBuf.length, 28)
    central.writeUInt32LE(offset, 42)
    centrais.push(central, nomeBuf)

    offset += 30 + nomeBuf.length + dados.length
  }
  const diretorio = Buffer.concat(centrais)
  const fim = Buffer.alloc(22)
  fim.writeUInt32LE(0x06054b50, 0)
  fim.writeUInt16LE(arquivos.length, 8)
  fim.writeUInt16LE(arquivos.length, 10)
  fim.writeUInt32LE(diretorio.length, 12)
  fim.writeUInt32LE(offset, 16)
  return Buffer.concat([...locais, diretorio, fim])
}

const latin1 = Buffer.from('"NM_UE"\r\n"SÃO PAULO"\r\n', 'latin1')

describe('leitor de ZIP', () => {
  const zip = montarZip([
    { nome: 'leiame.txt', conteudo: Buffer.from('oi'), metodo: 0 },
    { nome: 'consulta_cand_2024_SP.csv', conteudo: latin1, metodo: 8 },
  ])

  it('lista as entradas', () => {
    expect(listarEntradas(zip).map((e) => e.nome)).toEqual(['leiame.txt', 'consulta_cand_2024_SP.csv'])
  })

  it('extrai entradas stored e deflate', () => {
    expect(extrairEntrada(zip, 'leiame.txt').toString()).toBe('oi')
    const csv = new TextDecoder('latin1').decode(extrairEntrada(zip, 'consulta_cand_2024_SP.csv'))
    expect(csv).toContain('SÃO PAULO')
  })

  it('erra com entrada ausente, CRC errado ou arquivo que não é ZIP', () => {
    expect(() => extrairEntrada(zip, 'nada.csv')).toThrow(/não encontrado/)
    const corrompido = montarZip([{ nome: 'a.txt', conteudo: Buffer.from('abc'), metodo: 0, crc: 123 }])
    expect(() => extrairEntrada(corrompido, 'a.txt')).toThrow(/CRC/)
    expect(() => listarEntradas(Buffer.alloc(40))).toThrow(/ZIP inválido/)
  })
})
