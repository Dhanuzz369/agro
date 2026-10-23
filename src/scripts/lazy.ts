export function prefersReducedMotion(win: Window = window): boolean {
  return win.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function onIdle(cb: () => void): void {
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  ric ? ric(cb, { timeout: 2000 }) : setTimeout(cb, 200);
}
