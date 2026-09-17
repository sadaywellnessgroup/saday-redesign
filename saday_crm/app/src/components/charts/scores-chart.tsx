'use client';

import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';

/* Provider "scores over time" — the one chart allowed to overlay several
 * tools (ui-references §D): one line per selected tool, chip legend to
 * toggle, severity bands drawn for the first selected tool only (bands are
 * tool-specific; drawing four sets of bands would be unreadable). Indigo
 * family only, cream ground, no gridlines, IST dates. */

const SERIES_COLORS = ['#3E2A78', '#B0522E', '#D69A3C', '#2B1D57', '#8E4225'];

export interface ScoreSeries {
  toolId: string;
  code: string;
  name: string;
  max: number;
  bands: { label: string; min: number; max: number; color: string }[];
  points: { dateISO: string; label: string; value: number | null }[];
}

interface Row {
  dateISO: string;
  label: string;
  [toolId: string]: string | number | null;
}

function buildRows(series: ScoreSeries[]): Row[] {
  const byDate = new Map<string, Row>();
  for (const s of series) {
    for (const p of s.points) {
      const row = byDate.get(p.dateISO) ?? { dateISO: p.dateISO, label: p.label };
      row[s.toolId] = p.value;
      byDate.set(p.dateISO, row);
    }
  }
  return [...byDate.values()].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}

function ScoreTooltip({
  active,
  payload,
  series,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number | null; payload: Row }>;
  series: ScoreSeries[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]!.payload;
  return (
    <div className="rounded-soft bg-card px-3 py-2 text-xs shadow-feather-lg">
      <p className="pb-1 font-semibold text-indigo-deep">{row.label}</p>
      {payload
        .filter((p) => p.value !== null && p.value !== undefined)
        .map((p) => {
          const s = series.find((x) => x.toolId === p.dataKey);
          return (
            <p key={p.dataKey} className="text-ink-soft">
              {s?.code ?? p.dataKey}: <span className="font-semibold text-ink">{p.value}</span>
              {s ? <span className="text-ink-soft"> / {s.max}</span> : null}
            </p>
          );
        })}
    </div>
  );
}

export function ScoresOverTimeChart({ series, height = 220 }: { series: ScoreSeries[]; height?: number }) {
  const [activeIds, setActiveIds] = useState<string[]>(series.slice(0, 2).map((s) => s.toolId));
  const active = series.filter((s) => activeIds.includes(s.toolId));
  const rows = buildRows(active);
  const bandSource = active[0];
  const maxValue = Math.max(10, ...active.map((s) => s.max));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {series.map((s, i) => {
          const isOn = activeIds.includes(s.toolId);
          return (
            <button
              key={s.toolId}
              type="button"
              aria-pressed={isOn}
              onClick={() =>
                setActiveIds((prev) => (prev.includes(s.toolId) ? prev.filter((id) => id !== s.toolId) : [...prev, s.toolId]))
              }
              className={cn(
                'inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors',
                isOn ? 'bg-lilac-tint text-indigo-deep' : 'bg-cream text-ink-soft shadow-[inset_0_0_0_1.5px_var(--line)]',
              )}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: isOn ? SERIES_COLORS[i % SERIES_COLORS.length] : 'var(--line)' }}
                aria-hidden="true"
              />
              {s.code}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-soft">No scores recorded yet.</p>
      ) : (
        <>
          <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
                <CartesianGrid stroke="transparent" />
                {bandSource?.bands.map((band) => (
                  <ReferenceArea
                    key={`${bandSource.toolId}-${band.label}`}
                    y1={band.min}
                    y2={band.max}
                    fill={band.color}
                    fillOpacity={0.3}
                    stroke="none"
                    ifOverflow="hidden"
                  />
                ))}
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#5C544E' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={28}
                />
                <YAxis
                  domain={[0, maxValue]}
                  tick={{ fontSize: 11, fill: '#5C544E' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<ScoreTooltip series={active} />} cursor={{ stroke: '#3E2A78', strokeOpacity: 0.12, strokeWidth: 18 }} />
                {active.map((s) => (
                  <Line
                    key={s.toolId}
                    type="monotone"
                    dataKey={s.toolId}
                    stroke={SERIES_COLORS[series.findIndex((x) => x.toolId === s.toolId) % SERIES_COLORS.length]}
                    strokeWidth={2.5}
                    connectNulls
                    isAnimationActive={false}
                    dot={{ r: 2.5, strokeWidth: 0 }}
                    activeDot={{ r: 4.5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {bandSource ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
                Bands: {bandSource.code}
              </span>
              {bandSource.bands.map((b) => (
                <span key={b.label} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-soft">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} aria-hidden="true" />
                  {b.label}
                </span>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
