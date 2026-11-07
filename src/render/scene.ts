import * as THREE from 'three';

export const CAM_OFFSET = new THREE.Vector3(0, 14, 11);

export function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fc8ff);
  scene.fog = new THREE.Fog(0x8fc8ff, 45, 90);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 200);
  camera.position.copy(CAM_OFFSET);
  camera.lookAt(0, 0, 0);
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

export function follow(camera: THREE.PerspectiveCamera, x: number, z: number) {
  camera.position.set(x + CAM_OFFSET.x, CAM_OFFSET.y, z + CAM_OFFSET.z);
  camera.lookAt(x, 0, z);
}
