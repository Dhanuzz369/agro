export function isValidHsn(code: string): boolean {
  return /^\d{4,8}$/.test(code);
}

export function formatHsn(code: string): string {
  if (code.length === 8) return `${code.slice(0, 4)} ${code.slice(4, 6)} ${code.slice(6)}`;
  if (code.length === 6) return `${code.slice(0, 4)} ${code.slice(4)}`;
  return code;
}
