export const isPlaceholder = (v: string) => v.trim().startsWith('REPLACE:');

export function whatsappHref(number: string, text?: string): string | null {
  if (isPlaceholder(number)) return null;
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function mailtoHref(email: string, subject?: string, body?: string): string | null {
  if (isPlaceholder(email)) return null;
  const q = new URLSearchParams();
  if (subject) q.set('subject', subject);
  if (body) q.set('body', body);
  const qs = q.toString().replace(/\+/g, '%20');
  return `mailto:${email}${qs ? `?${qs}` : ''}`;
}
