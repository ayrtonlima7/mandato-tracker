import { MAPA_LARGURA, MAPA_ALTURA, BOUNDS_POR_UF, CENTROIDE_POR_UF } from './geo.js'

const MARGEM = 40
const DISTANCIA = 90

// Os 8 estados pequenos do mapa estão todos na metade direita do viewBox
// (cluster nordestino + RJ/ES + DF). Por isso as direções candidatas sempre
// priorizam a esquerda — longe da borda direita, onde abre o DetailSidebar —
// e, em seguida, a direção vertical com mais espaço livre dentro do viewBox
// a partir do centróide do estado.
function direcoesCandidatas(centro) {
  const paraCima = centro.y > MAPA_ALTURA / 2
  const vy = paraCima ? -1 : 1
  return [
    { dx: -1, dy: vy * 0.5 },
    { dx: -1, dy: 0 },
    { dx: -0.6, dy: vy },
    { dx: 0.6, dy: vy },
    { dx: 1, dy: 0 },
  ]
}

// Calcula onde encaixar o callout (foto + linha) de um estado pequeno:
// testa direções candidatas a partir do centróide e usa a primeira que cai
// dentro da margem do viewBox e não sobrepõe o próprio estado.
export function calcularPosicaoCallout(uf) {
  const bounds = BOUNDS_POR_UF.get(uf)
  const centro = CENTROIDE_POR_UF.get(uf)
  if (!bounds || !centro) return null

  const candidatos = direcoesCandidatas(centro)

  for (const dir of candidatos) {
    const len = Math.hypot(dir.dx, dir.dy) || 1
    const x = centro.x + (dir.dx / len) * DISTANCIA
    const y = centro.y + (dir.dy / len) * DISTANCIA

    const dentroDaMargem =
      x >= MARGEM && x <= MAPA_LARGURA - MARGEM && y >= MARGEM && y <= MAPA_ALTURA - MARGEM
    const foraDoEstado =
      x < bounds.x0 - 8 || x > bounds.x1 + 8 || y < bounds.y0 - 8 || y > bounds.y1 + 8

    if (dentroDaMargem && foraDoEstado) {
      return { x, y, ancoraX: centro.x, ancoraY: centro.y }
    }
  }

  const [primeiro] = candidatos
  const len = Math.hypot(primeiro.dx, primeiro.dy) || 1
  const x = Math.min(Math.max(centro.x + (primeiro.dx / len) * DISTANCIA, MARGEM), MAPA_LARGURA - MARGEM)
  const y = Math.min(Math.max(centro.y + (primeiro.dy / len) * DISTANCIA, MARGEM), MAPA_ALTURA - MARGEM)
  return { x, y, ancoraX: centro.x, ancoraY: centro.y }
}
