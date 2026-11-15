import * as THREE from 'three';
import { T } from '../data/tuning';

export function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fc8ff);
  scene.fog = new THREE.Fog(0x8fc8ff, T.CAMERA.FOG_NEAR, T.CAMERA.FOG_FAR);
  const camera = new THREE.PerspectiveCamera(T.CAMERA.FOV, 1, 0.5, T.CAMERA.FAR);
  scene.add(new THREE.HemisphereLight(0xdff2ff, 0x5a7a3a, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(20, 40, 10);
  scene.add(sun);
  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  return { renderer, scene, camera, resize };
}
