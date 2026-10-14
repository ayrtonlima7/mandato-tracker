import { statusMeta } from '../../lib/status.js'
import './ProgressBar.css'

export default function ProgressBar({ progresso, status }) {
  const meta = statusMeta(status)
  const pct = Math.max(0, Math.min(100, progresso))

  return (
    <div className="progress-bar">
      <div className="progress-bar__track">
        <div
          className="progress-bar__fill"
          style={{ width: `${pct}%`, backgroundColor: meta.color }}
        />
      </div>
      <span className="progress-bar__pct">{pct}%</span>
    </div>
  )
}
