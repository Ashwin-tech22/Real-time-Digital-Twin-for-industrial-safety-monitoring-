import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis } from 'recharts';

const MAX_HISTORY = 30;

const STATUS = {
  danger:  { card: 'border-red-500/60 shadow-[0_0_22px_rgba(239,68,68,0.3)]',     bar: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]',     icon: 'bg-red-500/20 text-red-400 border-red-500/30',     glow: '#ef4444', stroke: '#ef4444' },
  warning: { card: 'border-yellow-500/60 shadow-[0_0_22px_rgba(245,158,11,0.3)]',  bar: 'bg-yellow-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]',  icon: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', glow: '#f59e0b', stroke: '#f59e0b' },
  success: { card: 'border-emerald-500/60 shadow-[0_0_22px_rgba(16,185,129,0.3)]', bar: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]', icon: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', glow: '#10b981', stroke: '#10b981' },
  normal:  { card: 'border-blue-500/50 shadow-[0_0_22px_rgba(59,130,246,0.2)]',    bar: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]',    icon: 'bg-blue-500/20 text-blue-400 border-blue-500/30',    glow: '#3b82f6', stroke: '#3b82f6' },
};

const CustomTooltip = ({ active, payload, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/90 border border-slate-700/60 rounded-lg px-2 py-1 text-[10px] text-slate-200 backdrop-blur-sm">
      {payload[0].value} <span className="text-slate-400">{unit}</span>
    </div>
  );
};

const SensorCard = ({ title, value, unit, icon: Icon, percentage, status = 'normal', desc = '' }) => {
  const s = STATUS[status] || STATUS.normal;
  const [history, setHistory] = useState([]);
  const numVal = parseFloat(value);

  // Build rolling history — triggers re-render so chart updates live
  useEffect(() => {
    if (!isNaN(numVal)) {
      setHistory(prev => [...prev.slice(-(MAX_HISTORY - 1)), { v: numVal }]);
    }
  }, [numVal]);

  const chartData = history.length ? history : Array(8).fill({ v: 0 });

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.15 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, transition: { duration: 0.18 } }}
      className={`relative overflow-hidden rounded-2xl border bg-slate-900/70 backdrop-blur-md px-5 py-4 flex flex-col gap-2 ${s.card} ${
        status === 'danger' ? 'animate-[pulse_2s_infinite]' : ''
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-slate-300 font-semibold text-xs tracking-widest uppercase">{title}</h3>
        <div className={`p-1.5 rounded-lg border ${s.icon}`}>
          {Icon && <Icon size={13} />}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5">
        <motion.span
          key={value}
          initial={{ scale: 1.25, color: '#fff' }}
          animate={{ scale: 1, color: s.glow }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-bold tracking-tight"
        >
          {value}
        </motion.span>
        <span className="text-slate-400 text-xs">{unit}</span>
      </div>

      {/* Sparkline chart */}
      <div className="w-full" style={{ height: 64 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.stroke} stopOpacity={0.5} />
                <stop offset="100%" stopColor={s.stroke} stopOpacity={0} />
              </linearGradient>
              <filter id={`glow-${title}`}>
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <Area
              type="monotoneX"
              dataKey="v"
              stroke={s.stroke}
              strokeWidth={2}
              fill={`url(#grad-${title})`}
              dot={false}
              isAnimationActive={false}
              filter={`url(#glow-${title})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
        <motion.div
          animate={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
          transition={{ type: 'spring', stiffness: 50, damping: 10 }}
          className={`h-1.5 rounded-full ${s.bar}`}
        />
      </div>

      {/* Description */}
      {desc && <p className="text-[10px] text-slate-500 leading-relaxed">{desc}</p>}

      {/* Corner glow blob */}
      <div
        className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: s.glow }}
      />
    </motion.div>
  );
};

export default SensorCard;
