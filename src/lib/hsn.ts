export function isValidHsn(code: string): boolean {
  return /^\d{4,8}$/.test(code);
}
