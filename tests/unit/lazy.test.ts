import { describe, it, expect } from 'vitest';
import { canRun3D } from '../../src/scripts/lazy';

describe('canRun3D', () => {
  const ok = { reducedMotion: false, webgl: true, deviceMemory: 8, saveData: false };
  it('runs on capable devices', () => expect(canRun3D(ok)).toBe(true));
  it('runs when deviceMemory is unknown', () => expect(canRun3D({ ...ok, deviceMemory: undefined })).toBe(true));
  it('skips with reduced motion', () => expect(canRun3D({ ...ok, reducedMotion: true })).toBe(false));
  it('skips without WebGL', () => expect(canRun3D({ ...ok, webgl: false })).toBe(false));
  it('skips on low memory', () => expect(canRun3D({ ...ok, deviceMemory: 2 })).toBe(false));
  it('skips with Save-Data', () => expect(canRun3D({ ...ok, saveData: true })).toBe(false));
});
