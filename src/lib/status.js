import { STATUS } from '../data/mandateData.js'

const STATUS_DESCONHECIDO = { label: 'Sem status', color: 'var(--cor-cinza)' }

export const STATUS_META = {
  [STATUS.CUMPRIU]: { label: 'Cumprida', color: 'var(--cor-verde)' },
  [STATUS.EM_PARTE]: { label: 'Em parte', color: 'var(--cor-ouro)' },
  [STATUS.NAO_CUMPRIU]: { label: 'Não cumprida', color: 'var(--cor-destaque)' },
}

export function statusMeta(status) {
  return STATUS_META[status] ?? STATUS_DESCONHECIDO
}

export function countByStatus(propostas) {
  const counts = {
    [STATUS.CUMPRIU]: 0,
    [STATUS.EM_PARTE]: 0,
    [STATUS.NAO_CUMPRIU]: 0,
  }
  for (const p of propostas ?? []) {
    counts[p.status] = (counts[p.status] ?? 0) + 1
  }
  return counts
}

const ORDEM_STATUS = [STATUS.CUMPRIU, STATUS.EM_PARTE, STATUS.NAO_CUMPRIU]

// Cumpridas → em parte → não cumpridas; status desconhecido vai para o fim.
// Array.prototype.sort é estável (ES2019+), então a ordem original dentro de
// cada grupo é preservada.
export function ordenarPorStatus(propostas) {
  return [...(propostas ?? [])].sort((a, b) => {
    const ia = ORDEM_STATUS.indexOf(a.status)
    const ib = ORDEM_STATUS.indexOf(b.status)
    const oa = ia === -1 ? ORDEM_STATUS.length : ia
    const ob = ib === -1 ? ORDEM_STATUS.length : ib
    return oa - ob
  })
}
