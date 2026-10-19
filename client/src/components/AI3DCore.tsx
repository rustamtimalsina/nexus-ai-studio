import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { audioService } from '../services/audioService';
import { VoiceState } from '../types';
import { VoiceStatusHUD } from './VoiceStatusHUD';

export type AITheme = 'quantum' | 'cyber' | 'solar';

interface AI3DCoreProps {
  isGenerating: boolean;
  isTyping?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  theme?: AITheme;
  voiceState?: VoiceState;
  onStopListening?: () => void;
  showHUD?: boolean;
  className?: string;
}

export const AI3DCore: React.FC<AI3DCoreProps> = ({
  isGenerating,
  isTyping,
  isListening,
  isSpeaking,
  theme = 'quantum',
  voiceState,
  onStopListening,
  showHUD = true,
  className = '',
}) => {
  const effectiveVoiceState: VoiceState =
    voiceState ||
    (isListening ? 'listening' : isGenerating ? 'transcribing' : isSpeaking ? 'speaking' : 'idle');

  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    isGenerating,
    isTyping,
    isListening,
    isSpeaking,
    theme,
    voiceState: effectiveVoiceState,
  });
  stateRef.current = {
    isGenerating,
    isTyping,
    isListening,
    isSpeaking,
    theme,
    voiceState: effectiveVoiceState,
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Clear previous children if any
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

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

    // Color definitions based on theme
    const themeConfig = {
      quantum: {
        sphereColor: 0x06b6d4, // Cyan
        sphereEmissive: 0x0891b2,
        icoColor: 0x10b981, // Emerald
        ring1Color: 0x38bdf8, // Sky
        ring2Color: 0xa855f7, // Purple
        light1: 0x06b6d4,
        light2: 0x10b981,
        p1: new THREE.Color(0x06b6d4),
        p2: new THREE.Color(0x10b981),
        p3: new THREE.Color(0x38bdf8),
      },
      cyber: {
        sphereColor: 0xa855f7, // Purple
        sphereEmissive: 0x7c3aed,
        icoColor: 0xec4899, // Pink
        ring1Color: 0xd946ef, // Fuchsia
        ring2Color: 0x06b6d4, // Cyan
        light1: 0xd946ef,
        light2: 0x8b5cf6,
        p1: new THREE.Color(0xa855f7),
        p2: new THREE.Color(0xec4899),
        p3: new THREE.Color(0x06b6d4),
      },
      solar: {
        sphereColor: 0xf59e0b, // Amber
        sphereEmissive: 0xd97706,
        icoColor: 0xef4444, // Red
        ring1Color: 0xfbbf24, // Gold
        ring2Color: 0xf97316, // Orange
        light1: 0xf59e0b,
        light2: 0xef4444,
        p1: new THREE.Color(0xf59e0b),
        p2: new THREE.Color(0xef4444),
        p3: new THREE.Color(0xfbbf24),
      },
    }[theme];

    // 2. 3D Elements Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // A. Inner glowing nucleus sphere
    const sphereGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: themeConfig.sphereColor,
      emissive: themeConfig.sphereEmissive,
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
      color: themeConfig.icoColor,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const outerIco = new THREE.Mesh(icoGeo, icoMat);
    mainGroup.add(outerIco);

    // C. Orbital Hologram Ring 1
    const ringGeo1 = new THREE.TorusGeometry(1.6, 0.015, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: themeConfig.ring1Color,
      transparent: true,
      opacity: 0.7,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    mainGroup.add(ring1);

    // D. Orbital Hologram Ring 2
    const ringGeo2 = new THREE.TorusGeometry(1.75, 0.012, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: themeConfig.ring2Color,
      transparent: true,
      opacity: 0.6,
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    mainGroup.add(ring2);

    // E. Quantum Particle Swarm
    const particleCount = 340;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const basePositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

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

      const chosenColor =
        Math.random() > 0.6 ? themeConfig.p1 : Math.random() > 0.3 ? themeConfig.p2 : themeConfig.p3;
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

    const pointLight1 = new THREE.PointLight(themeConfig.light1, 2, 50);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(themeConfig.light2, 1.8, 50);
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
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const {
        isGenerating: activeGenerating,
        isTyping: activeTyping,
        isListening: activeListening,
        isSpeaking: activeSpeaking,
        voiceState: currentVoiceState,
      } = stateRef.current;

      // Real-time audio reactive level
      let audioLevel = 0;
      if (activeListening || activeSpeaking) {
        audioLevel = audioService.getAudioLevel();
        if (audioLevel === 0) {
          audioLevel = (Math.sin(elapsedTime * 8) + 1) * 0.25;
        }
      }

      // Voice State dynamic emissive response
      if (currentVoiceState === 'listening') {
        sphereMat.emissive.setHex(0xe11d48); // Glowing Rose/Red when listening
        sphereMat.emissiveIntensity = 0.9;
      } else if (currentVoiceState === 'transcribing') {
        sphereMat.emissive.setHex(0xd97706); // Warm Amber when transcribing/reasoning
        sphereMat.emissiveIntensity = 0.8;
      } else if (currentVoiceState === 'speaking') {
        sphereMat.emissive.setHex(0x059669); // Emerald pulse when speaking
        sphereMat.emissiveIntensity = 0.85;
      } else {
        sphereMat.emissive.setHex(themeConfig.sphereEmissive);
        sphereMat.emissiveIntensity = 0.6;
      }

      // Parallax mouse damping
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      mainGroup.rotation.y = targetX * 0.4 + elapsedTime * 0.2;
      mainGroup.rotation.x = -targetY * 0.4;

      // State dynamic speeds
      const speedMultiplier = activeGenerating ? 2.5 : activeTyping ? 1.4 : activeListening ? 1.8 : 1.0;

      // 1. Inner Sphere Pulsing
      const sphereScale =
        1 + Math.sin(elapsedTime * 3 * speedMultiplier) * 0.08 + audioLevel * 0.35;
      innerSphere.scale.set(sphereScale, sphereScale, sphereScale);
      innerSphere.rotation.y += 0.015 * speedMultiplier;
      innerSphere.rotation.x += 0.008 * speedMultiplier;

      // 2. Outer Icosahedron Counter-Rotation
      const icoScale =
        1 + Math.cos(elapsedTime * 2 * speedMultiplier) * 0.05 + audioLevel * 0.25;
      outerIco.scale.set(icoScale, icoScale, icoScale);
      outerIco.rotation.y -= 0.01 * speedMultiplier;
      outerIco.rotation.z += 0.005 * speedMultiplier;

      // 3. Holographic Orbital Rings
      ring1.rotation.z += 0.02 * speedMultiplier;
      ring2.rotation.x += 0.015 * speedMultiplier;

      // 4. Particle Wave Motion
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const bx = basePositions[i * 3];
        const by = basePositions[i * 3 + 1];
        const bz = basePositions[i * 3 + 2];

        const wave = Math.sin(elapsedTime * 2.5 + bx * 2 + by * 2) * (0.08 + audioLevel * 0.2);
        posArr[i * 3] = bx * (1 + wave);
        posArr[i * 3 + 1] = by * (1 + wave);
        posArr[i * 3 + 2] = bz * (1 + wave);
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme]);

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      <div
        ref={mountRef}
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
      />
      {showHUD && (
        <div className="mt-2 shrink-0 z-10 pointer-events-auto">
          <VoiceStatusHUD voiceState={effectiveVoiceState} onStopListening={onStopListening} />
        </div>
      )}
    </div>
  );
};
