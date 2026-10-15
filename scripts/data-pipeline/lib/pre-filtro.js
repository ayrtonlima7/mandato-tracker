// Pré-filtro em código, antes de gastar tokens na DeepSeek.
//
// Só faz coisas SEGURAS (sem perder notícia boa): normaliza e deduplica manchetes
// repetidas dentro da mesma proposta (republicações da mesma matéria).
//
// Testado e DESCARTADO: cortar manchetes sem nenhuma palavra em comum com
// político/estado/proposta. Em dados já revisados, cortaria ~10% das notícias que a
// IA aprovou (ex.: "Desenrola 2.0" numa proposta de renegociar dívidas).

import { createHash } from 'node:crypto'

export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

// Google News costuma anexar " - Nome do Veículo" ao título; republicações da mesma
// matéria só diferem por isso.
export function manchetePura(titulo) {
  return normalizar(titulo).replace(/\s+-\s+[^-]+$/, '').replace(/\s+/g, ' ')
}

// Chave estável de uma notícia numa proposta: a mesma URL pode ser classificada de
// forma diferente conforme a proposta, então a proposta entra na chave.
export function chaveDeCache(url, propostaTitulo, manchete) {
  const bruto = `${url || manchetePura(manchete)}||${normalizar(propostaTitulo)}`
  return createHash('sha1').update(bruto).digest('hex').slice(0, 16) // URLs do Google News são enormes
}
