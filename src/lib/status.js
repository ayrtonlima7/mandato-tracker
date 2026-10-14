import { STATUS } from '../data/mandateData.js'

export const STATUS_META = {
  [STATUS.CONCLUIDO]: { label: 'Concluído', color: '#2f6b4f' },
  [STATUS.EM_ANDAMENTO]: { label: 'Em andamento', color: '#1f3a5f' },
  [STATUS.NAO_INICIADO]: { label: 'Não iniciado', color: '#8a8070' },
  [STATUS.ABANDONADO]: { label: 'Abandonado', color: '#8c3b32' },
}

export function statusMeta(status) {
  return STATUS_META[status] ?? STATUS_META[STATUS.NAO_INICIADO]
}

export function countByStatus(planos) {
  const counts = {
    [STATUS.CONCLUIDO]: 0,
    [STATUS.EM_ANDAMENTO]: 0,
    [STATUS.NAO_INICIADO]: 0,
    [STATUS.ABANDONADO]: 0,
  }
  for (const p of planos ?? []) {
    counts[p.status] = (counts[p.status] ?? 0) + 1
  }
  return counts
}
