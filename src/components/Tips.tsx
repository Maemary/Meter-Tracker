import { BulbIcon } from './icons'

const TIPS = [
  {
    title: 'Do the switch-off test',
    text: 'Turn off every breaker, then watch the meter for 10 minutes. If units still drop, power is leaking or being tapped. Report it to your DisCo.',
  },
  {
    title: 'Find the heavy hitters',
    text: 'Water heaters, pumping machines, irons and old fridges or ACs use the most. Log a reading before and after running one.',
  },
  {
    title: 'Log at the same time',
    text: 'Checking at roughly the same time each day gives the cleanest trend line.',
  },
  {
    title: 'Watch your cost per unit',
    text: 'If it jumps between recharges, your tariff band changed, not your usage. The band is printed on your token receipt.',
  },
]

export function Tips() {
  return (
    <section className="card tips">
      <div className="card-head">
        <div>
          <h2>Save units</h2>
          <p className="muted">Quick checks that catch most drains</p>
        </div>
        <span className="tips-icon">
          <BulbIcon />
        </span>
      </div>
      <ol>
        {TIPS.map((tip) => (
          <li key={tip.title}>
            <strong>{tip.title}</strong>
            <p className="muted">{tip.text}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
