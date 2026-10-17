// Leitor mínimo de ZIP (só leitura, em memória), suficiente para os pacotes de
// dados abertos do TSE: entradas "stored" (0) ou "deflate" (8), sem ZIP64.
// Evita depender do binário `unzip` do sistema (ausente no Windows) ou de mais
// uma dependência npm só para isso.

import zlib from 'node:zlib'

const ASSINATURA_FIM = 0x06054b50
const ASSINATURA_CENTRAL = 0x02014b50
const ASSINATURA_LOCAL = 0x04034b50

function acharFimDoDiretorio(buf) {
  // O registro final tem 22 bytes + comentário opcional de até 65535 bytes.
  const minimo = Math.max(0, buf.length - 22 - 0xffff)
  for (let i = buf.length - 22; i >= minimo; i--) {
    if (buf.readUInt32LE(i) === ASSINATURA_FIM) return i
  }
  throw new Error('ZIP inválido: fim do diretório central não encontrado.')
}

export function listarEntradas(buf) {
  const fim = acharFimDoDiretorio(buf)
  const total = buf.readUInt16LE(fim + 10)
  let pos = buf.readUInt32LE(fim + 16)
  if (pos === 0xffffffff) throw new Error('ZIP64 não suportado.')

  const entradas = []
  for (let i = 0; i < total; i++) {
    if (buf.readUInt32LE(pos) !== ASSINATURA_CENTRAL) {
      throw new Error('ZIP inválido: entrada do diretório central corrompida.')
    }
    const metodo = buf.readUInt16LE(pos + 10)
    const crc = buf.readUInt32LE(pos + 16)
    const tamanhoComprimido = buf.readUInt32LE(pos + 20)
    const tamanho = buf.readUInt32LE(pos + 24)
    const nomeLen = buf.readUInt16LE(pos + 28)
    const extraLen = buf.readUInt16LE(pos + 30)
    const comentarioLen = buf.readUInt16LE(pos + 32)
    const offsetLocal = buf.readUInt32LE(pos + 42)
    const nome = buf.toString('utf8', pos + 46, pos + 46 + nomeLen)
    if ([tamanhoComprimido, tamanho, offsetLocal].includes(0xffffffff)) {
      throw new Error(`ZIP64 não suportado (entrada "${nome}").`)
    }
    entradas.push({ nome, metodo, crc, tamanhoComprimido, tamanho, offsetLocal })
    pos += 46 + nomeLen + extraLen + comentarioLen
  }
  return entradas
}

export function extrairEntrada(buf, nome) {
  const entrada = listarEntradas(buf).find((e) => e.nome === nome)
  if (!entrada) throw new Error(`Arquivo "${nome}" não encontrado no ZIP.`)

  const local = entrada.offsetLocal
  if (buf.readUInt32LE(local) !== ASSINATURA_LOCAL) {
    throw new Error(`ZIP inválido: cabeçalho local de "${nome}" corrompido.`)
  }
  // Tamanhos vêm do diretório central (o cabeçalho local pode tê-los zerados).
  const inicio = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28)
  const bruto = buf.subarray(inicio, inicio + entrada.tamanhoComprimido)

  let dados
  if (entrada.metodo === 0) dados = Buffer.from(bruto)
  else if (entrada.metodo === 8) dados = zlib.inflateRawSync(bruto)
  else throw new Error(`Método de compressão ${entrada.metodo} não suportado ("${nome}").`)

  if (dados.length !== entrada.tamanho) {
    throw new Error(`Tamanho inesperado ao extrair "${nome}".`)
  }
  if (typeof zlib.crc32 === 'function' && zlib.crc32(dados) >>> 0 !== entrada.crc) {
    throw new Error(`CRC inválido em "${nome}".`)
  }
  return dados
}
