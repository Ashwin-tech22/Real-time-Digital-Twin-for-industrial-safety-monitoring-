import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronDown, Building2, Rocket, Car, Thermometer, Wind, Waves, Gauge, Activity, AlertTriangle, Zap, Shield } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollFX from './ScrollFX';

gsap.registerPlugin(ScrollTrigger);

const cases = [
  {
    id: 'building', label: 'Smart Building', icon: Building2,
    model: '/glow building.glb', accent: 'from-blue-400 to-cyan-400', accentSolid: '#38bdf8',
    orbit: { az: 0, polar: 72, zoom: 120 },
    title: 'Building Environment Monitor',
    summary: 'A digital twin of a smart building continuously ingests sensor data to maintain occupant comfort, energy efficiency, and structural safety — all visualised in real time.',
    sensors: [
      { icon: Thermometer,   label: 'Temperature & Humidity',  desc: 'DHT11 sensors across floors track thermal comfort zones and flag HVAC anomalies.' },
      { icon: Waves,         label: 'Air Quality (CO₂ / CO)',  desc: 'MQ-series gas sensors detect CO₂ build-up and carbon monoxide leaks for safe occupancy.' },
      { icon: Gauge,         label: 'Barometric Pressure',     desc: 'BMP180 monitors pressure differentials between floors to optimise ventilation.' },
      { icon: Activity,      label: 'Noise Level',             desc: 'Acoustic sensors map noise pollution per zone for smart zoning decisions.' },
      { icon: Wind,          label: 'Flow Rate',               desc: 'Water and air flow meters ensure HVAC and plumbing systems run within spec.' },
      { icon: AlertTriangle, label: 'Anomaly Alerts',          desc: 'Threshold-based alerts trigger instantly when any parameter exceeds safe limits.' },
    ],
  },
  {
    id: 'rocket', label: 'GSLV Mk III Rocket', icon: Rocket,
    model: '/rocket.glb', accent: 'from-orange-400 to-red-400', accentSolid: '#fb923c',
    orbit: { az: 0, polar: 75, zoom: 110 },
    title: 'Launch Vehicle Structural Twin',
    summary: 'The GSLV Mk III digital twin monitors structural integrity and thermal loads across every flight phase — from ignition through Max-Q to orbital insertion.',
    sensors: [
      { icon: Gauge,         label: 'Strain / Stress',             desc: 'Strain gauges at critical joints, propellant tank walls, and payload fairings monitor load distributions.' },
      { icon: Activity,      label: 'Vibration (Accelerometers)',  desc: 'High-frequency accelerometers capture acoustics, vibrations, and shock loads to detect potential structural failures.' },
      { icon: Thermometer,   label: 'Surface Temperature',         desc: 'Thermocouples and fiber-optic sensors monitor aerodynamic heating on the nose cone and leading edges.' },
      { icon: Wind,          label: 'Exterior Pressure',           desc: 'Pressure transducers measure aerodynamic pressure distribution and identify potential buckling areas.' },
      { icon: Zap,           label: 'Propulsion Telemetry',        desc: 'Engine chamber pressure, thrust vector and fuel flow are streamed live for real-time performance validation.' },
      { icon: AlertTriangle, label: 'Abort Triggers',              desc: 'Automated flight termination logic activates if structural or thermal limits are breached mid-flight.' },
    ],
  },
  {
    id: 'f1', label: 'F1 McLaren MCL35M', icon: Car,
    model: '/f1_2021_mclaren_mcl35m.glb', accent: 'from-orange-300 to-yellow-400', accentSolid: '#fbbf24',
    orbit: { az: 0, polar: 68, zoom: 75 },
    title: 'Formula 1 Race Car Twin',
    summary: 'Every lap, the McLaren MCL35M generates gigabytes of telemetry. Its digital twin fuses aero, mechanical, thermal and hybrid data to optimise setup and strategy in real time.',
    sensors: [
      { icon: Wind,        label: 'Aero Pressure & Downforce', desc: 'Pitot tubes and pressure taps across bodywork and wings measure aero loading to optimise downforce levels.' },
      { icon: Gauge,       label: 'Ride Height (Laser)',       desc: 'Laser sensors measure chassis-to-ground distance to the sub-millimetre for aerodynamic pitch and roll.' },
      { icon: Activity,    label: 'Suspension & Dampers',      desc: 'Damper potentiometers and corner load sensors analyse mechanical grip and cornering behaviour.' },
      { icon: Thermometer, label: 'Engine & Airbox Temps',     desc: 'Monitoring intake, water, and oil temperatures to optimise cooling efficiency at race pace.' },
      { icon: Zap,         label: 'ERS / Battery (Hybrid)',    desc: 'Energy recovery patterns, battery imbalance, and ERS deployment are tracked for hybrid optimisation.' },
      { icon: Waves,       label: 'G-Force & Fuel Flow',       desc: 'Tri-axis accelerometers log longitudinal, lateral and vertical G-forces; FIA fuel flow sensors ensure compliance.' },
    ],
  },
  {
    id: 'tanker', label: 'M10 Wolverine Tanker', icon: Shield,
    model: '/tanker.glb', accent: 'from-green-400 to-lime-400', accentSolid: '#4ade80',
    orbit: { az: 0, polar: 70, zoom: 70 },
    title: 'M10 Wolverine Combat Vehicle Twin',
    summary: 'The M10 Wolverine digital twin integrates powertrain, structural, weapon, and crew telemetry into a unified real-time model — enabling predictive maintenance, mission readiness assessment, and battlefield situational awareness.',
    sensors: [
      { icon: Gauge,         label: 'Engine & Powertrain',       desc: 'RPM, oil pressure, coolant temp, fuel consumption, torque, transmission fluid temp, axle torque, and gear position monitored continuously.' },
      { icon: Activity,      label: 'Suspension & Mobility',     desc: 'Shock absorber stroke, hydraulic pressure, torsion bar deflection, wheel speed, slip ratio, and steering angle for terrain response analysis.' },
      { icon: Zap,           label: 'Structural Health',         desc: 'Accelerometers on hull, turret, and suspension measure vibration fatigue; strain gauges detect armor deformation and fatigue cracks.' },
      { icon: AlertTriangle, label: 'Firepower & Weapons',       desc: 'Turret azimuth/elevation angles, actuator torque, barrel temperature, recoil pressure, and ammo compartment humidity tracked in real time.' },
      { icon: Wind,          label: 'Navigation & Environment',  desc: 'High-precision GPS, speed over ground, altitude, ambient weather data, and LiDAR/Radar terrain sensing for obstacle detection.' },
      { icon: Shield,        label: 'Electrical & Crew Systems', desc: 'Battery voltage, power load, electronics cooling temps, crew compartment environment, and ergonomic operation patterns for human digital twin.' },
    ],
  },
];

