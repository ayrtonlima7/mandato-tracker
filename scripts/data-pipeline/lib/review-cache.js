// Cache das classificações da IA (url + proposta → categoria), versionado no repo.
// Só entram respostas REAIS da IA ou do pré-filtro; falhas de API nunca são cacheadas.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

export function carregarCache(arquivo) {
  if (!existsSync(arquivo)) return new Map()
  try {
    return new Map(Object.entries(JSON.parse(readFileSync(arquivo, 'utf8'))))
  } catch {
    return new Map() // cache corrompido: recomeça (só custa tokens, não quebra dados)
  }
}

// `manter` (Set de chaves vistas nesta execução) poda entradas órfãs; null = não poda.
export function salvarCache(arquivo, cache, manter = null) {
  const obj = {}
  for (const [k, v] of [...cache.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (!manter || manter.has(k)) obj[k] = v
  }
  mkdirSync(path.dirname(arquivo), { recursive: true })
  writeFileSync(arquivo, JSON.stringify(obj, null, 0) + '\n')
}
