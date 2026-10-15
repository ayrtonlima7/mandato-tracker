import './FotoCredito.css'

// Licenças CC BY / CC BY-SA exigem atribuição: autor, licença e link da fonte.
export default function FotoCredito({ credito }) {
  if (!credito) return null
  return (
    <p className="foto-credito">
      Foto:{' '}
      <a href={credito.fonte} target="_blank" rel="noopener noreferrer">
        {credito.autor}
      </a>{' '}
      · {credito.licenca}
    </p>
  )
}
