import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Ambient Three.js background for the hero, tuned for the LIGHT theme:
 * a slow-orbiting particle field with a wireframe icosahedron core and
 * gentle pointer parallax, reading as soft depth against a bright page.
 * Colors are pulled from the accent design tokens so they stay in sync
 * with the theme. Skipped entirely when the user prefers reduced motion.
 * Pauses when the tab is hidden and fully disposes WebGL on unmount.
 */
export default function HeroCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const styles = getComputedStyle(document.documentElement);
    const readColor = (name, fallback) => {
      const v = styles.getPropertyValue(name).trim();
      try {
        return new THREE.Color(v || fallback);
      } catch {
        return new THREE.Color(fallback);
      }
    };
    const accent = readColor('--color-accent', '#6361e0');
    const accentSoft = readColor('--color-accent-soft', '#9190f8');

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.z = 14;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Particle field
    const COUNT = 800;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 40;
      positions[i + 1] = (Math.random() - 0.5) * 24;
      positions[i + 2] = (Math.random() - 0.5) * 24;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: accentSoft,
      size: 0.05,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const points = new THREE.Points(particleGeo, particleMat);
    scene.add(points);

    // Wireframe core
    const coreGeo = new THREE.IcosahedronGeometry(4.2, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: accent,
      wireframe: true,
      transparent: true,
      opacity: 0.10,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    let raf = 0;
    let paused = false;
    const clock = new THREE.Clock();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (paused) return;
      const t = clock.getElapsedTime();
      points.rotation.y = t * 0.02;
      core.rotation.y = t * 0.08;
      core.rotation.x = Math.sin(t * 0.15) * 0.2;
      camera.position.x += (pointer.x * 1.4 - camera.position.x) * 0.03;
      camera.position.y += (-pointer.y * 0.9 - camera.position.y) * 0.03;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };
    tick();

    const onVisibility = () => {
      paused = document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      particleGeo.dispose();
      particleMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none opacity-70"
    />
  );
}
