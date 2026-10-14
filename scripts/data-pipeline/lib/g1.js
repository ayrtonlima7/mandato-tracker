// Parser da página "Promessas dos Políticos" do G1.
//
// Estrutura da página (jul/2026), em ordem de documento:
//   - Banner de tema: <img class="show-intertitulo-block__image" src="...mob-{tema}-{x}-mob-NN.png">
//     → marca início de um tema (educacao, saude, economia, ...) e reseta o status para "cumpriu"
//   - Status da promessa: <img ...em-parte-mob.png"> ou <img ...nao-cumpriu-mob.png">
//     → aparece ANTES do título a que se aplica; ausência de imagem = "cumpriu"
//   - Título da promessa: <div class="content-intertitle"><h2>...</h2></div>
//   - Descrição: blocos data-block-type="unstyled" após o título.
//
// Saída por promessa: { title, theme, status, description }
// status ∈ 'cumpriu' | 'em_parte' | 'nao_cumpriu'

import { load } from 'cheerio'

const THEME_RE = /mob-(.+?)-(cumpriu|nao-cumpriu|em-parte)-mob/i
const TOC_TITLES = ['Veja abaixo as promessas', 'separadas por temas', 'Créditos']

function cleanText(s) {
  return s
    .replace(/\s+/g, ' ')
    .replace(/Voltar\s*$/, '')
    .trim()
}

export function parseG1Promises(html) {
  const $ = load(html)
  const root = $('.mc-article-body')
  let theme = null
  let status = 'cumpriu'
  const promises = []
  let current = null

  const nodes = root.find(
    'img.show-intertitulo-block__image, .content-intertitle h2, [data-block-type="unstyled"]'
  )

  nodes.each((_, el) => {
    const tag = el.tagName

    if (tag === 'img') {
      const src = $(el).attr('src') || ''
      const themeMatch = src.match(THEME_RE)
      if (themeMatch && themeMatch[1].length < 30) {
        theme = themeMatch[1].replace(/-mob$/, '') // corrige nome malformado (ex: "habitacao-mob")
        // o status do banner é o status padrão da seção (ex: mob-transparencia-NAO-CUMPRIU)
        status = themeMatch[2].replace('-', '_')
      } else if (/em-parte-mob/.test(src)) {
        status = 'em_parte'
      } else if (/nao-cumpriu-mob/.test(src)) {
        status = 'nao_cumpriu'
      }
      return
    }

    if (tag === 'h2') {
      const title = cleanText($(el).text())
      if (TOC_TITLES.some((t) => title.includes(t))) return
      current = { title, theme, status, description: '' }
      promises.push(current)
      return
    }

    // bloco de texto (data-block-type="unstyled")
    if (current) {
      const text = cleanText($(el).find('.content-text__container').text())
      if (text) current.description += (current.description ? ' ' : '') + text
    }
  })

  return promises
}
