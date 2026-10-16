'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { isWebGLSupported } from '@/lib/utils/webgl-detect';
import CssHologramFallback, { PersonaMode } from '@/components/landing/CssHologramFallback';
import { cn } from '@/lib/utils/cn';

export interface Hero3DCanvasProps {
  mode?: PersonaMode;
  className?: string;
}

const EMBER_COUNT = 550;
const DISINTEGRATION_PARTICLES = 360;

export default function Hero3DCanvas({
  mode = 'spicy',
  className,
}: Hero3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Store mutable scene references for cleanup & mode updates
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    animationId: number | null;
    laserMesh: THREE.Mesh | null;
    edgeLine: THREE.LineSegments | null;
    emberPoints: THREE.Points | null;
    disintegrationPoints: THREE.Points | null;
    materials: THREE.Material[];
    geometries: THREE.BufferGeometry[];
  }>({
    renderer: null,
    animationId: null,
    laserMesh: null,
    edgeLine: null,
    emberPoints: null,
    disintegrationPoints: null,
    materials: [],
    geometries: [],
  });

  // Check WebGL support on mount
  useEffect(() => {
    const supported = isWebGLSupported();
    setWebglSupported(supported);
  }, []);

  // Initialize Three.js scene when WebGL is confirmed
  useEffect(() => {
    if (!webglSupported || !containerRef.current) return;

    const container = containerRef.current;
    let width = container.clientWidth || 440;
    let height = container.clientHeight || 600;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.8);

    // 2. WebGL Renderer with graceful error handling
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
      container.appendChild(renderer.domElement);
      sceneRef.current.renderer = renderer;
    } catch {
      setWebglSupported(false);
      return;
    }

    const trackedMaterials: THREE.Material[] = [];
    const trackedGeometries: THREE.BufferGeometry[] = [];

    // Helper to register disposable objects
    const trackMaterial = <T extends THREE.Material>(mat: T): T => {
      trackedMaterials.push(mat);
      return mat;
    };
    const trackGeometry = <T extends THREE.BufferGeometry>(geo: T): T => {
      trackedGeometries.push(geo);
      return geo;
    };

    // Color definitions based on mode
    const getThemeColors = (m: PersonaMode) => {
      switch (m) {
        case 'expert':
          return {
            primary: 0x06b6d4, // Cyan
            laser: 0x22d3ee,
            accent: 0x3b82f6,
            ember: 0x38bdf8,
          };
        case 'stress':
          return {
            primary: 0x8b5cf6, // Violet
            laser: 0xa78bfa,
            accent: 0xf59e0b,
            ember: 0xc084fc,
          };
        case 'spicy':
        default:
          return {
            primary: 0xf97316, // Orange
            laser: 0xfb923c,
            accent: 0xef4444,
            ember: 0xf97316,
          };
      }
    };

    const initialColors = getThemeColors(modeRef.current);

    // 3. Hologram CV Sheet Group
    const cvGroup = new THREE.Group();
    scene.add(cvGroup);

    // Sheet card background
    const sheetGeo = trackGeometry(new THREE.PlaneGeometry(2.4, 3.4));
    const sheetMat = trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x0a0f1d,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
      })
    );
    const sheetMesh = new THREE.Mesh(sheetGeo, sheetMat);
    cvGroup.add(sheetMesh);

    // Sci-fi Glowing Edges
    const edgeGeo = trackGeometry(new THREE.EdgesGeometry(sheetGeo));
    const edgeMat = trackMaterial(
      new THREE.LineBasicMaterial({
        color: initialColors.primary,
        transparent: true,
        opacity: 0.8,
      })
    );
    const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
    cvGroup.add(edgeLine);
    sceneRef.current.edgeLine = edgeLine;

    // Laser Scanline Mesh
    const laserGeo = trackGeometry(new THREE.PlaneGeometry(2.48, 0.05));
    const laserMat = trackMaterial(
      new THREE.MeshBasicMaterial({
        color: initialColors.laser,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );
    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
    laserMesh.position.z = 0.04;
    cvGroup.add(laserMesh);
    sceneRef.current.laserMesh = laserMesh;

    // Decorative CV Wireframe Elements inside sheet
    const headerGeo = trackGeometry(new THREE.PlaneGeometry(2.0, 0.35));
    const headerMat = trackMaterial(
      new THREE.MeshBasicMaterial({
        color: 0x1f2937,
        transparent: true,
        opacity: 0.7,
      })
    );
    const headerMesh = new THREE.Mesh(headerGeo, headerMat);
    headerMesh.position.set(0, 1.25, 0.02);
    cvGroup.add(headerMesh);

    // Section lines
    for (let i = 0; i < 4; i++) {
      const lineGeo = trackGeometry(new THREE.PlaneGeometry(1.8 - i * 0.2, 0.04));
      const lineMat = trackMaterial(
        new THREE.MeshBasicMaterial({
          color: 0x374151,
          transparent: true,
          opacity: 0.6,
        })
      );
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.set(-0.1 + (i % 2) * 0.1, 0.7 - i * 0.22, 0.02);
      cvGroup.add(lineMesh);
    }

    // 4. Disintegration -> ATS Emerald Transformation Particles
    const disGeo = trackGeometry(new THREE.BufferGeometry());
    const disPositions = new Float32Array(DISINTEGRATION_PARTICLES * 3);
    const disColors = new Float32Array(DISINTEGRATION_PARTICLES * 3);
    const initialDisPositions = new Float32Array(DISINTEGRATION_PARTICLES * 3);
    const targetAtsPositions = new Float32Array(DISINTEGRATION_PARTICLES * 3);

    for (let i = 0; i < DISINTEGRATION_PARTICLES; i++) {
      const idx = i * 3;
      // Cliché chaotic dispersed cloud
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 0.7;
      initialDisPositions[idx] = Math.cos(angle) * radius;
      initialDisPositions[idx + 1] = -0.3 + Math.sin(angle) * 0.4;
      initialDisPositions[idx + 2] = 0.05 + (Math.random() - 0.5) * 0.3;

      // ATS structured emerald bars target
      const barRow = Math.floor(i / 120);
      const barCol = (i % 120) / 120;
      targetAtsPositions[idx] = -0.85 + barCol * 1.7;
      targetAtsPositions[idx + 1] = -0.6 - barRow * 0.22;
      targetAtsPositions[idx + 2] = 0.05;

      // Start positions
      disPositions[idx] = initialDisPositions[idx];
      disPositions[idx + 1] = initialDisPositions[idx + 1];
      disPositions[idx + 2] = initialDisPositions[idx + 2];

      // Rose / Orange initial colors
      disColors[idx] = 0.95;
      disColors[idx + 1] = 0.3;
      disColors[idx + 2] = 0.4;
    }

    disGeo.setAttribute('position', new THREE.BufferAttribute(disPositions, 3));
    disGeo.setAttribute('color', new THREE.BufferAttribute(disColors, 3));

    const disMat = trackMaterial(
      new THREE.PointsMaterial({
        size: 0.045,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })
    );
    const disintegrationPoints = new THREE.Points(disGeo, disMat);
    cvGroup.add(disintegrationPoints);
    sceneRef.current.disintegrationPoints = disintegrationPoints;

    // 5. 500+ Floating Ember Particles
    const emberGeo = trackGeometry(new THREE.BufferGeometry());
    const emberPositions = new Float32Array(EMBER_COUNT * 3);
    const emberVelocities = new Float32Array(EMBER_COUNT * 3);

    for (let i = 0; i < EMBER_COUNT; i++) {
      const idx = i * 3;
      emberPositions[idx] = (Math.random() - 0.5) * 6.5;
      emberPositions[idx + 1] = (Math.random() - 0.5) * 6.0;
      emberPositions[idx + 2] = (Math.random() - 0.5) * 3.5;

      emberVelocities[idx] = (Math.random() - 0.5) * 0.004;
      emberVelocities[idx + 1] = 0.006 + Math.random() * 0.012; // upward drift
      emberVelocities[idx + 2] = (Math.random() - 0.5) * 0.003;
    }

    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));

    const emberMat = trackMaterial(
      new THREE.PointsMaterial({
        color: initialColors.ember,
        size: 0.035,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      })
    );
    const emberPoints = new THREE.Points(emberGeo, emberMat);
    scene.add(emberPoints);
    sceneRef.current.emberPoints = emberPoints;

    // 6. Interactive Mouse Parallax & Fast-Scroll Stretch Listeners
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX = x;
      mouseY = y;
      targetRotationY = mouseX * 0.45;
      targetRotationX = mouseY * -0.4;
    };

    let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
    let scrollVelocity = 0;

    const handleScroll = () => {
      if (typeof window === 'undefined') return;
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - lastScrollY);
      scrollVelocity = Math.min(delta * 0.05, 3.5);
      lastScrollY = currentScrollY;
    };

    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || 440;
      height = container.clientHeight || 600;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // 7. Animation Loop
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    const animate = () => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsedTime = (now - startTime) * 0.001;

      // Mouse Parallax Smooth Interpolation
      cvGroup.rotation.y += (targetRotationY - cvGroup.rotation.y) * 0.06;
      cvGroup.rotation.x += (targetRotationX - cvGroup.rotation.x) * 0.06;

      // Laser Scanline Movement (Top to Bottom and repeat)
      const scanPeriod = (Math.sin(elapsedTime * 1.8) + 1) / 2; // 0 to 1
      const laserY = 1.6 - scanPeriod * 3.2;
      laserMesh.position.y = laserY;

      // Disintegration vs ATS Reassembly Particle Interpolation
      const transformCycle = (Math.sin(elapsedTime * 1.5) + 1) / 2; // 0 (cliché) to 1 (ATS emerald)
      const positionsAttr = disGeo.attributes.position as THREE.BufferAttribute;
      const colorsAttr = disGeo.attributes.color as THREE.BufferAttribute;

      for (let i = 0; i < DISINTEGRATION_PARTICLES; i++) {
        const idx = i * 3;
        // Interpolate position
        positionsAttr.array[idx] =
          initialDisPositions[idx] * (1 - transformCycle) +
          targetAtsPositions[idx] * transformCycle;
        positionsAttr.array[idx + 1] =
          initialDisPositions[idx + 1] * (1 - transformCycle) +
          targetAtsPositions[idx + 1] * transformCycle;
        positionsAttr.array[idx + 2] =
          initialDisPositions[idx + 2] * (1 - transformCycle) +
          targetAtsPositions[idx + 2] * transformCycle;

        // Color transition: Rose -> Emerald (#10b981)
        colorsAttr.array[idx] = 0.95 * (1 - transformCycle) + 0.06 * transformCycle;
        colorsAttr.array[idx + 1] = 0.25 * (1 - transformCycle) + 0.72 * transformCycle;
        colorsAttr.array[idx + 2] = 0.35 * (1 - transformCycle) + 0.50 * transformCycle;
      }
      positionsAttr.needsUpdate = true;
      colorsAttr.needsUpdate = true;

      // Floating Ember Particles Update & Velocity-based Stretch
      scrollVelocity *= 0.92; // Damping
      const stretchFactor = 1.0 + scrollVelocity * 1.2;
      emberPoints.scale.y = stretchFactor;

      const emberPosAttr = emberGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < EMBER_COUNT; i++) {
        const idx = i * 3;
        emberPosAttr.array[idx] += emberVelocities[idx];
        emberPosAttr.array[idx + 1] += emberVelocities[idx + 1] * (1 + scrollVelocity);
        emberPosAttr.array[idx + 2] += emberVelocities[idx + 2];

        // Wrap around vertically
        if (emberPosAttr.array[idx + 1] > 3.0) {
          emberPosAttr.array[idx + 1] = -3.0;
        }
      }
      emberPosAttr.needsUpdate = true;

      renderer.render(scene, camera);
      sceneRef.current.animationId = requestAnimationFrame(animate);
    };

    sceneRef.current.animationId = requestAnimationFrame(animate);
    sceneRef.current.materials = trackedMaterials;
    sceneRef.current.geometries = trackedGeometries;

    const currentScene = sceneRef.current;

    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      if (currentScene.animationId !== null) {
        cancelAnimationFrame(currentScene.animationId);
      }

      // Dispose materials & geometries
      trackedMaterials.forEach((m) => m.dispose());
      trackedGeometries.forEach((g) => g.dispose());

      if (currentScene.renderer) {
        currentScene.renderer.dispose();
        if (container.contains(currentScene.renderer.domElement)) {
          container.removeChild(currentScene.renderer.domElement);
        }
      }
    };
  }, [webglSupported]);

  // Update Three.js materials when mode changes
  useEffect(() => {
    if (!webglSupported) return;

    let primary = 0xf97316;
    let laser = 0xfb923c;
    let ember = 0xf97316;

    if (mode === 'expert') {
      primary = 0x06b6d4;
      laser = 0x22d3ee;
      ember = 0x38bdf8;
    } else if (mode === 'stress') {
      primary = 0x8b5cf6;
      laser = 0xa78bfa;
      ember = 0xc084fc;
    }

    if (sceneRef.current.edgeLine) {
      (sceneRef.current.edgeLine.material as THREE.LineBasicMaterial).color.setHex(primary);
    }
    if (sceneRef.current.laserMesh) {
      (sceneRef.current.laserMesh.material as THREE.MeshBasicMaterial).color.setHex(laser);
    }
    if (sceneRef.current.emberPoints) {
      (sceneRef.current.emberPoints.material as THREE.PointsMaterial).color.setHex(ember);
    }
  }, [mode, webglSupported]);

  // If WebGL is not supported, render high-fidelity CSS 3D fallback
  if (webglSupported === false) {
    return <CssHologramFallback mode={mode} className={className} />;
  }

  return (
    <div
      ref={containerRef}
      data-testid="hero-3d-canvas"
      className={cn(
        'relative w-full max-w-[440px] aspect-[1/1.38] mx-auto select-none overflow-hidden rounded-2xl flex items-center justify-center',
        className
      )}
    >
      {/* While checking WebGL, render fallback as instant preview */}
      {webglSupported === null && <CssHologramFallback mode={mode} />}
    </div>
  );
}
