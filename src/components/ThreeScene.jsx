import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Wind, Waves, Gauge, Activity, AlertTriangle, Building2, X } from 'lucide-react';

const BUILDINGS = [
  { id: 'main-building', label: 'Main Factory', position: '0 1.5 0', normal: '0 1 0', desc: 'Central Processing Facility' }
];

const SENSORS = [
  { id: 'temp',     label: 'Temperature', unit: '°C',    icon: Thermometer, getValue: d => d?.dht11?.temp },
  { id: 'humidity', label: 'Humidity',    unit: '%',     icon: Waves,       getValue: d => d?.dht11?.humidity },
  { id: 'co2',      label: 'CO₂',         unit: 'ppm',   icon: AlertTriangle,getValue: d => d?.co2 },
  { id: 'co',       label: 'CO',          unit: 'ppm',   icon: AlertTriangle,getValue: d => d?.co },
  { id: 'noise',    label: 'Noise',       unit: 'mV',    icon: Activity,    getValue: d => d?.noise },
  { id: 'pressure', label: 'Pressure',    unit: 'hPa',   icon: Gauge,       getValue: d => d?.bmp180?.pressure },
  { id: 'flow',     label: 'Flow Rate',   unit: 'L/min', icon: Wind,        getValue: d => d?.flow },
];

