import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

const InlineCounter = ({ value, duration = 900, suffix = '', prefix = '', decimals = 0 }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const endValue = typeof value === 'number' ? value : parseFloat(value) || 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(endValue * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else setDisplay(endValue);
    };
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <span>{prefix}{display.toFixed(decimals)}{suffix}</span>;
};

export default function KpiCard({
  label, value, suffix = '', prefix = '', decimals = 0, icon: Icon,
  iconGradient = 'from-emerald-500 to-teal-500', trend = null, sparkline = null,
  description = '', onClick = null, isNumeric = true,
}) {
  const trendColor =
    trend?.direction === 'up'
      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
      : trend?.direction === 'down'
      ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60'
      : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';

  const TrendIcon =
    trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus;

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-xl dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${iconGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl`}
      />

      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="w-5 h-5" strokeWidth={2.5} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums">
          {isNumeric ? (
            <InlineCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
          ) : (
            <span>{prefix}{value}{suffix}</span>
          )}
        </h3>
      </div>

      <div className="flex items-center justify-between gap-2 mt-3">
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</p>
        )}
        {trend ? (
          <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${trendColor}`}>
            <TrendIcon className="w-3 h-3" strokeWidth={3} />
            {trend.value}{trend.suffix || ''}
          </span>
        ) : onClick ? (
          <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : null}
      </div>

      {sparkline && sparkline.length > 1 && (
        <div className="mt-4 h-12 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            {/* Added margin and YAxis domain to prevent clipping */}
            <LineChart data={sparkline.map((v, i) => ({ v, i }))} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Line type="monotone" dataKey="v" stroke="url(#sparkGrad)" strokeWidth={2.5} dot={false} />
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}