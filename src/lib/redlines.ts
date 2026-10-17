import { sha256, stringToBytes } from 'viem';

export interface RedlineValidationResult {
  valid: boolean;
  error?: string;
  sanitized: string[];
  canonicalJson: string;
  hash: string;
}

export function validateAndHashRedlines(rawInput: string | string[]): RedlineValidationResult {
  let parsed: unknown;
  if (typeof rawInput === 'string') {
    try {
      parsed = JSON.parse(rawInput);
    } catch {
      return { valid: false, error: 'invalid red lines: invalid JSON array', sanitized: [], canonicalJson: '', hash: '' };
    }
  } else {
    parsed = rawInput;
  }

  if (!Array.isArray(parsed)) {
    return { valid: false, error: 'invalid red lines: invalid JSON array', sanitized: [], canonicalJson: '', hash: '' };
  }

  if (parsed.length < 1 || parsed.length > 5) {
    return { valid: false, error: 'invalid red lines: count must be between 1 and 5', sanitized: [], canonicalJson: '', hash: '' };
  }

  const sanitized: string[] = [];
  for (const item of parsed) {
    if (typeof item !== 'string' || item.length < 5 || item.length > 200) {
      return { valid: false, error: 'invalid red lines: each line must be 5-200 ASCII characters', sanitized: [], canonicalJson: '', hash: '' };
    }
    // Check ASCII characters only
    for (let i = 0; i < item.length; i++) {
      if (item.charCodeAt(i) > 127) {
        return { valid: false, error: 'invalid red lines: each line must be 5-200 ASCII characters', sanitized: [], canonicalJson: '', hash: '' };
      }
    }
    sanitized.push(item);
  }

  // Canonical JSON: JSON.stringify without spaces, exactly matching Python json.dumps(sanitized, separators=(",", ":"))
  const canonicalJson = JSON.stringify(sanitized);
  const hash = sha256(stringToBytes(canonicalJson)).slice(2);

  return {
    valid: true,
    sanitized,
    canonicalJson,
    hash,
  };
}

export function validateWatchUrl(url: string): { valid: boolean; error?: string; host?: string } {
  if (url.length > 300) {
    return { valid: false, error: 'invalid URL: length exceeds 300 characters' };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: 'invalid URL: scheme must be https' };
  }

  if (parsed.protocol.toLowerCase() !== 'https:') {
    return { valid: false, error: 'invalid URL: scheme must be https' };
  }

  if (parsed.username || parsed.password) {
    return { valid: false, error: 'invalid URL: userinfo not allowed' };
  }

  if (parsed.hash) {
    return { valid: false, error: 'invalid URL: fragment not allowed' };
  }

  if (parsed.port && parsed.port !== '443') {
    return { valid: false, error: 'invalid URL: port must be empty or 443' };
  }

  const hostname = parsed.hostname;
  if (!hostname || hostname.length < 3) {
    return { valid: false, error: 'invalid URL: invalid host' };
  }

  const hostLower = hostname.toLowerCase();

  // IPv4 or IPv6 literal check
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostLower) || hostLower.startsWith('[') || hostLower.includes(':')) {
    return { valid: false, error: 'invalid URL: IP literals not allowed' };
  }

  if (hostLower === 'localhost' || hostLower.endsWith('.local') || hostLower.endsWith('.internal')) {
    return { valid: false, error: 'invalid URL: invalid host' };
  }

  return { valid: true, host: hostLower };
}

export function validateWatchName(name: string): { valid: boolean; error?: string } {
  if (name.length < 3 || name.length > 60) {
    return { valid: false, error: 'invalid name: must be 3-60 ASCII characters' };
  }
  for (let i = 0; i < name.length; i++) {
    if (name.charCodeAt(i) > 127) {
      return { valid: false, error: 'invalid name: must be 3-60 ASCII characters' };
    }
  }
  return { valid: true };
}
