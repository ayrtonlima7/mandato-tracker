import { line as d3line, curveBasis } from 'd3-shape'
import { hashString, mulberry32 } from './hash.js'

const lineGenerator = d3line()
  .x((d) => d[0])
  .y((d) => d[1])
  .curve(curveBasis)

const JITTER = 9

// Caminho "desenhado à mão": pontos intermediários deslocados por um valor
// pseudo-aleatório determinístico (seed = id do link), suavizados com
// curveBasis. Mesmo seed -> mesmo traçado, então o link não treme a cada
// re-render do React.
export function sketchyPath(x1, y1, x2, y2, seedKey) {
  const rand = mulberry32(hashString(seedKey))
  const jitter = () => (rand() - 0.5) * JITTER
  const dx = x2 - x1
  const dy = y2 - y1

  const points = [
    [x1, y1],
    [x1 + dx * 0.22 + jitter(), y1 + dy * 0.22 + jitter()],
    [x1 + dx * 0.5 + jitter(), y1 + dy * 0.5 + jitter()],
    [x1 + dx * 0.78 + jitter(), y1 + dy * 0.78 + jitter()],
    [x2, y2],
  ]

  return lineGenerator(points)
}
