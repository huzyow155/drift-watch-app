import { describe, it, expect } from 'vitest';
import { validateAndHashRedlines, validateWatchUrl, validateWatchName } from '../lib/redlines';

describe('Redlines Validation and Hash', () => {
  it('computes exact hash for fixture redlines', () => {
    const fixtureRedlines = [
      "Must not allow sharing of identifiable or non-anonymized user data with third parties.",
      "Must not keep deleted user data for more than 90 days.",
      "Must keep the right of users to export or delete their data.",
      "Must not permit selling personal data."
    ];

    const res = validateAndHashRedlines(fixtureRedlines);
    expect(res.valid).toBe(true);
    // Hash registered on chain for watch 1 on active deployment:
    expect(res.hash).toBe("116eb689297f537839b93a86396ed22e6a65a104c05c01d352cc720eeea85439");
  });

  it('rejects non-ASCII or invalid redline count', () => {
    expect(validateAndHashRedlines([]).valid).toBe(false);
    expect(validateAndHashRedlines(['a', 'b', 'c', 'd', 'e', 'f']).valid).toBe(false);
    expect(validateAndHashRedlines(['tiny']).valid).toBe(false);
    expect(validateAndHashRedlines(['Valid length line with Unicode \u00E9']).valid).toBe(false);
  });

  it('validates URL strictness matching contract', () => {
    expect(validateWatchUrl('https://example.com/terms').valid).toBe(true);
    expect(validateWatchUrl('http://example.com/terms').valid).toBe(false);
    expect(validateWatchUrl('https://user:pass@example.com').valid).toBe(false);
    expect(validateWatchUrl('https://example.com#section').valid).toBe(false);
    expect(validateWatchUrl('https://example.com:8080/').valid).toBe(false);
    expect(validateWatchUrl('https://127.0.0.1/terms').valid).toBe(false);
    expect(validateWatchUrl('https://localhost/terms').valid).toBe(false);
  });

  it('validates watch name constraints', () => {
    expect(validateWatchName('Acme Notes').valid).toBe(true);
    expect(validateWatchName('Hi').valid).toBe(false);
    expect(validateWatchName('Non-ASCII \u00F1ame').valid).toBe(false);
  });
});
