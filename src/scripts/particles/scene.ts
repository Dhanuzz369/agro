import * as THREE from 'three';
import { sampleImage } from './sample';

const COUNT = 40000;

async function loadPixels(url: string, size = 220) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await img.decode();
  const c = document.createElement('canvas');
  const ratio = img.width / img.height;
  c.width = ratio >= 1 ? size : Math.round(size * ratio);
  c.height = ratio >= 1 ? Math.round(size / ratio) : size;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  // photos have no alpha: dissolve the edges so each shape becomes an organic cloud
  const r = Math.hypot(c.width, c.height) / 2;
  const g = ctx.createRadialGradient(c.width / 2, c.height / 2, r * 0.55, c.width / 2, c.height / 2, r);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.globalCompositeOperation = 'source-over';
  return ctx.getImageData(0, 0, c.width, c.height);
}

const vertex = /* glsl */ `
  attribute vec3 aFrom; attribute vec3 aTo; attribute vec3 cFrom; attribute vec3 cTo;
  uniform float uMix; uniform float uTime; uniform vec2 uPointer; uniform float uSize;
  varying vec3 vColor;
  void main() {
    float m = smoothstep(0.0, 1.0, uMix);
    vec3 p = mix(aFrom, aTo, m);
    float wobble = sin(uTime * 0.6 + p.x * 2.0 + p.y * 1.3) * 0.04;
    p.z += wobble;
    p.xy += uPointer * (0.12 + p.z * 0.4);
    vColor = mix(cFrom, cTo, m);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.2, d));
  }`;

export async function mountHero(canvas: HTMLCanvasElement, imageUrls: string[]): Promise<() => void> {
  // load shapes first so a failed image load never leaks a WebGL context
  const shapes = [];
  for (const [i, url] of imageUrls.entries()) shapes.push(sampleImage(await loadPixels(url), COUNT, { seed: i + 1, spread: 6.5 }));
  if (!shapes.length) throw new Error('no hero images');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.z = 9;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(shapes[0].positions.slice(), 3));
  geo.setAttribute('aFrom', new THREE.BufferAttribute(shapes[0].positions.slice(), 3));
  geo.setAttribute('aTo', new THREE.BufferAttribute(shapes[Math.min(1, shapes.length - 1)].positions.slice(), 3));
  geo.setAttribute('cFrom', new THREE.BufferAttribute(shapes[0].colors.slice(), 3));
  geo.setAttribute('cTo', new THREE.BufferAttribute(shapes[Math.min(1, shapes.length - 1)].colors.slice(), 3));

  const uniforms = { uMix: { value: 0 }, uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() }, uSize: { value: 28 * renderer.getPixelRatio() } };
  const mat = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const dir = getComputedStyle(canvas).direction === 'rtl' ? -1 : 1;
    points.position.x = w > 860 ? 1.8 * dir : 0;
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const target = new THREE.Vector2();
  const onPointer = (e: PointerEvent) => target.set((e.clientX / innerWidth - 0.5) * 0.6, -(e.clientY / innerHeight - 0.5) * 0.6);
  addEventListener('pointermove', onPointer, { passive: true });

  // scroll progress through the hero section drives which pair of shapes is shown
  const section = canvas.closest('section')!;
  let stage = 0;
  function setStage(next: number) {
    if (next === stage || (next >= shapes.length - 1 && stage === shapes.length - 2)) return;
    const from = shapes[Math.max(0, Math.min(next, shapes.length - 2))];
    const to = shapes[Math.max(1, Math.min(next + 1, shapes.length - 1))];
    (geo.getAttribute('aFrom') as THREE.BufferAttribute).set(from.positions); geo.getAttribute('aFrom').needsUpdate = true;
    (geo.getAttribute('aTo') as THREE.BufferAttribute).set(to.positions); geo.getAttribute('aTo').needsUpdate = true;
    (geo.getAttribute('cFrom') as THREE.BufferAttribute).set(from.colors); geo.getAttribute('cFrom').needsUpdate = true;
    (geo.getAttribute('cTo') as THREE.BufferAttribute).set(to.colors); geo.getAttribute('cTo').needsUpdate = true;
    stage = next;
  }

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(section);

  const clock = new THREE.Clock();
  let raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const rect = section.getBoundingClientRect();
    const progress = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 0.999) * (shapes.length - 1);
    setStage(Math.floor(progress));
    uniforms.uMix.value = progress - Math.floor(progress);
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uPointer.value.lerp(target, 0.05);
    renderer.render(scene, camera);
  }
  frame();

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
    removeEventListener('pointermove', onPointer);
    geo.dispose(); mat.dispose(); renderer.dispose();
  };
}
