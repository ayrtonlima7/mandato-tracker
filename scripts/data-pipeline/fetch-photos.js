// Baixa a foto de cada político do Wikimedia Commons (via Wikidata P18) e guarda em
// public/fotos/<id>.<ext>, com crédito e licença em src/data/fotos.json.
//
// - QID fixado em config.js (campo `wikidata`); `commonsFile` sobrescreve quando o
//   Wikidata não tem imagem.
// - Idempotente: só baixa de novo se o arquivo do Commons mudou ou o jpg sumiu.
// - Falha de um político não derruba o resto (mantém a foto anterior).
// - Licenças CC BY/BY-SA exigem atribuição: autor, licença e link ficam no JSON e
//   são exibidos na interface.
//
// Uso: node scripts/data-pipeline/fetch-photos.js [id-do-politico]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { POLITICIANS } from './config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')
const FOTOS_DIR = path.join(ROOT, 'public', 'fotos')
const META_FILE = path.join(ROOT, 'src', 'data', 'fotos.json')

// A Wikimedia exige User-Agent identificável (sem e-mail pessoal: aponta pro repo).
const UA = 'mandato-tracker/0.1 (https://github.com/ayrtonlima7/mandato-tracker)'
const LARGURA = 320 // px; cobre avatar de 72px em tela retina com folga
const PAUSA_MS = 300

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} para ${url}`)
  return res.json()
}

async function arquivoDoWikidata(qid) {
  const d = await getJson(
    `https://www.wikidata.org/w/api.php?format=json&action=wbgetentities&props=claims&ids=${qid}`,
  )
  return d.entities?.[qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value ?? null
}

async function infoDoCommons(arquivo) {
  const d = await getJson(
    'https://commons.wikimedia.org/w/api.php?format=json&action=query&prop=imageinfo' +
      `&iiprop=extmetadata|url&iiurlwidth=${LARGURA}&titles=${encodeURIComponent('File:' + arquivo)}`,
  )
  const info = Object.values(d.query?.pages ?? {})[0]?.imageinfo?.[0]
  if (!info) throw new Error(`Commons sem imageinfo para ${arquivo}`)
  const meta = info.extmetadata ?? {}
  const semHtml = (v) =>
    String(v ?? '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  return {
    thumbUrl: info.thumburl,
    paginaUrl: info.descriptionurl,
    autor: semHtml(meta.Artist?.value) || 'Autor não informado',
    licenca: semHtml(meta.LicenseShortName?.value) || 'Licença não informada',
  }
}

async function baixar(url, destino) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} ao baixar ${url}`)
  writeFileSync(destino, Buffer.from(await res.arrayBuffer()))
}

async function main() {
  const id = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? null
  const lista = id ? POLITICIANS.filter((p) => p.id === id) : POLITICIANS
  if (!lista.length) {
    console.error(`Político "${id}" não encontrado.`)
    process.exit(1)
  }

  mkdirSync(FOTOS_DIR, { recursive: true })
  const meta = existsSync(META_FILE) ? JSON.parse(readFileSync(META_FILE, 'utf8')) : {}
  let baixadas = 0
  let mantidas = 0
  const falhas = []

  for (const pol of lista) {
    try {
      const arquivo = pol.commonsFile ?? (pol.wikidata ? await arquivoDoWikidata(pol.wikidata) : null)
      await sleep(PAUSA_MS)
      if (!arquivo) throw new Error('sem imagem no Wikidata e sem commonsFile na config')

      const atual = meta[pol.id]
      if (atual?.commons === arquivo && existsSync(path.join(ROOT, 'public', atual.arquivo))) {
        mantidas++
        continue
      }

      const info = await infoDoCommons(arquivo)
      await sleep(PAUSA_MS)
      const ext = path.extname(new URL(info.thumbUrl).pathname).toLowerCase() || '.jpg'
      const nomeLocal = `${pol.id}${ext}`
      await baixar(info.thumbUrl, path.join(FOTOS_DIR, nomeLocal))
      await sleep(PAUSA_MS)

      meta[pol.id] = {
        arquivo: `fotos/${nomeLocal}`,
        commons: arquivo,
        autor: info.autor,
        licenca: info.licenca,
        fonte: info.paginaUrl,
      }
      baixadas++
      console.log(`[${pol.id}] ${arquivo} (${info.licenca})`)
    } catch (e) {
      falhas.push(pol.id)
      console.error(`[${pol.id}] falhou: ${e.message}`)
    }
  }

  const ordenado = Object.fromEntries(Object.entries(meta).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(META_FILE, JSON.stringify(ordenado, null, 2) + '\n')
  console.log(`\nFotos: ${baixadas} baixadas | ${mantidas} já atualizadas | ${falhas.length} falhas`)
  // Falha parcial não derruba o workflow: mantém o que já havia.
  if (falhas.length === lista.length) process.exit(1)
}

main()
