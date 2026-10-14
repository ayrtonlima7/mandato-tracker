// Busca de notícias no Google News via feed RSS (não há mais API oficial pública).
//
// Feed: https://news.google.com/rss/search?q=QUERY&hl=pt-BR&gl=BR&ceid=BR:pt-488
//   - Retorna itens com <title> (formato "MANCHETE - VEÍCULO"), <link>, <pubDate>, <source>.
//   - O <link> é uma URL de redirecionamento do Google News que resolve para a matéria original.
//   - Responde 302 → é preciso seguir o redirect (redirect: 'follow').
//   - ~100 itens por consulta, ordenados do mais recente ao mais antigo (sem paginação oficial;
//     para histórico maior usa-se o parâmetro "when" com intervalos de datas, ver fetchNewsRange).
//
// Obs. de uso: o feed do Google Notícias é destinado a uso pessoal/não comercial.

import { load } from 'cheerio'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

function feedUrl(query) {
  const q = encodeURIComponent(query)
  return `https://news.google.com/rss/search?q=${q}&hl=pt-BR&gl=BR&ceid=BR:pt-488`
}

// Extrai "MANCHETE" e "VEÍCULO" de um <title> no formato "Manchete - Veículo".
function splitTitle(raw) {
  const t = (raw || '').trim()
  const idx = t.lastIndexOf(' - ')
  if (idx > 0) {
    return { title: t.slice(0, idx).trim(), source: t.slice(idx + 3).trim() }
  }
  return { title: t, source: null }
}

export async function fetchNews(query, max = 30) {
  const url = feedUrl(query)
  const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status} para consulta "${query}"`)
  const xml = await res.text()
  const $ = load(xml, { xmlMode: true })

  const items = []
  $('item').each((_, el) => {
    const $it = $(el)
    const { title, source } = splitTitle($it.find('title').text())
    const link = $it.find('link').text().trim()
    const pubDate = $it.find('pubDate').text().trim()
    const fallbackSource = $it.find('source').text().trim()
    items.push({
      title,
      source: source || fallbackSource || null,
      url: link,
      date: pubDate ? new Date(pubDate).toISOString() : null,
    })
  })

  return items.slice(0, max)
}

// Paginação por janelas de tempo: busca o mesmo termo em intervalos [when] distintos,
// concatenando resultados mais recentes → mais antigos, sem duplicatas (por URL).
// O Google News RSS aceita `when:` seguido de um intervalo no formato `15d`, `1m`, `3m`, etc.
export async function fetchNewsRange(query, { max = 60, windows = ['7d', '1m', '3m'] } = {}) {
  const seen = new Set()
  const out = []
  for (const w of windows) {
    const url = `${feedUrl(query)} when:${w}`
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow' })
      if (!res.ok) continue
      const xml = await res.text()
      const $ = load(xml, { xmlMode: true })
      $('item').each((_, el) => {
        const $it = $(el)
        const { title, source } = splitTitle($it.find('title').text())
        const link = $it.find('link').text().trim()
        const pubDate = $it.find('pubDate').text().trim()
        if (!link || seen.has(link)) return
        seen.add(link)
        out.push({
          title,
          source: source || $it.find('source').text().trim() || null,
          url: link,
          date: pubDate ? new Date(pubDate).toISOString() : null,
        })
      })
    } catch (e) {
      // janela sem resultado ou erro de rede: segue para a próxima
    }
    if (out.length >= max) break
  }
  out.sort((a, b) => new Date(b.date) - new Date(a.date))
  return out.slice(0, max)
}
