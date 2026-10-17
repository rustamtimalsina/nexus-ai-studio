import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { audioService } from '../services/audioService';

interface AI3DCoreProps {
  isGenerating: boolean;
  isTyping?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  mode?: 'orb' | 'quantum' | 'hologram';
  className?: string;
}

export const AI3DCore: React.FC<AI3DCoreProps> = ({
  isGenerating,
  isTyping,
  isListening,
  isSpeaking,
  mode = 'orb',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ isGenerating, isTyping, isListening, isSpeaking });
  stateRef.current = { isGenerating, isTyping, isListening, isSpeaking };
  const [currentLevel, setCurrentLevel] = useState(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. 3D Elements Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // A. Inner glowing nucleus sphere
    const sphereGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x06b6d4, // Cyan
      emissive: 0x0891b2,
      emissiveIntensity: 0.6,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const innerSphere = new THREE.Mesh(sphereGeo, sphereMat);
    mainGroup.add(innerSphere);

    // B. Outer Icosahedron wireframe
    const icoGeo = new THREE.IcosahedronGeometry(1.35, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Emerald green
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const outerIco = new THREE.Mesh(icoGeo, icoMat);
    mainGroup.add(outerIco);

    // C. Orbital Hologram Ring 1
    const ringGeo1 = new THREE.TorusGeometry(1.6, 0.015, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    mainGroup.add(ring1);

    // D. Orbital Hologram Ring 2
    const ringGeo2 = new THREE.TorusGeometry(1.75, 0.012, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xa855f7, // Purple
      transparent: true,
      opacity: 0.6,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    mainGroup.add(ring2);

    // E. Quantum Particle Swarm
    const particleCount = 320;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0x06b6d4);
    const c2 = new THREE.Color(0x10b981);
    const c3 = new THREE.Color(0xd946ef); // Magenta

    for (let i = 0; i < particleCount; i++) {
      const radius = 1.3 + Math.random() * 1.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      basePositions[i * 3] = x;
      basePositions[i * 3 + 1] = y;
      basePositions[i * 3 + 2] = z;

      const chosenColor = Math.random() > 0.6 ? c1 : Math.random() > 0.3 ? c2 : c3;
      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particles);

    // F. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x06b6d4, 2, 50);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x10b981, 1.8, 50);
    pointLight2.position.set(-3, -3, 2);
    scene.add(pointLight2);

    // Mouse movement interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      mouseX = x * 1.5;
      mouseY = -y * 1.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let clock = new THREE.Clock();
    let animationFrameId: number;
    let frameCounter = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const {
        isGenerating: activeGenerating,
        isTyping: activeTyping,
        isListening: activeListening,
        isSpeaking: activeSpeaking,
      } = stateRef.current;

      // Real-time audio reactive level
      let audioLevel = 0;
      if (activeListening || activeSpeaking) {
        audioLevel = audioService.getAudioLevel();
        if (audioLevel === 0) {
          // Synthetic speech pulsation if mic level is quiet
          audioLevel = Math.abs(Math.sin(elapsedTime * 8)) * 0.45;
        }
      }

      frameCounter++;
      if (frameCounter % 6 === 0) {
        setCurrentLevel(audioLevel);
      }

      const isAudioActive = activeListening || activeSpeaking;
      const speedFactor = activeGenerating
        ? 2.8
        : isAudioActive
        ? 2.2 + audioLevel * 3.0
        : activeTyping
        ? 1.6
        : 1.0;

      // Mouse follow damping
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      mainGroup.rotation.y = targetX * 0.8 + elapsedTime * 0.25 * speedFactor;
      mainGroup.rotation.x = targetY * 0.8 + Math.sin(elapsedTime * 0.5) * 0.15;

      // Audio-reactive scale pulse
      const basePulse = Math.sin(elapsedTime * (activeGenerating ? 6 : isAudioActive ? 10 : 2.5)) * 0.08 + 1.0;
      const audioScale = basePulse + audioLevel * 0.5;
      innerSphere.scale.set(audioScale, audioScale, audioScale);
      innerSphere.rotation.y += 0.015 * speedFactor;

      // Rings oscillate with audio frequency
      const ringScale1 = 1.0 + audioLevel * 0.45;
      const ringScale2 = 1.0 + audioLevel * 0.35;
      ring1.scale.set(ringScale1, ringScale1, ringScale1);
      ring2.scale.set(ringScale2, ringScale2, ringScale2);
      ring1.rotation.z += (0.02 + audioLevel * 0.08) * speedFactor;
      ring2.rotation.z -= (0.018 + audioLevel * 0.07) * speedFactor;

      // Particles scatter with audio energy
      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;
      const particleExpansion = 1.0 + audioLevel * 0.6;

      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3] = basePositions[i * 3] * particleExpansion;
        posArray[i * 3 + 1] = basePositions[i * 3 + 1] * particleExpansion;
        posArray[i * 3 + 2] = basePositions[i * 3 + 2] * particleExpansion;
      }
      posAttr.needsUpdate = true;

      particles.rotation.y += (0.006 + audioLevel * 0.04) * speedFactor;
      particles.rotation.x = Math.sin(elapsedTime * 0.3) * 0.2;

      // Reactive Color & Emission Shift
      if (activeListening) {
        // Listening to User (Electric Magenta / Neon Purple)
        sphereMat.emissive.setHex(0xd946ef);
        icoMat.color.setHex(0xf43f5e);
        pointLight1.color.setHex(0xd946ef);
        pointLight1.intensity = 3.5 + audioLevel * 4;
      } else if (activeSpeaking) {
        // AI Speaking aloud (Electric Cyan / Aqua Blue)
        sphereMat.emissive.setHex(0x06b6d4);
        icoMat.color.setHex(0x38bdf8);
        pointLight1.color.setHex(0x06b6d4);
        pointLight1.intensity = 3.0 + audioLevel * 4;
      } else if (activeGenerating) {
        // Thinking / Generating (Amber / Solar Gold)
        sphereMat.emissive.setHex(0xf59e0b);
        icoMat.color.setHex(0x38bdf8);
        pointLight1.color.setHex(0xf59e0b);
        pointLight1.intensity = 3.5;
      } else {
        // Calm Idle (Emerald / Cyan)
        sphereMat.emissive.setHex(0x0891b2);
        icoMat.color.setHex(0x10b981);
        pointLight1.color.setHex(0x06b6d4);
        pointLight1.intensity = 2;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating State & Audio Equalizer HUD */}
      <div className="absolute bottom-3 flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 text-[11px] font-mono text-cyan-300 shadow-xl shadow-black/60">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isListening
              ? 'bg-fuchsia-400 animate-ping'
              : isSpeaking
              ? 'bg-cyan-400 animate-pulse'
              : isGenerating
              ? 'bg-amber-400 animate-ping'
              : 'bg-emerald-400 animate-pulse'
          }`}
        />
        <span className="font-bold tracking-wider">
          {isListening
            ? 'LISTENING TO VOICE...'
            : isSpeaking
            ? 'SPEAKING RESPONSE...'
            : isGenerating
            ? 'NEURAL REASONING...'
            : isTyping
            ? 'TYPING INPUT...'
            : '3D VOICE CORE READY'}
        </span>

        {/* Real-time Frequency Waveform Bars */}
        {(isListening || isSpeaking) && (
          <div className="flex items-end gap-1 h-3 ml-1">
            <span
              className="w-1 bg-cyan-400 rounded-full transition-all duration-75"
              style={{ height: `${Math.max(3, currentLevel * 14)}px` }}
            />
            <span
              className="w-1 bg-fuchsia-400 rounded-full transition-all duration-75"
              style={{ height: `${Math.max(5, currentLevel * 20)}px` }}
            />
            <span
              className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
              style={{ height: `${Math.max(4, currentLevel * 16)}px` }}
            />
            <span
              className="w-1 bg-sky-400 rounded-full transition-all duration-75"
              style={{ height: `${Math.max(3, currentLevel * 12)}px` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
