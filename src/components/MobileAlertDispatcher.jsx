import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, AlertTriangle, X, BellRing } from 'lucide-react';

const COOLDOWN_MS = 60000; // 1 minute cooldown per parameter to prevent spam

export default function MobileAlertDispatcher({ data }) {
  const [alerts, setAlerts] = useState([]);
  const lastAlertTimes = useRef({});
  const TELEGRAM_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const [chatId, setChatId] = useState(localStorage.getItem('telegram_chat_id') || null);

  // Attempt to auto-fetch the Chat ID if we don't have it yet
  useEffect(() => {
    if (chatId || !TELEGRAM_TOKEN) return;
    
    const fetchChatId = async () => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`);
        const json = await res.json();
        if (json.ok && json.result.length > 0) {
          const latestUpdate = json.result[json.result.length - 1];
          const id = latestUpdate.message?.chat?.id || latestUpdate.my_chat_member?.chat?.id;
          if (id) {
            setChatId(id);
            localStorage.setItem('telegram_chat_id', id);
            console.log("✅ Linked to Telegram Chat ID:", id);
            
            // Send a welcome message
            fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: id, text: '🟢 *TwinSense Alert System Active*\n\nSuccessfully linked to safety monitor. You will receive critical push notifications here.', parse_mode: 'Markdown' })
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch Telegram chat ID", err);
      }
    };
    
    fetchChatId();
    const interval = setInterval(fetchChatId, 5000);
    return () => clearInterval(interval);
  }, [chatId, TELEGRAM_TOKEN]);

  useEffect(() => {
    if (!data) return;

    const now = Date.now();
    const newAlerts = [];

    // Define evaluation logic exactly matching the global threshold rules
    const checks = [
      { id: 'temp', name: 'Temperature', val: data.dht11?.temp, unit: '°C', check: v => v >= 32 ? 'danger' : v >= 28 ? 'warning' : 'safe' },
      { id: 'co2', name: 'CO₂', val: data.co2, unit: 'ppm', check: v => v >= 1000 ? 'danger' : v >= 800 ? 'warning' : 'safe' },
      { id: 'co', name: 'Carbon Monoxide', val: data.co, unit: 'ppm', check: v => v >= 35 ? 'danger' : v >= 9 ? 'warning' : 'safe' },
      { id: 'humidity', name: 'Humidity', val: data.dht11?.humidity, unit: '%', check: v => (v < 30 || v > 70) ? 'danger' : (v < 40 || v > 60) ? 'warning' : 'safe' },
      { id: 'pressure', name: 'Pressure', val: data.bmp180?.pressure, unit: 'hPa', check: v => (v < 980 || v > 1040) ? 'danger' : (v < 1000 || v > 1020) ? 'warning' : 'safe' },
      { id: 'flow', name: 'Flow Rate', val: data.flow, unit: 'L/min', check: v => (v < 0.5 || v > 10) ? 'danger' : (v < 1 || v > 8) ? 'warning' : 'safe' },
      { id: 'noise', name: 'Noise', val: data.noise, unit: 'mV', check: v => v >= 700 ? 'danger' : v >= 500 ? 'warning' : 'safe' },
    ];

    checks.forEach(c => {
      if (c.val == null || isNaN(c.val)) return;
      
      const status = c.check(c.val);
      if (status === 'danger' || status === 'warning') {
        const lastTime = lastAlertTimes.current[c.id] || 0;
        
        // If enough time has passed since the last alert for this specific parameter
        if (now - lastTime > COOLDOWN_MS) {
          lastAlertTimes.current[c.id] = now;
          
          const alertId = `${c.id}-${now}`;
          const isDanger = status === 'danger';
          
          newAlerts.push({
            id: alertId,
            title: isDanger ? 'CRITICAL ALERT DISPATCHED' : 'Warning Notification',
            message: `${c.name} is currently reading ${c.val.toFixed(1)}${c.unit}. This has breached the ${status} threshold!`,
            isDanger,
            timestamp: new Date().toLocaleTimeString()
          });

          // Dispatch REAL Telegram Push Notification
          if (chatId && TELEGRAM_TOKEN) {
            const icon = isDanger ? '🚨' : '⚠️';
            const textMsg = `${icon} *${isDanger ? 'CRITICAL ALERT' : 'WARNING'}*\n\n*${c.name}* is at *${c.val.toFixed(1)}${c.unit}*.\nThis has breached the ${status} threshold!\n\n_System: TwinSense Node Monitor_`;
            
            fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: textMsg,
                parse_mode: 'Markdown'
              })
            }).catch(e => console.error("Telegram send error:", e));
          } else {
            console.log(`[SMS PUSHED TO ENGINEER PHONE]: ${c.name} at ${status} level.`);
          }
        }
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts]);
      
      // Auto-remove alerts from the screen after 10 seconds
      newAlerts.forEach(alert => {
        setTimeout(() => {
          setAlerts(prev => prev.filter(a => a.id !== alert.id));
        }, 10000);
      });
    }
  }, [data]);

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm md:max-w-md px-4">
      <AnimatePresence>
        {alerts.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`pointer-events-auto overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl border ${
              alert.isDanger 
                ? 'bg-red-950/80 border-red-500/50 shadow-[0_10px_40px_rgba(239,68,68,0.4)]' 
                : 'bg-yellow-950/80 border-yellow-500/50 shadow-[0_10px_40px_rgba(245,158,11,0.4)]'
            }`}
          >
            <div className="px-4 py-3 flex items-start gap-4">
              <div className={`p-2.5 rounded-full mt-0.5 shrink-0 ${alert.isDanger ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                {alert.isDanger ? <AlertTriangle size={24} className="animate-pulse" /> : <BellRing size={24} />}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Smartphone size={13} className={alert.isDanger ? 'text-red-300' : 'text-yellow-300'} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${alert.isDanger ? 'text-red-400' : 'text-yellow-400'}`}>
                      {chatId ? 'Telegram Push Sent' : 'Awaiting Telegram Link'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{alert.timestamp}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-100 mb-1">{alert.title}</h4>
                <p className="text-xs text-slate-300 leading-snug">{alert.message}</p>
              </div>
              <button 
                onClick={() => removeAlert(alert.id)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white shrink-0 -mr-2 -mt-1"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Visual cooldown bar */}
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 10, ease: 'linear' }}
              className={`h-1 w-full ${alert.isDanger ? 'bg-red-500/50' : 'bg-yellow-500/50'}`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
