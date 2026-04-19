import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Wind, Waves, Gauge, Activity, AlertTriangle } from 'lucide-react';

const PINS = [
  { id: 'temp',     label: 'Temperature', unit: '°C',    icon: Thermometer, position: '0.8 2.1 0.3',   normal: '0 1 0',  getValue: d => d?.dht11?.temp,        warning: 30,   danger: 35,   desc: 'HVAC zone · Roof' },
  { id: 'humidity', label: 'Humidity',    unit: '%',     icon: Waves,       position: '-0.5 1.6 1.2',  normal: '0 0 1',  getValue: d => d?.dht11?.humidity,    warning: 70,   danger: 85,   desc: 'Atrium · Front wall' },
  { id: 'co2',      label: 'CO₂',         unit: 'ppm',   icon: AlertTriangle,position: '-1.4 1.0 0.0', normal: '-1 0 0', getValue: d => d?.co2,                warning: 800,  danger: 1000, desc: 'Ventilation shaft' },
  { id: 'co',       label: 'CO',          unit: 'ppm',   icon: AlertTriangle,position: '1.4 0.5 0.2',  normal: '1 0 0',  getValue: d => d?.co,                 warning: 20,   danger: 50,   desc: 'Basement plant room' },
  { id: 'noise',    label: 'Noise',       unit: 'mV',    icon: Activity,    position: '0.1 0.2 0.8',   normal: '0 0 1',  getValue: d => d?.noise,              warning: 600,  danger: 700,  desc: 'Machinery floor' },
  { id: 'pressure', label: 'Pressure',    unit: 'hPa',   icon: Gauge,       position: '1.1 2.6 -0.4',  normal: '0 1 0',  getValue: d => d?.bmp180?.pressure,   warning: 1020, danger: 1030, desc: 'Roof weather station' },
  { id: 'flow',     label: 'Flow Rate',   unit: 'L/min', icon: Wind,        position: '-0.8 0.8 -1.0', normal: '0 0 -1', getValue: d => d?.flow,               warning: 7,    danger: 9,    desc: 'Main water riser' },
];



