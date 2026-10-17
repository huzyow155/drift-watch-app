import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ERROR_MAPPINGS } from '../lib/errors';

describe('Error Codes Coverage', () => {
  it('covers every UserError string found in contracts/DriftWatch.py and DriftGuard.py', () => {
    const errorStrings = new Set<string>();
    const files = ['contracts/DriftWatch.py', 'contracts/DriftGuard.py'];

    for (const f of files) {
      const filePath = path.resolve(f);
      const content = fs.readFileSync(filePath, 'ascii');
      const pattern = /gl\.vm\.UserError\(\s*(?:f?["'])(.*?)(?:["'])\s*\)/g;
      let m;
      while ((m = pattern.exec(content)) !== null) {
        errorStrings.add(m[1]);
      }
    }

    console.log(`Verified ${errorStrings.size} unique UserError conditions in contracts:`);
    const coveredKeys = new Set(Object.keys(ERROR_MAPPINGS));

    // Also include dynamic patterns handled in parseContractError
    const dynamicPatterns = [
      'duplicate observation: already recorded in check {existing_cid}',
      'HTTP status not 200: {status_code}'
    ];
    for (const dp of dynamicPatterns) {
      coveredKeys.add(dp);
    }

    const missing: string[] = [];
    for (const err of errorStrings) {
      console.log(`  - ${err}`);
      if (!coveredKeys.has(err)) {
        missing.push(err);
      }
    }

    expect(missing).toEqual([]);
    expect(errorStrings.size).toBeGreaterThanOrEqual(25);
  });
});
