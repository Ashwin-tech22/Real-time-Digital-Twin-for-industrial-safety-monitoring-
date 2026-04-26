import React, { useState, useEffect, useRef } from 'react';
import { Activity, Thermometer, Wind, Waves, Gauge, AlertTriangle, Wifi, WifiOff, HardDrive, Maximize2, Minimize2 } from 'lucide-react';
import useMqtt from './useMqtt';
import SensorCard from './components/SensorCard';
import ThreeScene from './components/ThreeScene';
import LandingPage from './components/LandingPage';
import DashboardFX from './components/DashboardFX';
import AIInsightsPanel from './components/AIInsightsPanel';
import MobileAlertDispatcher from './components/MobileAlertDispatcher';
import { BrainCircuit } from 'lucide-react';

function App() {
  const { data, connected } = useMqtt();
  const [showLanding, setShowLanding] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const modelRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  const [history, setHistory] = useState([]);
  const [showAI, setShowAI] = useState(false);

  // Track historical data for AI Analyst
  useEffect(() => {
    if (data) {
      setHistory(prev => {
        const updated = [...prev, data];
        if (updated.length > 30) return updated.slice(updated.length - 30);
        return updated;
      });
    }
  }, [data]);

  // Lock/unlock body scroll for landing
  useEffect(() => {
    if (showLanding) document.body.classList.add('landing');
    else document.body.classList.remove('landing');
    return () => document.body.classList.remove('landing');
  }, [showLanding]);

  // Fullscreen API
  const toggleFullscreen = () => {
    const el = modelRef.current;
    if (!document.fullscreenElement) {
      el?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute status for different sensors based on thresholds
  const getStatus = (value, warning, danger) => {
    if (value >= danger) return 'danger';
    if (value >= warning) return 'warning';
    return 'success';
  };

  const getCO2Status = data ? getStatus(data.co2, 800, 1000) : 'normal';
  const getCOStatus = data ? getStatus(data.co, 9, 35) : 'normal';
  const getNoiseStatus = data ? getStatus(data.noise, 500, 700) : 'normal';
  const getTempStatus = data ? getStatus(data.dht11.temp, 28, 32) : 'normal';

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

  const sensorStatuses = {
    temp: getTempStatus,
    humidity: getHumidityStatus(data?.dht11?.humidity),
    pressure: getPressureStatus(data?.bmp180?.pressure),
    noise: getNoiseStatus,
    flow: getFlowStatus(data?.flow),
    co2: getCO2Status,
    co: getCOStatus
  };

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 font-sans relative">
      <DashboardFX />
      <MobileAlertDispatcher data={data} />

      {/* Header */}
      <header className="flex justify-between items-end px-4 md:px-8 pt-6 pb-4 border-b border-slate-800/60 relative z-20">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
              TwinSense
            </h1>
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm flex items-center gap-2">
            <HardDrive size={14} /> Node Monitor: <span className="text-slate-200 font-semibold">{data?.node || 'Scanning...'}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAI(!showAI)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-medium tracking-wide backdrop-blur-md transition-all duration-300 ${
              showAI ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                     : 'bg-blue-950/40 border-blue-500/30 text-blue-400 hover:bg-blue-900/60'
            }`}
          >
            <BrainCircuit size={16} className={showAI ? 'animate-pulse' : ''} />
            AI ANALYST
          </button>
          
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm backdrop-blur-md transition-colors duration-500 ${
          connected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : data    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {connected ? <><Wifi size={16} /><span className="font-medium tracking-wide">MQTT ONLINE</span></>
            : data   ? <><Activity size={16} /><span className="font-medium tracking-wide">SIMULATING</span></>
                     : <><WifiOff size={16} /><span className="font-medium tracking-wide">CONNECTING...</span></>}
          <div className={`w-2 h-2 rounded-full ml-1 ${
            connected ? 'bg-emerald-500 animate-pulse' : data ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'
          }`} />
          </div>
        </div>
      </header>

      {/* AI Insights Overlay */}
      {showAI && <AIInsightsPanel history={history} onClose={() => setShowAI(false)} />}

      {/* Full-width 3D Model */}
      <div ref={modelRef} className="relative w-full z-10 bg-[#020817]" style={{ height: fullscreen ? '100vh' : '75vh' }}>
        {/* Top-left label */}
        <div className="absolute top-4 left-4 z-20 glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-300 border-slate-700/50">
          <Activity size={12} className="text-blue-400" />
          3D SPATIAL VIEW
        </div>
        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-20 glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-300 border-slate-700/50 hover:border-blue-500/50 hover:text-blue-400 transition-all"
        >
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          {fullscreen ? 'EXIT' : 'FULLSCREEN'}
        </button>
        <ThreeScene data={data} statuses={sensorStatuses} />
        {!connected && !data && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-center justify-center">
            <div className="flex flex-col items-center p-6 glass-panel rounded-2xl border border-red-500/30 text-red-400">
              <AlertTriangle size={48} className="mb-4 animate-pulse opacity-80" />
              <h3 className="text-xl font-bold mb-2">Initialising...</h3>
              <p className="text-sm text-slate-400">Starting simulation — attempting MQTT connection...</p>
            </div>
          </div>
        )}
      </div>

      {/* Sensor Cards — free scrolling grid below the model */}
      <div className="px-4 md:px-8 py-8 relative z-10">
        <h2 className="text-[11px] font-bold text-slate-400 tracking-[0.25em] uppercase mb-6 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Live Telemetry · Building
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <SensorCard
            title="Temperature"
            value={data?.dht11?.temp?.toFixed(1) || '--'}
            unit="°C" icon={Thermometer}
            percentage={data ? (data.dht11.temp / 50) * 100 : 0}
            status={getTempStatus}
            desc="Safe < 28°C · Warning 28–32°C · Danger > 32°C. Above 30°C triggers HVAC cooling override."
          />
          <SensorCard
            title="Humidity"
            value={data?.dht11?.humidity?.toFixed(1) || '--'}
            unit="%" icon={Waves}
            percentage={data?.dht11?.humidity || 0}
            status={getHumidityStatus(data?.dht11?.humidity)}
            desc="Safe 40–60% · Warning 30–40% or 60–70% · Danger < 30% or > 70%."
          />
          <SensorCard
            title="Pressure"
            value={data?.bmp180?.pressure?.toFixed(2) || '--'}
            unit="hPa" icon={Gauge}
            percentage={data ? ((data.bmp180.pressure - 900) / 200) * 100 : 0}
            status={getPressureStatus(data?.bmp180?.pressure)}
            desc="Safe 1000–1020 hPa · Warning 980–1000 or 1020–1040 · Danger < 980 or > 1040 hPa."
          />
          <SensorCard
            title="Noise Level"
            value={data?.noise || '--'}
            unit="mV" icon={Activity}
            percentage={data ? (data.noise / 1024) * 100 : 0}
            status={getNoiseStatus}
            desc="Safe 0–500 mV · Warning 500–700 mV · Danger > 700 mV."
          />
          <SensorCard
            title="Flow Rate"
            value={data?.flow?.toFixed(1) || '--'}
            unit="L/min" icon={Wind}
            percentage={data ? (data.flow / 10) * 100 : 0}
            status={getFlowStatus(data?.flow)}
            desc="Safe 1–8 L/min · Warning 0.5–1 or 8–10 L/min · Danger < 0.5 or > 10 L/min."
          />
          <SensorCard
            title="CO₂ Level"
            value={data?.co2 || '--'}
            unit="ppm" icon={AlertTriangle}
            percentage={data ? (data.co2 / 2000) * 100 : 0}
            status={getCO2Status}
            desc="Safe 400–800 ppm · Warning 800–1000 ppm · Danger > 1000 ppm — occupancy alert."
          />
          <SensorCard
            title="CO Level"
            value={data?.co || '--'}
            unit="ppm" icon={AlertTriangle}
            percentage={data ? (data.co / 100) * 100 : 0}
            status={getCOStatus}
            desc="Safe 0–9 ppm · Warning 9–35 ppm · Danger > 35 ppm — immediate evacuation."
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 md:px-8 pb-6 flex justify-between items-center text-xs text-slate-500 font-medium z-20 relative">
        <div className="flex items-center gap-2">
          <span>Last Update:</span>
          {data ? (
            <span className="text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
              {new Date(data.timestamp).toLocaleTimeString() || '--'}
            </span>
          ) : (
            <span className="text-slate-500 bg-slate-900/50 px-2 py-1 rounded">Waiting for data...</span>
          )}
        </div>
        <div>System Time: {currentTime}</div>
      </footer>
    </div>
  );
}

export default App;
