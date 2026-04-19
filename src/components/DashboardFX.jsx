import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/* cyan/blue + emerald — matches the dashboard header gradient */
const THEME = {
  primary:   '#38bdf8',
  secondary: '#10b981',
  tertiary:  '#6366f1',
  beam1: 'rgba(56,189,248,0.10)',
  beam2: 'rgba(16,185,129,0.08)',
};

export default function DashboardFX() {
  const beam1Ref  = useRef(null);
  const beam2Ref  = useRef(null);
  const sweepRef  = useRef(null);
  const orb1Ref   = useRef(null);
  const orb2Ref   = useRef(null);
  const orb3Ref   = useRef(null);
  const borderRef = useRef(null);

  useEffect(() => {
    /* beam drift */
    gsap.to(beam1Ref.current, {
      x: 60, y: 40, opacity: 0.85,
      duration: 5, ease: 'sine.inOut', repeat: -1, yoyo: true,
    });
    gsap.to(beam2Ref.current, {
      x: -50, y: -35, opacity: 0.75,
      duration: 6, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1,
    });

    /* orb floats */
    gsap.to(orb1Ref.current, {
      y: -28, x: 18, scale: 1.12,
      duration: 4, ease: 'sine.inOut', repeat: -1, yoyo: true,
    });
    gsap.to(orb2Ref.current, {
      y: 22, x: -20, scale: 0.9,
      duration: 5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1.5,
    });
    gsap.to(orb3Ref.current, {
      y: -18, x: -14, scale: 1.08,
      duration: 4.5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.8,
    });

    /* horizontal sweep — fires every 4s */
    const sweepTl = gsap.timeline({ repeat: -1, repeatDelay: 3 });
    sweepTl
      .set(sweepRef.current,  { scaleX: 0, opacity: 0.8, transformOrigin: 'left center' })
      .to(sweepRef.current,   { scaleX: 1, duration: 0.9, ease: 'power2.out' })
      .to(sweepRef.current,   { opacity: 0, duration: 0.4, ease: 'power2.in' });

    /* border pulse */
    gsap.to(borderRef.current, {
      boxShadow: `0 0 0 1.5px ${THEME.primary}50, 0 0 60px ${THEME.primary}18, inset 0 0 60px ${THEME.secondary}08`,
      duration: 2.5, ease: 'sine.inOut', repeat: -1, yoyo: true,
    });

    return () => gsap.killTweensOf([
      beam1Ref.current, beam2Ref.current,
      orb1Ref.current, orb2Ref.current, orb3Ref.current,
      sweepRef.current, borderRef.current,
    ]);
  }, []);

  const corner = (pos, color) => {
    const s = { position: 'absolute', ...pos };
    return (
      <div style={{ ...s, width: 44, height: 44, pointerEvents: 'none', zIndex: 30 }}>
        <div style={{ position:'absolute', top:0, left:0, width:20, height:3, background:color, borderRadius:2, boxShadow:`0 0 8px ${color}` }} />
        <div style={{ position:'absolute', top:0, left:0, width:3, height:20, background:color, borderRadius:2, boxShadow:`0 0 8px ${color}` }} />
      </div>
    );
  };

  return (
    <>
      {/* Pulsing border */}
      <div ref={borderRef} className="absolute inset-0 pointer-events-none z-0"
        style={{ boxShadow: `0 0 0 1px ${THEME.primary}15` }} />

      {/* Corner brackets */}
      {corner({ top: 0, left: 0 },   THEME.primary)}
      {corner({ top: 0, right: 0 },  THEME.secondary)}
      {corner({ bottom: 0, left: 0 }, THEME.secondary)}
      {corner({ bottom: 0, right: 0 }, THEME.primary)}

      {/* Floating orbs */}
      <div ref={orb1Ref} className="absolute pointer-events-none"
        style={{ width: 500, height: 500, borderRadius:'50%', filter:'blur(90px)', opacity:0.07,
          background:`radial-gradient(circle, ${THEME.primary}, transparent 70%)`,
          top:'-10%', left:'-5%' }} />
      <div ref={orb2Ref} className="absolute pointer-events-none"
        style={{ width: 380, height: 380, borderRadius:'50%', filter:'blur(80px)', opacity:0.07,
          background:`radial-gradient(circle, ${THEME.secondary}, transparent 70%)`,
          bottom:'-8%', right:'-4%' }} />
      <div ref={orb3Ref} className="absolute pointer-events-none"
        style={{ width: 280, height: 280, borderRadius:'50%', filter:'blur(70px)', opacity:0.06,
          background:`radial-gradient(circle, ${THEME.tertiary}, transparent 70%)`,
          top:'40%', right:'30%' }} />

      {/* Diagonal beams */}
      <div ref={beam1Ref} className="absolute pointer-events-none inset-0"
        style={{ background:`linear-gradient(135deg, transparent 35%, ${THEME.beam1} 60%, transparent 80%)`, opacity:0.6 }} />
      <div ref={beam2Ref} className="absolute pointer-events-none inset-0"
        style={{ background:`linear-gradient(45deg, transparent 30%, ${THEME.beam2} 55%, transparent 75%)`, opacity:0.5 }} />

      {/* Horizontal sweep line */}
      <div ref={sweepRef} className="absolute pointer-events-none z-20"
        style={{ left:0, top:'50%', width:'100%', height:1.5,
          background:`linear-gradient(90deg, transparent, ${THEME.primary}, ${THEME.secondary}, transparent)`,
          boxShadow:`0 0 14px 3px ${THEME.primary}70`, opacity:0 }} />

      {/* Top edge glow */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none z-20"
        style={{ background:`linear-gradient(90deg, transparent 5%, ${THEME.primary}70 30%, ${THEME.secondary}70 70%, transparent 95%)`,
          boxShadow:`0 0 10px 1px ${THEME.primary}40` }} />
      {/* Bottom edge glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none z-20"
        style={{ background:`linear-gradient(90deg, transparent 5%, ${THEME.secondary}70 30%, ${THEME.primary}70 70%, transparent 95%)`,
          boxShadow:`0 0 10px 1px ${THEME.secondary}40` }} />
    </>
  );
}
