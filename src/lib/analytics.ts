// Google Analytics 4 with Consent Mode v2. The layout sets consent defaults before gtag.js loads; Google applies the
// regional default by the visitor's IP, so EEA/UK/Swiss visitors are not tracked with cookies until they say yes.
export const GA_ID = 'G-XPRPV7VPW5';

// EU 27 + EEA (Iceland, Liechtenstein, Norway) + UK + Switzerland: where analytics cookies need consent first.
export const CONSENT_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH',
];

// A static page can't see the visitor's IP, so the banner goes by their clock. Someone in Europe on another time zone
// gets no banner and stays on Google's denied default: untracked, never tracked without asking.
const EUROPEAN_ATLANTIC = ['Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores', 'Atlantic/Reykjavik', 'Atlantic/Faroe'];
export const showsConsentBanner = (timeZone?: string) =>
  !!timeZone && (timeZone.startsWith('Europe/') || EUROPEAN_ATLANTIC.includes(timeZone));

export const CONSENT_KEY = 'gb.consent';

type Gtag = (...args: unknown[]) => void;
export const track = (name: string, params: Record<string, string> = {}) =>
  (globalThis as { gtag?: Gtag }).gtag?.('event', name, params);