const ST = {
  danger:  { dot: '#ef4444', shadow: '0 0 12px 4px #ef444480', ring: '#ef444440', popup: 'border-red-500/70 bg-red-950/95',       label: 'text-red-400',    badge: 'bg-red-500/20 text-red-300',      tag: '⚠ DANGER'  },
  warning: { dot: '#f59e0b', shadow: '0 0 12px 4px #f59e0b80', ring: '#f59e0b40', popup: 'border-yellow-500/70 bg-yellow-950/95', label: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300', tag: '⚡ WARNING' },
  success: { dot: '#10b981', shadow: '0 0 8px 2px #10b98160',  ring: null,        popup: 'border-emerald-500/50 bg-slate-900/95', label: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', tag: '● NOMINAL' },
  normal:  { dot: '#22d3ee', shadow: '0 0 8px 2px #22d3ee60',  ring: null,        popup: 'border-cyan-500/50 bg-slate-900/95',    label: 'text-cyan-400',   badge: 'bg-cyan-500/20 text-cyan-300',    tag: '● NOMINAL' },
};

const getOverallStatus = (statuses) => {
  const vals = Object.values(statuses || {});
  if (vals.includes('danger')) return 'danger';
  if (vals.includes('warning')) return 'warning';
  return 'success';
};

// Simulated zones based on 3D coordinates
const getBuildingZone = (x, z) => {
  // Admin Sector & Outside Areas (Slightly safer/cooler)
  if (x <= 0 && z <= 0) return { 
    name: 'Admin Sector', 
    mods: { temp: -1.2, humidity: 2.5, co2: -15, co: -0.5, noise: -15, pressure: 1.0, flow: 0 } 
  };
  
  // Main Plant (Slight variation)
  if (x > 0 && z > 0) return { 
    name: 'Main Plant', 
    mods: { temp: 1.5, humidity: -3.0, co2: 25, co: 1.2, noise: 18, pressure: 2.5, flow: 0.5 } 
  };

  // Storage Facility (Slight variation)
  if (x > 0 && z <= 0) return { 
    name: 'Storage Facility', 
    mods: { temp: 0.8, humidity: 4.5, co2: 10, co: 0.4, noise: -5, pressure: -1.5, flow: -0.2 } 
  };

  // Cooling Towers (Slight variation)
  return { 
    name: 'Cooling Towers', 
    mods: { temp: -0.5, humidity: 8.0, co2: -5, co: -0.2, noise: 8, pressure: -2.0, flow: 1.2 } 
  };
};

// Helpers for recalculating local statuses based on modified zone data
const getStatus = (value, warning, danger) => {
  if (value >= danger) return 'danger';
  if (value >= warning) return 'warning';
  return 'success';
};
const getHumidityStatus = (v) => {
  if (!v) return 'normal';
  if (v < 30 || v > 70) return 'danger';
  if (v < 40 || v > 60) return 'warning';
  return 'success';
};
const getPressureStatus = (v) => {
  if (!v) return 'normal';
  if (v < 980 || v > 1040) return 'danger';
  if (v < 1000 || v > 1020) return 'warning';
  return 'success';
};
const getFlowStatus = (v) => {
  if (!v) return 'normal';
  if (v < 0.5 || v > 10) return 'danger';
  if (v < 1 || v > 8) return 'warning';
  return 'success';
};

const BuildingDataPanel = ({ pos, data, zone, onClose }) => {
  // Apply zone modifiers to the base data
  const modifiedData = data ? {
    dht11: {
      temp: (data.dht11?.temp || 0) + zone.mods.temp,
      humidity: (data.dht11?.humidity || 0) + zone.mods.humidity,
    },
    co2: Math.max(0, (data.co2 || 0) + zone.mods.co2),
    co: Math.max(0, (data.co || 0) + zone.mods.co),
    noise: Math.max(0, (data.noise || 0) + zone.mods.noise),
    bmp180: {
      pressure: (data.bmp180?.pressure || 0) + zone.mods.pressure,
    },
    flow: Math.max(0, (data.flow || 0) + zone.mods.flow),
  } : null;

  // Recalculate statuses for this specific zone so colors match the new values
  const localStatuses = modifiedData ? {
    temp: getStatus(modifiedData.dht11.temp, 28, 32),
    humidity: getHumidityStatus(modifiedData.dht11.humidity),
    pressure: getPressureStatus(modifiedData.bmp180.pressure),
    noise: getStatus(modifiedData.noise, 500, 700),
    flow: getFlowStatus(modifiedData.flow),
    co2: getStatus(modifiedData.co2, 800, 1000),
    co: getStatus(modifiedData.co, 9, 35)
  } : {};

  const overallStatus = getOverallStatus(localStatuses);
  const st = ST[overallStatus] || ST.normal;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y - 40,
          transform: 'translate(-50%, -100%)',
          minWidth: 420,
          zIndex: 50,
          pointerEvents: 'auto',
        }}
      >
        <div style={{
          position: 'absolute', bottom: -12, left: '50%',
          transform: 'translateX(-50%)',
          width: 2, height: 16,
          background: `linear-gradient(to bottom, ${st.dot}, transparent)`,
          pointerEvents: 'none',
        }} />

        <div
          className={`rounded-xl border backdrop-blur-xl shadow-2xl overflow-hidden ${st.popup} flex flex-col`}
          style={{ boxShadow: `0 8px 32px ${st.dot}30`, maxHeight: '350px' }}
        >
          <div className="px-4 py-3 flex justify-between items-center border-b shrink-0" style={{ borderColor: `${st.dot}30`, background: `${st.dot}10` }}>
            <div className="flex items-center gap-2">
               <Building2 size={18} style={{ color: st.dot }} />
               <span className={`text-sm font-bold tracking-wide ${st.label}`}>{zone.name} Data</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-700 p-1.5 rounded-full shrink-0">
              <X size={14} />
            </button>
          </div>

          <div className="p-3 grid grid-cols-3 gap-2 bg-slate-900/90 overflow-y-auto">
            {SENSORS.map(sensor => {
              const valRaw = sensor.getValue(modifiedData || data);
              const valStr = valRaw != null && !isNaN(valRaw) ? parseFloat(valRaw).toFixed(1) : '--';
              const sensorStStr = localStatuses[sensor.id] || 'normal';
              const sSt = ST[sensorStStr] || ST.normal;
              const Icon = sensor.icon;

              return (
                <div key={sensor.id} className="flex flex-col gap-1 p-2.5 rounded-lg border border-slate-700/50 transition-colors hover:border-slate-500/50" style={{ background: `${sSt.dot}10` }}>
                  <div className="flex items-center gap-1.5 opacity-90">
                    <Icon size={14} style={{ color: sSt.dot }} />
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest truncate">{sensor.label}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold leading-none" style={{ color: sSt.dot }}>{valStr}</span>
                    <span className="text-[9px] text-slate-400 font-mono truncate">{sensor.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const ThreeScene = ({ data, statuses = {} }) => {
  const mvRef = useRef(null);
  const isAnomaly = data && (data.co2 > 900 || data.co > 35 || data?.dht11?.temp > 35);
  const [clickPos, setClickPos] = useState(null);

  const overallStatus = getOverallStatus(statuses);



  // Handle direct clicks on the 3D model
  useEffect(() => {
    const mv = mvRef.current;
    if (!mv) return;

    const handleClick = (event) => {
      // positionAndNormalFromPoint casts a ray into the 3D scene.
      // If it returns a hit, the user clicked the geometry itself!
      const hit = mv.positionAndNormalFromPoint(event.clientX, event.clientY);
      
      if (hit) {
        const mvRect = mv.getBoundingClientRect();
        setClickPos({
          x: event.clientX - mvRect.left,
          y: event.clientY - mvRect.top,
          zone: getBuildingZone(hit.position.x, hit.position.z)
        });
      } else {
        // If they click empty space in the viewer, close the panel
        setClickPos(null);
      }
    };

    mv.addEventListener('click', handleClick);
    return () => mv.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="w-full h-full relative border border-slate-700/40 rounded-2xl overflow-hidden" style={{ background: '#020817' }}>

      <model-viewer
        ref={mvRef}
        alt="Factory Industrial Installation 3D Model"
        src="/factory_industrial_installation.glb"
        autoplay
        auto-rotate
        camera-controls
        touch-action="pan-y"
        disable-zoom
        camera-orbit="30deg 75deg 55%"
        min-camera-orbit="auto 75deg auto"
        max-camera-orbit="auto 75deg auto"
        shadow-intensity="1.5"
        environment-intensity="1.2"
        exposure="1.2"
        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
      >
        {/* No hotspots required! Direct mesh interaction enabled. */}
      </model-viewer>

      {clickPos && (
        <BuildingDataPanel
          pos={clickPos}
          data={data}
          zone={clickPos.zone}
          onClose={() => setClickPos(null)}
        />
      )}

      <AnimatePresence>
        {isAnomaly && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/60 bg-red-950/80 backdrop-blur-md text-red-300 text-xs font-bold tracking-widest pointer-events-none animate-pulse"
          >
            <AlertTriangle size={13} /> DANGER ZONE HIGHLIGHTED — CHECK ANOMALIES
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default ThreeScene;
