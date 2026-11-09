import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDay } from '../format'
import type { UsagePeriod } from '../usage'
import { ChartIcon } from './icons'

type Props = {
  periods: UsagePeriod[]
  averagePerDay: number | undefined
}

const axisTick = { fill: 'var(--muted)', fontSize: 12 }

export function UsageChart({ periods, averagePerDay }: Props) {
  const data = periods
    .filter((p) => p.unitsUsed >= 0)
    .map((p) => ({
      label: formatDay(p.to),
      perDay: Number(p.perDay.toFixed(1)),
    }))

  return (
    <section className="card chart">
      <div className="card-head">
        <div>
          <h2>Daily usage</h2>
          <p className="muted">Units used per day between your readings</p>
        </div>
        {averagePerDay !== undefined && (
          <span className="pill">avg {averagePerDay.toFixed(1)} / day</span>
        )}
      </div>

      {data.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">
            <ChartIcon />
          </span>
          <strong>Your chart will appear here</strong>
          <p className="muted">
            Log at least two readings (for example this morning and tomorrow
            morning) to see how many units you use per day.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-2)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
            />
            <XAxis
              dataKey="label"
              tick={axisTick}
              axisLine={false}
              tickLine={false}
            />
            <YAxis width={40} tick={axisTick} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'var(--surface-2)' }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                color: 'var(--text)',
              }}
              formatter={(value) => [`${value} units/day`, 'Usage']}
            />
            <Bar
              dataKey="perDay"
              fill="url(#barFill)"
              radius={[8, 8, 0, 0]}
              maxBarSize={44}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}
