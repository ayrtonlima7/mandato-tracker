// Posicionamento da foto do político selecionado no mapa.
//
// Regras (atendendo ao pedido do usuário):
//   - Estados onde a foto CABE dentro (bounding box suficiente): a foto fica
//     CENTRALIZADA DENTRO do estado.
//   - Estados pequenos demais: a foto fica FORA da área do país (na margem do
//     mapa), com uma aresta/linha apontando para o estado.
//
// `calcularPosicaoFoto(uf, tamanho)` retorna:
//   { dentro: true,  x, y }                         — foto dentro do estado
//   { dentro: false, x, y, ancoraX, ancoraY }       — foto na margem + âncora no estado

import {
  BOUNDS_BRASIL,
  CENTROIDE_POR_UF,
  MAPA_ALTURA,
  MAPA_LARGURA,
  MARGEM_MAPA,
  centroDaFotoNaUf,
  fotoCabeNaUf,
} from './geo.js'

export function calcularPosicaoFoto(uf, tamanho = 56) {
  if (fotoCabeNaUf(uf, tamanho)) {
    const { x, y } = centroDaFotoNaUf(uf)
    return { dentro: true, x, y }
  }

  // Fora do país: na margem do lado mais próximo do estado, y alinhado ao centróide.
  const centro = CENTROIDE_POR_UF.get(uf) ?? { x: MAPA_LARGURA / 2, y: MAPA_ALTURA / 2 }
  const [[bx0, by0], [bx1, by1]] = BOUNDS_BRASIL
  const noLeste = centro.x >= (bx0 + bx1) / 2
  const x = noLeste ? bx1 + (MAPA_LARGURA - bx1) / 2 : bx0 / 2
  const y = Math.min(Math.max(centro.y, by0 + 24), by1 - 24)
  return { dentro: false, x, y, ancoraX: centro.x, ancoraY: centro.y }
}