/* ── Per-section lighting colours ── */
const LIGHT_THEMES = [
  { // building — cyan/blue
    primary:   '#38bdf8',
    secondary: '#6366f1',
    tertiary:  '#0ea5e9',
    beam1: 'rgba(56,189,248,0.18)',
    beam2: 'rgba(99,102,241,0.13)',
  },
  { // rocket — orange/red
    primary:   '#fb923c',
    secondary: '#ef4444',
    tertiary:  '#f97316',
    beam1: 'rgba(251,146,60,0.18)',
    beam2: 'rgba(239,68,68,0.13)',
  },
  { // f1 — yellow/amber
    primary:   '#fbbf24',
    secondary: '#f59e0b',
    tertiary:  '#fde68a',
    beam1: 'rgba(251,191,36,0.18)',
    beam2: 'rgba(245,158,11,0.13)',
  },
  { // tanker — green/lime
    primary:   '#4ade80',
    secondary: '#22d3ee',
    tertiary:  '#a3e635',
    beam1: 'rgba(74,222,128,0.18)',
    beam2: 'rgba(34,211,238,0.13)',
  },
];

/* ── Animated lighting layer for each use-case section ── */
const SectionLights = ({ theme, isEven }) => {
  const beam1Ref   = useRef(null);
  const beam2Ref   = useRef(null);
  const sweepRef   = useRef(null);
  const orb1Ref    = useRef(null);
  const orb2Ref    = useRef(null);
  const borderRef  = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ repeat: -1, yoyo: true });

    // Beam 1 — slow drift top-left to bottom-right
    tl.to(beam1Ref.current, {
      x: isEven ? 80 : -80, y: 60, opacity: 0.9,
      duration: 4, ease: 'sine.inOut',
    }, 0);

    // Beam 2 — opposite drift
    tl.to(beam2Ref.current, {
      x: isEven ? -60 : 60, y: -50, opacity: 0.8,
      duration: 5, ease: 'sine.inOut',
    }, 0.5);

    // Orb 1 — float
    gsap.to(orb1Ref.current, {
      y: -30, x: 20, scale: 1.15,
      duration: 3.5, ease: 'sine.inOut',
      repeat: -1, yoyo: true,
    });

    // Orb 2 — float opposite phase
    gsap.to(orb2Ref.current, {
      y: 25, x: -25, scale: 0.88,
      duration: 4.2, ease: 'sine.inOut',
      repeat: -1, yoyo: true,
      delay: 1.2,
    });

    // Sweep line — horizontal scan every 3.5s
    const sweepTl = gsap.timeline({ repeat: -1, repeatDelay: 2.5 });
    sweepTl
      .set(sweepRef.current,  { scaleX: 0, opacity: 0.9, transformOrigin: 'left center' })
      .to(sweepRef.current,   { scaleX: 1, duration: 0.7, ease: 'power2.out' })
      .to(sweepRef.current,   { opacity: 0, duration: 0.4, ease: 'power2.in' });

    // Border pulse
    gsap.to(borderRef.current, {
      boxShadow: `0 0 0 2px ${theme.primary}60, 0 0 40px ${theme.primary}30, inset 0 0 40px ${theme.secondary}10`,
      duration: 2, ease: 'sine.inOut', repeat: -1, yoyo: true,
    });

    return () => { tl.kill(); sweepTl.kill(); };
  }, [theme, isEven]);

  return (
    <>
      {/* Pulsing border overlay */}
      <div ref={borderRef} className="absolute inset-0 pointer-events-none rounded-none z-0"
        style={{ boxShadow: `0 0 0 1px ${theme.primary}20` }} />

      {/* Corner brackets — top-left */}
      <div className="absolute top-4 left-4 pointer-events-none z-10" style={{ width: 40, height: 40 }}>
        <div style={{ position:'absolute', top:0, left:0, width:18, height:3, background: theme.primary, borderRadius:2, boxShadow:`0 0 8px ${theme.primary}` }} />
        <div style={{ position:'absolute', top:0, left:0, width:3, height:18, background: theme.primary, borderRadius:2, boxShadow:`0 0 8px ${theme.primary}` }} />
      </div>
      {/* Corner brackets — top-right */}
      <div className="absolute top-4 right-4 pointer-events-none z-10" style={{ width: 40, height: 40 }}>
        <div style={{ position:'absolute', top:0, right:0, width:18, height:3, background: theme.secondary, borderRadius:2, boxShadow:`0 0 8px ${theme.secondary}` }} />
        <div style={{ position:'absolute', top:0, right:0, width:3, height:18, background: theme.secondary, borderRadius:2, boxShadow:`0 0 8px ${theme.secondary}` }} />
      </div>
      {/* Corner brackets — bottom-left */}
      <div className="absolute bottom-4 left-4 pointer-events-none z-10" style={{ width: 40, height: 40 }}>
        <div style={{ position:'absolute', bottom:0, left:0, width:18, height:3, background: theme.secondary, borderRadius:2, boxShadow:`0 0 8px ${theme.secondary}` }} />
        <div style={{ position:'absolute', bottom:0, left:0, width:3, height:18, background: theme.secondary, borderRadius:2, boxShadow:`0 0 8px ${theme.secondary}` }} />
      </div>
      {/* Corner brackets — bottom-right */}
      <div className="absolute bottom-4 right-4 pointer-events-none z-10" style={{ width: 40, height: 40 }}>
        <div style={{ position:'absolute', bottom:0, right:0, width:18, height:3, background: theme.primary, borderRadius:2, boxShadow:`0 0 8px ${theme.primary}` }} />
        <div style={{ position:'absolute', bottom:0, right:0, width:3, height:18, background: theme.primary, borderRadius:2, boxShadow:`0 0 8px ${theme.primary}` }} />
      </div>

      {/* Floating orb 1 */}
      <div ref={orb1Ref} className="absolute pointer-events-none"
        style={{ width: 420, height: 420, borderRadius:'50%', filter:'blur(80px)', opacity:0.13,
          background: `radial-gradient(circle, ${theme.primary}, transparent 70%)`,
          [isEven ? 'right' : 'left']: '-80px', top: '10%' }} />

      {/* Floating orb 2 */}
      <div ref={orb2Ref} className="absolute pointer-events-none"
        style={{ width: 300, height: 300, borderRadius:'50%', filter:'blur(60px)', opacity:0.12,
          background: `radial-gradient(circle, ${theme.secondary}, transparent 70%)`,
          [isEven ? 'left' : 'right']: '5%', bottom: '10%' }} />

      {/* Diagonal beam 1 */}
      <div ref={beam1Ref} className="absolute pointer-events-none"
        style={{ width:'70%', height:'100%', top:0, [isEven?'right':'left']:0, opacity:0.6,
          background: `linear-gradient(${isEven?'135deg':'45deg'}, transparent 40%, ${theme.beam1} 60%, transparent 80%)` }} />

      {/* Diagonal beam 2 */}
      <div ref={beam2Ref} className="absolute pointer-events-none"
        style={{ width:'50%', height:'100%', top:0, [isEven?'left':'right']:0, opacity:0.5,
          background: `linear-gradient(${isEven?'45deg':'135deg'}, transparent 30%, ${theme.beam2} 55%, transparent 75%)` }} />

      {/* Horizontal sweep line */}
      <div ref={sweepRef} className="absolute pointer-events-none z-10"
        style={{ left:0, top:'48%', width:'100%', height:1.5,
          background: `linear-gradient(90deg, transparent, ${theme.primary}, ${theme.tertiary}, transparent)`,
          boxShadow: `0 0 12px 2px ${theme.primary}80`, opacity:0 }} />

      {/* Top edge glow */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent 5%, ${theme.primary}80 30%, ${theme.tertiary}80 70%, transparent 95%)`,
          boxShadow: `0 0 10px 1px ${theme.primary}50` }} />
      {/* Bottom edge glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent 5%, ${theme.secondary}80 30%, ${theme.primary}80 70%, transparent 95%)`,
          boxShadow: `0 0 10px 1px ${theme.secondary}50` }} />
    </>
  );
};

