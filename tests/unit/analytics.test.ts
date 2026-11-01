import { describe, it, expect } from 'vitest';
import { GA_ID, CONSENT_REGIONS, showsConsentBanner } from '../../src/lib/analytics';

describe('analytics', () => {
  it('uses the GoodBiz Agro GA4 stream', () => {
    expect(GA_ID).toBe('G-XPRPV7VPW5');
  });

  it('asks for consent in the EEA, the UK and Switzerland only', () => {
    expect(CONSENT_REGIONS).toHaveLength(32);
    for (const c of ['DE', 'FR', 'ES', 'PT', 'NL', 'NO', 'IS', 'LI', 'GB', 'CH']) expect(CONSENT_REGIONS).toContain(c);
    for (const c of ['IN', 'AE', 'US', 'RU', 'CN']) expect(CONSENT_REGIONS).not.toContain(c);
  });

  it('shows the banner to visitors on European clocks', () => {
    for (const tz of ['Europe/Berlin', 'Europe/London', 'Europe/Lisbon', 'Atlantic/Canary', 'Atlantic/Madeira', 'Atlantic/Azores', 'Atlantic/Reykjavik'])
      expect(showsConsentBanner(tz)).toBe(true);
  });

  it('does not show it elsewhere or when the time zone is unknown', () => {
    for (const tz of ['Asia/Kolkata', 'Asia/Dubai', 'America/New_York', 'Africa/Lagos', 'UTC', '', undefined])
      expect(showsConsentBanner(tz)).toBe(false);
  });
});
