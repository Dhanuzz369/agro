export function prefersReducedMotion(win: Window = window): boolean {
  return win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function canRun3D(env: { reducedMotion: boolean; webgl: boolean; deviceMemory?: number; saveData?: boolean }): boolean {
  if (env.reducedMotion || !env.webgl || env.saveData) return false;
  if (env.deviceMemory !== undefined && env.deviceMemory < 4) return false;
  return true;
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function currentEnv() {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return { reducedMotion: prefersReducedMotion(), webgl: hasWebGL(), deviceMemory: nav.deviceMemory, saveData: nav.connection?.saveData };
}

export function whenNear(el: Element, cb: () => void, rootMargin = '400px'): void {
  if (!('IntersectionObserver' in window)) return cb();
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) { io.disconnect(); cb(); }
  }, { rootMargin });
  io.observe(el);
}

export function onIdle(cb: () => void): void {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  ric ? ric(cb, { timeout: 2000 }) : setTimeout(cb, 200);
}
