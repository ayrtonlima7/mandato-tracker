import './ZoomControls.css'

export default function ZoomControls({ onZoomIn, onZoomOut, onCenter }) {
  return (
    <div className="zoom-controls">
      <button type="button" onClick={onZoomIn} aria-label="Aumentar zoom">
        +
      </button>
      <button type="button" onClick={onZoomOut} aria-label="Diminuir zoom">
        –
      </button>
      <button type="button" onClick={onCenter} className="zoom-controls__centralizar">
        Centralizar
      </button>
    </div>
  )
}