function useGsapEntrance(elRef, scrollEl, fromVars, toVars) {
  useEffect(() => {
    const el = elRef.current;
    if (!el || !scrollEl) return;
    gsap.set(el, fromVars);
    const st = ScrollTrigger.create({
      scroller: scrollEl,
      trigger: el,
      start: 'top 88%',
      end:   'top 40%',
      scrub: 0.8,
      animation: gsap.to(el, { ...toVars, ease: 'power3.out' }),
    });
    return () => st.kill();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollEl]);
}

/* ── CaseSection ── */
const CaseSection = ({ c, index, isActive, scrollEl }) => {
  const modelRef    = useRef(null);
  const hoverRef    = useRef(false);
  const textRef     = useRef(null);
  const modelBoxRef = useRef(null);
  const Icon        = c.icon;
  const isEven      = index % 2 === 0;
  const theme       = LIGHT_THEMES[index % LIGHT_THEMES.length];

  // GSAP scrub: text flies in from side, model from opposite
  useGsapEntrance(textRef,     scrollEl,
    { opacity: 0, x: isEven ? -120 : 120, filter: 'blur(8px)' },
    { opacity: 1, x: 0,                   filter: 'blur(0px)', duration: 1 }
  );
  useGsapEntrance(modelBoxRef, scrollEl,
    { opacity: 0, x: isEven ?  120 : -120, rotateY: isEven ? 25 : -25, filter: 'blur(6px)' },
    { opacity: 1, x: 0,                    rotateY: 0,                  filter: 'blur(0px)', duration: 1 }
  );

  const handleMouseMove = useCallback((e) => {
    const mv = modelRef.current;
    if (!mv || hoverRef.current) return;
    const { innerWidth: W, innerHeight: H } = window;
    const az    = c.orbit.az    + ((e.clientX / W) - 0.5) * 60;
    const polar = c.orbit.polar + ((e.clientY / H) - 0.5) * 20;
    mv.setAttribute('camera-orbit', `${az}deg ${polar}deg ${c.orbit.zoom}%`);
  }, [c]);

  useEffect(() => {
    if (!isActive) return;
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isActive, handleMouseMove]);

  const onModelEnter = () => { hoverRef.current = true; };
  const onModelLeave = () => {
    hoverRef.current = false;
    const mv = modelRef.current;
    if (mv) mv.setAttribute('camera-orbit', `${c.orbit.az}deg ${c.orbit.polar}deg ${c.orbit.zoom}%`);
  };

  return (
    <section
      className="relative w-full flex items-center justify-center px-6 md:px-16"
      style={{ height: '100vh', scrollSnapAlign: 'start', background: '#020817', overflow: 'hidden' }}
    >
      {/* ── Lighting FX ── */}
      <SectionLights theme={theme} isEven={isEven} />

      <div className={`relative z-10 w-full max-w-6xl flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-12`}>

        {/* Text */}
        <div ref={textRef} className="flex-1 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl border" style={{ background: `${c.accentSolid}15`, borderColor: `${c.accentSolid}40` }}>
              <Icon size={20} style={{ color: c.accentSolid }} />
            </div>
            <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: c.accentSolid }}>
              Use Case {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <h2 className={`text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${c.accent} leading-tight`}>{c.title}</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-md">{c.summary}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {c.sensors.map(({ icon: SIcon, label, desc }) => (
              <div key={label}
                className="flex gap-3 p-3 rounded-xl border border-slate-800/60 bg-slate-900/50 transition-all duration-300 cursor-default"
                onMouseEnter={e => e.currentTarget.style.borderColor = `${c.accentSolid}60`}
                onMouseLeave={e => e.currentTarget.style.borderColor = ''}
              >
                <div className="mt-0.5 shrink-0 p-1.5 rounded-lg" style={{ background: `${c.accentSolid}15` }}>
                  <SIcon size={13} style={{ color: c.accentSolid }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200 mb-0.5">{label}</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model */}
        <div
          ref={modelBoxRef}
          className="flex-1 w-full"
          style={{ height: '75vh', maxHeight: 560, minHeight: 340 }}
          onMouseEnter={onModelEnter}
          onMouseLeave={onModelLeave}
        >
          <model-viewer
            ref={modelRef}
            alt={c.label}
            src={c.model}
            autoplay
            camera-controls
            interaction-prompt="none"
            touch-action="pan-y"
            camera-orbit={`${c.orbit.az}deg ${c.orbit.polar}deg ${c.orbit.zoom}%`}
            shadow-intensity="1.8"
            environment-intensity="1.8"
            exposure="1.3"
            style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
          ></model-viewer>
        </div>

      </div>
    </section>
  );
};

