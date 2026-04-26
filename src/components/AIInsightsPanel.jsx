import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, YAxis, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BrainCircuit, X, Thermometer, Wind, Waves, Gauge, Activity, AlertTriangle } from 'lucide-react';

const SENSORS = [
  { id: 'temp',     label: 'Temperature', unit: '°C',    icon: Thermometer,   w: 28, d: 32, spikeThreshold: 1.5, getVal: h => h.dht11?.temp },
  { id: 'humidity', label: 'Humidity',    unit: '%',     icon: Waves,         w: 0,  d: 0,  spikeThreshold: 10.0, getVal: h => h.dht11?.humidity },
  { id: 'co2',      label: 'CO₂ Levels',  unit: 'ppm',   icon: AlertTriangle, w: 800, d: 1000, spikeThreshold: 40.0, getVal: h => h.co2 },
  { id: 'co',       label: 'CO Levels',   unit: 'ppm',   icon: AlertTriangle, w: 9,  d: 35, spikeThreshold: 3.0, getVal: h => h.co },
  { id: 'noise',    label: 'Noise Level', unit: 'mV',    icon: Activity,      w: 500, d: 700, spikeThreshold: 100.0, getVal: h => h.noise },
  { id: 'pressure', label: 'Pressure',    unit: 'hPa',   icon: Gauge,         w: 0,  d: 0,  spikeThreshold: 5.0, getVal: h => h.bmp180?.pressure },
  { id: 'flow',     label: 'Flow Rate',   unit: 'L/min', icon: Wind,          w: 0,  d: 0,  spikeThreshold: 1.5, getVal: h => h.flow },
];

const analyzeParameter = (config, history) => {
  if (!history || history.length < 2) {
    return { status: 'safe', text: `Gathering historical baseline for ${config.label}...`, color: '#3b82f6', chartData: [] };
  }

  const current = config.getVal(history[history.length - 1]);
  const previous = config.getVal(history[0]);
  
  const chartData = history.map(h => ({ 
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    val: config.getVal(h) || 0 
  }));

  if (current == null || previous == null || isNaN(current) || isNaN(previous)) {
    return { status: 'safe', text: `Sensor offline or missing data for ${config.label}.`, color: '#64748b', chartData };
  }

  const delta = current - previous;
  const absDelta = Math.abs(delta);
  const dirTxt = delta > 0 ? "increased" : delta < 0 ? "decreased" : "remained completely stable";
  const diffTxt = delta !== 0 ? `by ${absDelta.toFixed(1)} ${config.unit}` : '';
  const valTxt = `${current.toFixed(1)} ${config.unit}`;
  
  let status = 'safe';
  let color = '#10b981'; // emerald

  // Calculate strict statuses
  if (config.id === 'humidity') {
     if (current < 30 || current > 70) status = 'danger';
     else if (current < 40 || current > 60) status = 'warning';
  } else if (config.id === 'pressure') {
     if (current < 980 || current > 1040) status = 'danger';
     else if (current < 1000 || current > 1020) status = 'warning';
  } else if (config.id === 'flow') {
     if (current < 0.5 || current > 10) status = 'danger';
     else if (current < 1 || current > 8) status = 'warning';
  } else {
     if (current >= config.d) status = 'danger';
     else if (current >= config.w) status = 'warning';
  }

  if (status === 'danger') color = '#ef4444'; // red
  else if (status === 'warning') color = '#f59e0b'; // yellow

  // Generate highly dynamic, numeric-based sentence
  const base = `${config.label} has ${dirTxt} ${diffTxt} over the tracked window, currently sitting at ${valTxt}.`;
  let insight = '';

  if (status === 'danger') {
    if (config.id === 'co2' || config.id === 'co') insight = `${base} LETHAL TOXICITY DETECTED. Immediate worker evacuation and maximum ventilation required!`;
    else if (config.id === 'temp') insight = `${base} CRITICAL HEAT STRESS RISK. Workers must evacuate the zone. Cooling units failing.`;
    else insight = `${base} CRITICAL DEVIATION. Stop localized processes and clear the area immediately to protect personnel.`;
  } else if (status === 'warning') {
    if (delta > 0) insight = `${base} This is approaching upper safe limits. Monitor closely and advise workers to exercise caution.`;
    else insight = `${base} This is approaching lower safe limits. Adjust environmental controls to stabilize the area.`;
  } else {
    if (absDelta > config.spikeThreshold) insight = `${base} Notable fluctuation detected, but it has currently stabilized within safe operating margins. No action needed.`;
    else insight = `${base} Maintaining a steady baseline. The zone is completely optimal and safe for worker presence.`;
  }

  return { status, text: insight, color, chartData, current };
};

const ParameterChart = ({ data, color, label }) => (
  <div className="h-28 w-full mt-3 bg-slate-950/50 rounded-lg p-2 border border-slate-800/80">
    {data.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickMargin={5} minTickGap={20} />
          <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={9} width={30} tickFormatter={v => v.toFixed(0)} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
            itemStyle={{ color, fontWeight: 'bold' }}
          />
          <Line type="monotone" dataKey="val" name={label} stroke={color} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    ) : null}
  </div>
);

const AIInsightsPanel = ({ history, onClose }) => {
  // Generate analyses for ALL sensors
  const analyses = useMemo(() => {
    return SENSORS.map(sensor => ({
      sensor,
      analysis: analyzeParameter(sensor, history)
    }));
  }, [history]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        className="fixed top-24 right-4 md:right-8 z-50 w-full max-w-md lg:max-w-xl bg-slate-950/95 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'calc(100vh - 120px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-blue-400" size={20} />
            <h3 className="font-bold text-slate-200 tracking-wide">Per-Parameter AI Safety Analyst</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex flex-col gap-4">
          {analyses.map(({ sensor, analysis }) => {
            const Icon = sensor.icon;
            const isDanger = analysis.status === 'danger';
            const isWarn = analysis.status === 'warning';
            
            return (
              <div 
                key={sensor.id}
                className={`p-4 rounded-xl border flex flex-col ${
                  isDanger ? 'bg-red-950/20 border-red-500/30' :
                  isWarn ? 'bg-yellow-950/20 border-yellow-500/30' :
                  'bg-slate-900/40 border-slate-700/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0 w-24">
                    <div className="flex items-center gap-1.5" style={{ color: analysis.color }}>
                      <Icon size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-full">{sensor.label}</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
                      {analysis.current?.toFixed(1) || '--'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">{sensor.unit}</div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {analysis.text}
                    </p>
                  </div>
                </div>

                <ParameterChart data={analysis.chartData} color={analysis.color} label={sensor.label} />
              </div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIInsightsPanel;
