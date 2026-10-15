import { useEffect, useRef, useState } from 'react'

// Mantém um painel montado durante a transição de saída, retendo o último
// valor não-nulo (ex: a UF ou o político selecionado) para que o conteúdo
// não "pisque" vazio enquanto a animação de saída roda.
export function usePanelTransition(value, exitMs = 220) {
  const [state, setState] = useState(() => ({
    value,
    mounted: value != null,
    saindo: false,
  }))
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (value != null) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setState({ value, mounted: true, saindo: false })
      return
    }

    setState((prev) => (prev.mounted ? { ...prev, saindo: true } : prev))

    const reduzido =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const delay = reduzido ? 0 : exitMs

    timeoutRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, mounted: false, saindo: false }))
      timeoutRef.current = null
    }, delay)
  }, [value, exitMs])

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    [],
  )

  return state
}
