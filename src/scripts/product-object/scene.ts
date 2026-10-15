import * as THREE from 'three';
import { grainSpec, scatterPile, type GrainKind } from './grains';

/** `present` is decided at build time (file exists in public/), so missing models cause no request at all. */
type Model = { kind: 'grains'; grain: GrainKind } | { kind: 'glb'; src: string; fallbackGrain: GrainKind; present?: boolean };

function geometryFor(shape: ReturnType<typeof grainSpec>['shape']) {
  switch (shape) {
    case 'capsule': return new THREE.CapsuleGeometry(0.5, 1.4, 4, 8);
    case 'box': return new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
    case 'sphere': return new THREE.IcosahedronGeometry(0.5, 2);
    default: return new THREE.SphereGeometry(0.5, 10, 8);
  }
}

function buildPile(kind: GrainKind) {
  const spec = grainSpec(kind);
  const geo = geometryFor(spec.shape);
  const mat = new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.75, metalness: 0 });
  const mesh = new THREE.InstancedMesh(geo, mat, spec.count);
  const pile = scatterPile(spec.count, 11);
  const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const s = new THREE.Vector3(); const e = new THREE.Euler();
  const pos = new THREE.Vector3();
  const color = new THREE.Color();
  for (let i = 0; i < spec.count; i++) {
    const j = 1 + (Math.sin(i * 12.9898) * 0.5) * spec.jitter * 4;
    s.set(spec.scale[0] * j, spec.scale[1] * j, spec.scale[2] * j);
    e.set((i % 7) * 0.4, pile[i * 4 + 3], (i % 5) * 0.3);
    q.setFromEuler(e);
    pos.set(pile[i * 4], pile[i * 4 + 1], pile[i * 4 + 2]);
    m.compose(pos, q, s);
    mesh.setMatrixAt(i, m);
    color.set(spec.color).offsetHSL(0, 0, (Math.sin(i * 78.233) * 0.5) * spec.jitter);
    mesh.setColorAt(i, color);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

async function loadGlb(src: string): Promise<THREE.Object3D> {
  const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/libs/meshopt_decoder.module.js'),
  ]);
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(src);
  const obj = gltf.scene;
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3()).length();
  obj.scale.setScalar(3 / size);
  box.setFromObject(obj);
  obj.position.sub(box.getCenter(new THREE.Vector3()));
  return obj;
}

export async function mountProductObject(canvas: HTMLCanvasElement, model: Model, opts: { autoRotate: boolean }): Promise<() => void> {
  // Build the object first so a failure never leaks a WebGL context.
  let object: THREE.Object3D;
  if (model.kind === 'glb') {
    object = model.present
      ? await loadGlb(model.src).catch(() => buildPile(model.fallbackGrain))
      : buildPile(model.fallbackGrain);
  } else {
    object = buildPile(model.grain);
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 2.6, 5.2);
  camera.lookAt(0, 0.4, 0);
  scene.add(new THREE.HemisphereLight('#FFF6E5', '#3B2A1A', 1.4));
  const sun = new THREE.DirectionalLight('#FFE9C2', 2.2);
  sun.position.set(3, 5, 2);
  scene.add(sun);
  const group = new THREE.Group();
  group.add(object);
  scene.add(group);

  const resize = () => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // one slow turn on entry, then drag to rotate
  let target = opts.autoRotate ? Math.PI * 2 : 0;
  let rot = 0; let dragging = false; let lastX = 0;
  const down = (e: PointerEvent) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent) => { if (!dragging) return; target += (e.clientX - lastX) * 0.01; lastX = e.clientX; };
  const up = () => { dragging = false; };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(canvas);

  let raf = 0;
  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    rot += (target - rot) * 0.04;
    group.rotation.y = rot;
    renderer.render(scene, camera);
  };
  frame();

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('pointercancel', up);
    renderer.dispose();
  };
}
