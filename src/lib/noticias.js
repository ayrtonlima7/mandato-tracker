// Datas de notícia vêm como timestamp ISO completo (ex: "2026-10-08T19:28:48.000Z"),
// diferente das datas de mandato ("AAAA-MM-DD"). toLocaleDateString com o fuso
// de SP já resolve isso sem desvio de dia.
export function formatarDataNoticia(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export function ordenarNoticiasPorData(noticias) {
  return [...(noticias ?? [])].sort((a, b) => {
    const ta = a.data ? new Date(a.data).getTime() : NaN
    const tb = b.data ? new Date(b.data).getTime() : NaN
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0
    if (Number.isNaN(ta)) return 1
    if (Number.isNaN(tb)) return -1
    return tb - ta
  })
}
