import { BoltIcon } from './icons'

// Logo mark + name, used in every screen's top bar
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <BoltIcon width={18} height={18} />
      </span>
      <span className="brand-name">Meter Tracker</span>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <p>
        Meter Tracker · Usage insights for Nigerian prepaid meters.
      </p>
      <p>
        Independent tool. Not affiliated with any electricity distribution
        company. Figures are estimates from the readings you log.
      </p>
    </footer>
  )
}