/* ── LandingPage ── */
const LandingPage = ({ onEnter }) => {
  const containerRef = useRef(null);
  const [activeSection, setActiveSection] = useState(0);
  const [scrollEl, setScrollEl] = useState(null);

  const setContainer = useCallback((el) => {
    containerRef.current = el;
    if (el) setScrollEl(el);
  }, []);

  // hero GSAP
  const heroContentRef = useRef(null);
  useEffect(() => {
    const el = heroContentRef.current;
    if (!el) return;
    gsap.fromTo(el,
      { opacity: 0, y: 60, filter: 'blur(10px)' },
      { opacity: 1, y: 0,  filter: 'blur(0px)', duration: 1.2, ease: 'power3.out', delay: 0.2 }
    );
  }, []);

  // hazmat GSAP
  const hazmatModelRef = useRef(null);
  const hazmatRightRef = useRef(null);
  useGsapEntrance(hazmatModelRef, scrollEl,
    { opacity: 0, x: -100, filter: 'blur(8px)' },
    { opacity: 1, x: 0,    filter: 'blur(0px)', duration: 1 }
  );
  useGsapEntrance(hazmatRightRef, scrollEl,
    { opacity: 0, x: 100,  filter: 'blur(8px)' },
    { opacity: 1, x: 0,    filter: 'blur(0px)', duration: 1 }
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setActiveSection(Math.round(el.scrollTop / window.innerHeight));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollEl]);

  const scrollTo = (i) => containerRef.current?.scrollTo({ top: i * window.innerHeight, behavior: 'smooth' });

  return (
    <div
      ref={setContainer}
      className="w-full text-slate-200"
      style={{ height: '100vh', overflowY: 'scroll', scrollSnapType: 'y mandatory' }}
    >
      {/* Three.js particle + GSAP scroll FX layer */}
      <ScrollFX scrollEl={scrollEl} />

      {/* ══ SECTION 0 — Hero ══ */}
      <section
        className="relative w-full flex flex-col items-center justify-center text-center px-6 overflow-hidden"
        style={{ height: '100vh', scrollSnapAlign: 'start', background: 'radial-gradient(ellipse at top, #0f172a, #020817)' }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.05) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #10b981, transparent)' }} />

        <div ref={heroContentRef} className="relative z-10 flex flex-col items-center gap-4 max-w-3xl">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            IoT · MQTT · Real-Time 3D
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 leading-tight">
            TwinSense
          </h1>
          <p className="text-slate-400 text-base max-w-xl leading-relaxed">
            A real-time digital replica of any physical system — sensor data streams live into an interactive 3D model,
            giving instant visibility into structural, environmental, and operational conditions.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {[['4','Use Cases'],['15+','Sensor Types'],['Live','MQTT Stream'],['3D','Spatial View']].map(([val,lbl]) => (
              <div key={lbl} className="px-4 py-2 rounded-xl border border-slate-700/60 bg-slate-900/60 backdrop-blur-sm">
                <span className="text-lg font-bold text-white">{val}</span>
                <span className="text-xs text-slate-400 ml-1.5">{lbl}</span>
              </div>
            ))}
          </div>
          <button onClick={onEnter}
            className="mt-4 px-10 py-3 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold tracking-wide hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-blue-500/25 text-sm">
            Enter Dashboard →
          </button>
        </div>

        <button onClick={() => scrollTo(1)} className="absolute bottom-8 flex flex-col items-center gap-1 text-slate-500 hover:text-blue-400 transition-colors z-10">
          <span className="text-[10px] tracking-[0.2em] uppercase">Explore Use Cases</span>
          <ChevronDown size={20} className="animate-bounce" />
        </button>
      </section>

      {/* ══ SECTIONS 1-4 — Use Cases ══ */}
      {cases.map((c, i) => (
        <CaseSection key={c.id} c={c} index={i} isActive={activeSection === i + 1} scrollEl={scrollEl} />
      ))}

      {/* ══ SECTION 5 — Hazmat Guy CTA ══ */}
      <section
        className="relative w-full overflow-hidden"
        style={{ height: '100vh', scrollSnapAlign: 'start', background: 'radial-gradient(ellipse at bottom, #0f172a, #020817)' }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(rgba(16,185,129,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.04) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #4ade80, transparent 70%)' }} />

        <div className="relative z-10 w-full h-full flex flex-row items-stretch max-w-6xl mx-auto px-8">

          {/* LEFT — hazmat model slides in from left */}
          <div
            ref={hazmatModelRef}
            className="flex items-end justify-center"
            style={{ width: 220, flexShrink: 0, height: '100%' }}
            onMouseEnter={e => e.currentTarget.querySelector('model-viewer').setAttribute('camera-controls', '')}
            onMouseLeave={e => e.currentTarget.querySelector('model-viewer').setAttribute('camera-orbit', '0deg 88deg 110%')}
          >
            <model-viewer
              alt="Hazmat Guy"
              src="/hazmat.glb"
              autoplay
              camera-controls
              interaction-prompt="none"
              touch-action="pan-y"
              camera-orbit="0deg 88deg 110%"
              shadow-intensity="1.5"
              environment-intensity="1.8"
              exposure="1.2"
              style={{ width: '100%', height: '70%', backgroundColor: 'transparent' }}
            ></model-viewer>
          </div>

          {/* RIGHT — content slides in from right */}
          <div
            ref={hazmatRightRef}
            className="flex-1 flex flex-col justify-center items-start gap-6 pl-8"
          >
            {/* Speech bubble */}
            <div className="relative px-5 py-4 rounded-2xl"
              style={{ background: 'rgba(15,23,42,0.92)', border: '1.5px solid rgba(59,130,246,0.5)', boxShadow: '0 0 28px rgba(59,130,246,0.3)', animation: 'floatBubble 2.8s ease-in-out infinite', maxWidth: 380 }}
            >
              <div className="absolute top-6 -left-3 w-0 h-0"
                style={{ borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: '12px solid rgba(59,130,246,0.5)' }} />
              <div className="absolute top-6 -left-2.5 w-0 h-0"
                style={{ borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderRight: '11px solid rgba(15,23,42,0.92)' }} />
              <p className="text-xs text-emerald-400 font-semibold tracking-wide uppercase mb-2">From a Field Worker</p>
              <p className="text-sm text-slate-300 leading-relaxed mb-1">Workers like me also get benefitted from this Digital Twin —</p>
              <p className="text-sm font-bold text-white leading-snug">
                Real-time hazard alerts, air quality monitoring &amp; safe zone mapping keep us protected on the job! 🦺
              </p>
              <div className="flex gap-1 mt-3">
                {[0,1,2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400"
                    style={{ animation: `dotPulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400 mb-2">Ready to Monitor?</h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Connect your MQTT broker, deploy your sensors, and watch your physical environment come alive.
              </p>
            </div>

            <button onClick={onEnter}
              className="relative px-16 py-5 rounded-full text-white font-bold tracking-wide text-lg self-center"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#10b981)', boxShadow: '0 0 32px rgba(59,130,246,0.45)' }}
            >
              <span className="absolute inset-0 rounded-full border-2 border-white/30" style={{ animation: 'ctaPing 1.6s ease-out infinite' }} />
              <span className="relative z-10">Launch Dashboard →</span>
            </button>
          </div>
        </div>

        <style>{`
          @keyframes floatBubble { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes dotPulse    { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
          @keyframes ctaPing     { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.5);opacity:0} }
        `}</style>
      </section>

      {/* Dot nav */}
      <nav className="fixed right-5 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2.5">
        {[0,1,2,3,4,5].map(i => (
          <button key={i} onClick={() => scrollTo(i)} className="rounded-full transition-all duration-300"
            style={{ width: activeSection===i?8:6, height: activeSection===i?8:6, background: activeSection===i?'#38bdf8':'rgba(148,163,184,0.4)', boxShadow: activeSection===i?'0 0 8px #38bdf8':'none' }}
            aria-label={`Go to section ${i+1}`} />
        ))}
      </nav>

    </div>
  );
};

export default LandingPage;
