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
