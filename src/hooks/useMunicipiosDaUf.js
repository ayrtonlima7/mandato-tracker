import { useCallback, useEffect, useState } from 'react'
import { carregarMunicipios, carregarPrefeitos } from '../lib/municipios.js'

const OCIOSO = { uf: null, status: 'ocioso', dados: null, erro: null }

// Carrega um recurso por UF, com retry. Quando `uf` volta a ser null (saída
// do drilldown) o último resultado é mantido: os painéis ainda estão na
// animação de saída e não devem "piscar" vazios. Respostas de uma UF anterior
// que cheguem atrasadas são descartadas.
function useRecursoDaUf(uf, carregar) {
  const [estado, setEstado] = useState(OCIOSO)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    if (!uf) return undefined
    let cancelado = false
    setEstado({ uf, status: 'carregando', dados: null, erro: null })
    carregar(uf).then(
      (dados) => {
        if (!cancelado) setEstado({ uf, status: 'pronto', dados, erro: null })
      },
      (erro) => {
        if (!cancelado) setEstado({ uf, status: 'erro', dados: null, erro })
      },
    )
    return () => {
      cancelado = true
    }
  }, [uf, carregar, tentativa])

  const recarregar = useCallback(() => setTentativa((n) => n + 1), [])
  return [estado, recarregar]
}

export function useMunicipiosDaUf(uf) {
  const [municipios, recarregarMunicipios] = useRecursoDaUf(uf, carregarMunicipios)
  const [prefeitos, recarregarPrefeitos] = useRecursoDaUf(uf, carregarPrefeitos)
  return { municipios, prefeitos, recarregarMunicipios, recarregarPrefeitos }
}
