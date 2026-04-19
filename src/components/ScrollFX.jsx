import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// accent colours per section index
const SECTION_COLORS = [
  '#3b82f6', // hero   — blue
  '#38bdf8', // building — cyan
  '#fb923c', // rocket  — orange
  '#fbbf24', // f1      — yellow
  '#4ade80', // tanker  — green
  '#10b981', // hazmat  — emerald
];

export default function ScrollFX({ scrollEl }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scrollEl) return;

    /* ── Three.js setup ── */
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.z = 50;

    /* ── Particle field ── */
    const COUNT = 1800;
    const positions = new Float32Array(COUNT * 3);
    const colors    = new Float32Array(COUNT * 3);
    const sizes     = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 160;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
      colors[i * 3]     = 0.2;
      colors[i * 3 + 1] = 0.4;
      colors[i * 3 + 2] = 1.0;
      sizes[i] = Math.random() * 1.8 + 0.4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
      depthWrite: false,
    });

    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    /* ── Scan-line mesh (horizontal light sweep) ── */
    const scanGeo = new THREE.PlaneGeometry(300, 0.08);
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8, transparent: true, opacity: 0.0, depthWrite: false,
    });
    const scanLine = new THREE.Mesh(scanGeo, scanMat);
    scanLine.position.set(0, 60, 0);
    scene.add(scanLine);

    /* ── Shared scroll state ── */
    const state = { progress: 0, colorR: 0.23, colorG: 0.51, colorB: 1.0 };

    /* ── GSAP ScrollTrigger on the landing scroll container ── */
    const totalSections = 6;

    // Main scroll progress tracker
    ScrollTrigger.create({
      scroller: scrollEl,
      trigger: scrollEl,
      start: 'top top',
      end: () => `+=${(totalSections - 1) * window.innerHeight}`,
      scrub: 1.2,
      onUpdate: (self) => {
        state.progress = self.progress;

        // which section are we in (0-5)
        const sIdx = Math.min(Math.floor(self.progress * totalSections), totalSections - 1);
        const hex  = SECTION_COLORS[sIdx];
        const r    = parseInt(hex.slice(1, 3), 16) / 255;
        const g    = parseInt(hex.slice(3, 5), 16) / 255;
        const b    = parseInt(hex.slice(5, 7), 16) / 255;

        // smoothly lerp particle colours toward section accent
        for (let i = 0; i < COUNT; i++) {
          colors[i * 3]     += (r * (0.4 + Math.random() * 0.6) - colors[i * 3])     * 0.04;
          colors[i * 3 + 1] += (g * (0.4 + Math.random() * 0.6) - colors[i * 3 + 1]) * 0.04;
          colors[i * 3 + 2] += (b * (0.4 + Math.random() * 0.6) - colors[i * 3 + 2]) * 0.04;
        }
        geo.attributes.color.needsUpdate = true;

        // rotate particle cloud with scroll
        particles.rotation.y = self.progress * Math.PI * 1.5;
        particles.rotation.x = self.progress * Math.PI * 0.4;

        // camera drift
        camera.position.x = Math.sin(self.progress * Math.PI * 2) * 6;
        camera.position.y = self.progress * -8;
      },
    });

    // Scan-line sweep — fires once per section transition
    SECTION_COLORS.forEach((_, i) => {
      const startPct = i / totalSections;
      ScrollTrigger.create({
        scroller: scrollEl,
        trigger: scrollEl,
        start: () => `+=${startPct * (totalSections - 1) * window.innerHeight}`,
        end:   () => `+=${(startPct + 0.02) * (totalSections - 1) * window.innerHeight}`,
        onEnter: () => {
          // sweep scan line from top to bottom
          gsap.fromTo(scanLine.position, { y: 55 }, {
            y: -55, duration: 1.1, ease: 'power2.inOut',
            onUpdate: () => { scanMat.opacity = 0.55; },
            onComplete: () => { scanMat.opacity = 0; },
          });
          // flash particle opacity
          gsap.fromTo(mat, { opacity: 0.3 }, { opacity: 0.85, duration: 0.4, yoyo: true, repeat: 1 });
        },
      });
    });

    /* ── Resize ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    /* ── Render loop ── */
    let raf;
    const clock = new THREE.Clock();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      // gentle idle drift
      particles.rotation.y += 0.0003;
      particles.position.y  = Math.sin(t * 0.15) * 1.2;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      ScrollTrigger.getAll().forEach(st => st.kill());
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      scanGeo.dispose();
      scanMat.dispose();
    };
  }, [scrollEl]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100vw', height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
