import { useState, useEffect } from 'react';

const THINGSPEAK_CHANNEL = import.meta.env.VITE_THINGSPEAK_CHANNEL;
const THINGSPEAK_API_KEY = import.meta.env.VITE_THINGSPEAK_API_KEY;
const POLL_INTERVAL      = 20000;

/* ── Pressure: Open-Meteo (free, no key) — Chennai ── */
const fetchPressure = async () => {
  try {
    const res  = await fetch('https://api.open-meteo.com/v1/forecast?latitude=13.0827&longitude=80.2707&current=surface_pressure');
    const json = await res.json();
    const p = json?.current?.surface_pressure;
    if (p) return parseFloat(p.toFixed(2));
  } catch (e) {
    console.warn('Open-Meteo failed:', e);
  }
  return 1013.25;
};

/* ── Noise: CO₂ + Temp occupancy model ── */
const deriveNoise = (co2ppm, temp) => {
  const noise = (co2ppm / 1000) * 300 + (temp / 50) * 200;
  return Math.round(Math.min(1024, Math.max(0, noise)));
};

/* ── Flow Rate: temperature delta model ── */
const deriveFlow = (temp) => {
  const flow = Math.max(0, 10 - (temp - 20) * 0.3);
  return parseFloat(flow.toFixed(1));
};

/* ── MQ-135 raw ADC → CO₂ ppm ── */
const rawToCO2 = (raw) => {
  if (!raw || raw <= 0) return 400;
  const vout = (raw / 4095.0) * 3.3;
  return Math.round(116.6020682 * Math.pow(vout / 0.76, -2.769034857));
};

/* ── Main fetch: ThingSpeak + Open-Meteo in parallel ── */
const fetchAll = async () => {
  const tsUrl = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL}/feeds/last.json?api_key=${THINGSPEAK_API_KEY}`;

  const [tsRes, pressure] = await Promise.all([
    fetch(tsUrl).then(r => r.json()),
    fetchPressure(),
  ]);

  const temp     = parseFloat(tsRes.field1);
  const humidity = parseFloat(tsRes.field2);
  const co2ppm   = rawToCO2(parseFloat(tsRes.field3));
  const co       = parseFloat(tsRes.field4);

  return {
    node:      'thermal_plant_01',
    timestamp: tsRes.created_at,
    dht11:     { temp, humidity },
    bmp180:    { pressure },
    co2:       co2ppm,
    co,
    noise:     deriveNoise(co2ppm, temp),
    flow:      deriveFlow(temp),
  };
};

const useMqtt = () => {
  const [data, setData]           = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const live = await fetchAll();
        setData(live);
        setConnected(true);
        console.log('✅ TwinSense data:', live);
      } catch (e) {
        console.warn('Fetch failed:', e);
        setConnected(false);
      }
    };

    run();
    const interval = setInterval(run, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { data, connected };
};

export default useMqtt;
