import { useState } from 'react'
import { colorFromName, initialsFromName } from '../../lib/avatar.js'
import './Avatar.css'

export default function Avatar({ nome, foto, size = 56 }) {
  const [erro, setErro] = useState(false)
  const mostrarFoto = Boolean(foto) && !erro

  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        backgroundColor: mostrarFoto ? 'transparent' : colorFromName(nome),
        fontSize: size * 0.38,
      }}
    >
      {mostrarFoto ? (
        <img src={foto} alt={nome} onError={() => setErro(true)} />
      ) : (
        <span>{initialsFromName(nome)}</span>
      )}
    </div>
  )
}