const ST = {
  danger:  { dot: '#ef4444', shadow: '0 0 12px 4px #ef444480', ring: '#ef444440', popup: 'border-red-500/70 bg-red-950/95',       label: 'text-red-400',    badge: 'bg-red-500/20 text-red-300',      tag: '⚠ DANGER'  },
  warning: { dot: '#f59e0b', shadow: '0 0 12px 4px #f59e0b80', ring: '#f59e0b40', popup: 'border-yellow-500/70 bg-yellow-950/95', label: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-300', tag: '⚡ WARNING' },
  success: { dot: '#10b981', shadow: '0 0 8px 2px #10b98160',  ring: null,        popup: 'border-emerald-500/50 bg-slate-900/95', label: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', tag: '● NOMINAL' },
  normal:  { dot: '#22d3ee', shadow: '0 0 8px 2px #22d3ee60',  ring: null,        popup: 'border-cyan-500/50 bg-slate-900/95',    label: 'text-cyan-400',   badge: 'bg-cyan-500/20 text-cyan-300',    tag: '● NOMINAL' },
};

/* Single hotspot slot — dot + ping ring + always-visible name label */
const HotspotDot = ({ pin, status, value }) => {
  const st = ST[status] || ST.normal;
  const Icon = pin.icon;
  const isAlert = status === 'danger' || status === 'warning';
  const formattedValue = value != null && !isNaN(value) ? parseFloat(value).toFixed(1) : '--';

  return (
    <div
      slot={`hotspot-${pin.id}`}
      data-position={pin.position}
      data-normal={pin.normal}
      style={{ display: 'block', width: 0, height: 0, position: 'relative' }}
    >
      {/* Ping ring — alert only */}
      {isAlert && (
        <div style={{
          position: 'absolute', width: 32, height: 32, borderRadius: '50%',
          background: st.ring, top: -16, left: -16,
          animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Dot */}
      <div style={{
        position: 'absolute', width: 22, height: 22, borderRadius: '50%',
        background: st.dot, boxShadow: st.shadow,
        top: -11, left: -11,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid rgba(255,255,255,0.25)',
        zIndex: 2,
      }}>
        <Icon size={11} color="#000" strokeWidth={2.5} />
      </div>

      {/* Always-visible label: name + value + alert level for warning/danger */}
      <div style={{
        position: 'absolute',
        left: 16, top: -10,
        display: 'flex', flexDirection: 'column', gap: 1,
        pointerEvents: 'none', whiteSpace: 'nowrap',
      }}>
        {/* Name row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(2,8,23,0.75)',
          border: `1px solid ${st.dot}50`,
          borderRadius: 6, padding: '1px 6px',
          backdropFilter: 'blur(6px)',
        }}>
          <span style={{ color: st.dot, fontSize: 10, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {pin.label}: {formattedValue} {pin.unit}
          </span>
        </div>

        {/* Alert level row — only for warning / danger */}
        {isAlert && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: `${st.dot}18`,
            border: `1px solid ${st.dot}60`,
            borderRadius: 6, padding: '1px 6px',
            backdropFilter: 'blur(6px)',
          }}>
            <span style={{ color: st.dot, fontSize: 9, fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              {st.tag}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

/* Popup rendered as a regular DOM overlay — positioned via model-viewer's getHotspot screen coords */
const PopupOverlay = ({ pin, data, mvRef }) => {
  const [pos, setPos]         = useState(null);
  const [visible, setVisible]  = useState(false);
  const rafRef = useRef(null);

  const raw    = pin.getValue(data);
  const value  = raw != null && !isNaN(raw) ? parseFloat(raw).toFixed(1) : '--';
  const st     = ST[status] || ST.normal;
  const Icon   = pin.icon;
  const isAlert = status === 'danger' || status === 'warning';

  // Track hotspot screen position every animation frame
  useEffect(() => {
    const mv = mvRef.current;
    if (!mv) return;

    const tick = () => {
      const hs = mv.queryHotspot(`hotspot-${pin.id}`);
      if (hs) {
        // data-visible is set by model-viewer when hotspot faces camera
        const isVis = hs.getAttribute('data-visible') !== 'false';
        setVisible(isVis);

        if (isVis) {
          // getBoundingClientRect of the hotspot element gives screen position
          const rect = hs.getBoundingClientRect();
          const mvRect = mv.getBoundingClientRect();
          setPos({
            x: rect.left - mvRect.left + rect.width / 2,
            y: rect.top  - mvRect.top  + rect.height / 2,
          });
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    // Start tracking after model loads
    const onLoad = () => { rafRef.current = requestAnimationFrame(tick); };
    mv.addEventListener('load', onLoad);
    // Also start immediately in case already loaded
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      mv.removeEventListener('load', onLoad);
      cancelAnimationFrame(rafRef.current);
    };
  }, [pin.id, mvRef]);

  // Alert pins: full detail card always visible when facing camera
  // Normal pins: no popup needed — label on dot is enough
  const showPopup = visible && isAlert;

  if (!pos) return null;

  return (
    <>
      {/* Full detail popup — alert pins only, always shown when facing camera */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 8 }}
            animate={{ opacity: 1, scale: 1,    y: 0 }}
            exit={{   opacity: 0, scale: 0.82, y: 8 }}
            transition={{ duration: 0.16 }}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y - 28,
              transform: 'translate(-50%, -100%)',
              minWidth: isAlert ? 168 : 130,
              zIndex: 40,
              pointerEvents: 'none',
            }}
          >
            {/* Stem */}
            <div style={{
              position: 'absolute', bottom: -10, left: '50%',
              transform: 'translateX(-50%)',
              width: 1.5, height: 12,
              background: `linear-gradient(to bottom, ${st.dot}, transparent)`,
            }} />

            <div
              className={`rounded-xl border backdrop-blur-xl px-3 py-2 font-mono shadow-2xl ${st.popup}`}
              style={{ boxShadow: `0 0 20px ${st.dot}30` }}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon size={11} style={{ color: st.dot }} />
                  <span className={`text-[11px] font-bold tracking-wide ${st.label}`}>{pin.label}</span>
                </div>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold tracking-widest ${st.badge}`}>
                  {st.tag}
                </span>
              </div>

              {/* Value */}
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-2xl font-bold leading-none" style={{ color: st.dot }}>{value}</span>
                <span className="text-slate-400 text-[10px]">{pin.unit}</span>
              </div>

              {/* Alert detail */}
              {isAlert && (
                <>
                  <div className="flex gap-3 text-[9px] text-slate-400 mb-1.5">
                    <span>⚡ <span className="text-yellow-400">{pin.warning}</span></span>
                    <span>⚠ <span className="text-red-400">{pin.danger}</span></span>
                  </div>
                  <div className="w-full bg-slate-700/60 rounded-full overflow-hidden" style={{ height: 3 }}>
                    <motion.div
                      animate={{ width: `${Math.min((raw / (pin.danger * 1.1)) * 100, 100)}%` }}
                      transition={{ type: 'spring', stiffness: 60, damping: 12 }}
                      style={{ height: 3, borderRadius: 9999, background: st.dot, boxShadow: `0 0 6px ${st.dot}` }}
                    />
                  </div>
                  <p className="text-slate-500 text-[9px] mt-1.5 tracking-wide">{pin.desc}</p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const ThreeScene = ({ data, statuses = {} }) => {
  const mvRef = useRef(null);
  const isAnomaly = data && (data.co2 > 900 || data.co > 35 || data?.dht11?.temp > 35);

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
        {/* Dots only inside model-viewer — they rotate with the model */}
        {data && PINS.map(pin => (
          <HotspotDot key={pin.id} pin={pin} status={statuses[pin.id]} value={pin.getValue(data)} />
        ))}
      </model-viewer>

      {/* Popups outside model-viewer — positioned via rAF screen coords, hover works normally */}
      {data && PINS.map(pin => (
        <PopupOverlay key={pin.id} pin={pin} data={data} mvRef={mvRef} status={statuses[pin.id]} />
      ))}

      {/* Anomaly banner */}
      <AnimatePresence>
        {isAnomaly && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/60 bg-red-950/80 backdrop-blur-md text-red-300 text-xs font-bold tracking-widest pointer-events-none animate-pulse"
          >
            <AlertTriangle size={13} /> ANOMALY DETECTED — CHECK HIGHLIGHTED ZONES
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        [slot^="hotspot-"][data-visible="false"] { display: none; }
        @keyframes ping { 75%,100% { transform: scale(2); opacity: 0; } }
      `}</style>

      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default ThreeScene;
