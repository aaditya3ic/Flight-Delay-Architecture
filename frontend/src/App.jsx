import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function FlightDelayEngine() {
  const canvasHostRef = useRef(null);
  const [engineActive, setEngineActive] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [formData, setFormData] = useState({ sourceAirport: 'DEL', destinationAirport: 'BOM', airline: 'IndiGo', weatherCondition: 'Rain' });
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
     const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/flights/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      setResult(data);
      setEngineActive(true);
    } catch (error) {
      alert("Backend connection failed.");
    }
  };

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    // Globe Sphere Geometry (Latitude/Longitude wireframe structure)
    const globeGeometry = new THREE.SphereGeometry(2.3, 32, 32);
    const globeMaterial = new THREE.MeshBasicMaterial({
      color: 0xa9c9d6,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // Inner core glow sphere
    const coreGeometry = new THREE.SphereGeometry(2.1, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.04,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Orbiting node particles representing flight data connection points
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.7 + Math.random() * 0.8;
      positions[i] = r * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = r * Math.cos(phi);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let raf;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      globe.rotation.y = t * 0.08;
      particles.rotation.y = t * -0.04;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      globeGeometry.dispose();
      globeMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sotg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Inter:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

        .sotg-root {
          position: relative;
          min-height: 100vh;
          width: 100%;
          background: radial-gradient(120% 90% at 50% 0%, #12141c 0%, #08090d 62%);
          color: #F3F1EB;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }
        .sotg-canvas {
          position: absolute;
          inset: 0;
          opacity: 0.95;
          pointer-events: none;
        }
        .sotg-topbar {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 28px 36px;
        }
        .sotg-logo {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.02em;
          color: #F3F1EB;
          text-decoration: none;
        }
        .sotg-audio {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: rgba(243,241,235,0.56);
          background: transparent;
          border: 1px solid rgba(255,255,255,0.14);
          padding: 8px 14px;
          border-radius: 999px;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .sotg-audio:hover, .sotg-audio:focus-visible {
          border-color: #A9C9D6;
          color: #F3F1EB;
          outline: none;
        }
        .sotg-audio-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #A9C9D6;
          opacity: 0.5;
        }
        .sotg-audio[data-on="true"] .sotg-audio-dot { opacity: 1; }

        .sotg-hero {
          position: relative;
          z-index: 2;
          min-height: calc(100vh - 84px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 36px 90px;
          max-width: 780px;
        }
        .sotg-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #A9C9D6;
          margin-bottom: 22px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sotg-eyebrow::before {
          content: '';
          width: 22px; height: 1px;
          background: #A9C9D6;
        }
        .sotg-title {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 500;
          font-size: clamp(38px, 6vw, 64px);
          line-height: 1.04;
          letter-spacing: -0.01em;
          margin: 0 0 20px;
        }
        .sotg-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          max-width: 520px;
          margin-bottom: 24px;
        }
        .sotg-input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 12px 16px;
          color: #F3F1EB;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          border-radius: 2px;
          outline: none;
          transition: border-color 0.2s;
        }
        .sotg-input:focus { border-color: #A9C9D6; }
        .sotg-share {
          align-self: flex-start;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #08090d;
          background: #F3F1EB;
          border: none;
          padding: 13px 26px;
          border-radius: 2px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .sotg-share:hover, .sotg-share:focus-visible { background: #A9C9D6; outline: none; }

        .sotg-result {
          margin-top: 20px;
          padding: 16px;
          background: rgba(169, 201, 214, 0.05);
          border: 1px solid rgba(169, 201, 214, 0.2);
          max-width: 520px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
        }

        .sotg-scrollcue {
          position: absolute;
          left: 36px;
          bottom: 34px;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.22em;
          color: rgba(243,241,235,0.5);
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          transition: opacity 0.4s ease;
        }
        .sotg-scrollcue-line {
          width: 1px;
          height: 46px;
          background: linear-gradient(to bottom, rgba(169,201,214,0.9), transparent);
        }

        .sotg-credit {
          position: absolute;
          right: 36px;
          bottom: 34px;
          z-index: 2;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: rgba(243,241,235,0.4);
          text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.18);
          padding-bottom: 2px;
        }
        .sotg-credit:hover { color: #A9C9D6; border-color: #A9C9D6; }
      `}</style>

      <div className="sotg-canvas" ref={canvasHostRef} />

      <header className="sotg-topbar">
        <a className="sotg-logo" href="#top">flight-ml // core</a>
        <button
          className="sotg-audio"
          data-on={engineActive}
          onClick={() => setEngineActive((v) => !v)}
        >
          <span className="sotg-audio-dot" />
          ENGINE {engineActive ? "ONLINE" : "STANDBY"}
        </button>
      </header>

      <main className="sotg-hero">
        <div className="sotg-eyebrow">Neural Flight Analytics</div>
        <h1 className="sotg-title">Predict flight<br />delays instantly</h1>
        
        <form onSubmit={handleSubmit} className="sotg-form">
          <input className="sotg-input" type="text" value={formData.sourceAirport} onChange={e => setFormData({...formData, sourceAirport: e.target.value})} placeholder="Source (e.g. DEL)" />
          <input className="sotg-input" type="text" value={formData.destinationAirport} onChange={e => setFormData({...formData, destinationAirport: e.target.value})} placeholder="Dest (e.g. BOM)" />
          <input className="sotg-input" type="text" value={formData.airline} onChange={e => setFormData({...formData, airline: e.target.value})} placeholder="Airline" />
          <input className="sotg-input" type="text" value={formData.weatherCondition} onChange={e => setFormData({...formData, weatherCondition: e.target.value})} placeholder="Weather" />
        </form>

        <button onClick={handleSubmit} className="sotg-share">Compute Probability</button>

        {result && (
          <div className="sotg-result">
            <p style={{ color: '#A9C9D6', marginBottom: 4 }}>STATUS: {result.status}</p>
            <p style={{ fontSize: '16px', fontWeight: 600 }}>DELAY PROBABILITY: {(result.delayProbability * 100).toFixed(1)}%</p>
          </div>
        )}
      </main>

      <div className="sotg-scrollcue" style={{ opacity: scrolled ? 0 : 1 }}>
        <span className="sotg-scrollcue-line" />
        System Operational
      </div>

      <a className="sotg-credit" href="https://github.com/aaditya3ic/Flight-Delay-Architecture" target="_blank" rel="noreferrer">
        Architecture v1.0
      </a>
    </div>
  );
}