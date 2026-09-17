'use client';

import { Area, AreaChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/* Shared trend-chart look for mood / sleep / psychometric-score charts
 * (ui-references §D): single indigo line, no gridlines, soft axis labels,
 * IST "DD MMM" dates, severity bands as tinted horizontal areas (not hard
 * reference lines), warm tooltip card, cream/card ground only. */

export interface TrendPoint {
  dateISO: string;
  label: string;
  value: number | null;
}

export interface TrendBand {
  label: string;
  min: number;
  max: number;
  color: string;
}

function CustomTooltip({ active, payload, unit }: { active?: boolean; payload?: Array<{ payload: TrendPoint }>; unit?: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]!.payload;
  if (point.value === null) return null;
  return (
    <div className="rounded-soft bg-card px-3 py-2 text-xs shadow-feather-lg">
      <p className="font-semibold text-indigo-deep">
        {point.value}
        {unit ?? ''}
      </p>
      <p className="text-ink-soft">{point.label}</p>
    </div>
  );
}

export function TrendChart({
  data,
  bands,
  domain,
  height = 180,
  unit,
}: {
  data: TrendPoint[];
  bands?: TrendBand[];
  domain?: [number, number];
  height?: number;
  unit?: string;
}) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3E2A78" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#3E2A78" stopOpacity={0} />
            </linearGradient>
          </defs>
          {bands?.map((band) => (
            <ReferenceArea
              key={band.label}
              y1={band.min}
              y2={band.max}
              fill={band.color}
              fillOpacity={0.35}
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
            minTickGap={24}
          />
          <YAxis domain={domain ?? ['dataMin', 'dataMax']} tick={{ fontSize: 11, fill: '#5C544E' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ stroke: '#3E2A78', strokeOpacity: 0.15, strokeWidth: 18 }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3E2A78"
            strokeWidth={2.5}
            fill="url(#trendFill)"
            connectNulls
            isAnimationActive={false}
            dot={{ r: 2.5, fill: '#3E2A78', strokeWidth: 0 }}
            activeDot={{ r: 4.5, fill: '#3E2A78' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Sparkline({ data, height = 56 }: { data: TrendPoint[]; height?: number }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3E2A78" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#3E2A78" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke="#3E2A78" strokeWidth={2} fill="url(#sparkFill)" connectNulls isAnimationActive={false} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Legend({ bands }: { bands: TrendBand[] }) {
  return (
    <div className="flex flex-wrap gap-3 pt-1">
      {bands.map((b) => (
        <span key={b.label} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-soft">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: b.color }} aria-hidden="true" />
          {b.label}
        </span>
      ))}
    </div>
  );
}
