import { hashString } from './hash.js'

const PALETTE = [
  '#1f3a5f',
  '#2f6b4f',
  '#8c3b32',
  '#6b4f2f',
  '#4f4f7a',
  '#3b6b6b',
  '#7a4f6b',
  '#5f5f1f',
]

export function initialsFromName(nome) {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function colorFromName(nome) {
  return PALETTE[hashString(nome) % PALETTE.length]
}

// Fotos ficam em public/fotos; o caminho guardado nos dados é relativo à raiz do site,
// e o BASE_URL do Vite (ex.: /mandato-tracker/ no GitHub Pages) é aplicado aqui.
export function urlDaFoto(foto) {
  if (!foto) return null
  if (/^https?:\/\//.test(foto)) return foto
  return `${import.meta.env.BASE_URL}${foto.replace(/^\//, '')}`
}
