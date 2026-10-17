import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { DEPLOYMENTS } from '../config/deployments';

describe('Deployments and Contract Integrity', () => {
  it('agrees with deployments.json from the contract repository', () => {
    const raw = fs.readFileSync('E:/DriftWatch_V2/scripts/deploy/deployments.json', 'utf8');
    const sourceData = JSON.parse(raw);

    expect(DEPLOYMENTS.driftWatch.address.toLowerCase()).toBe(sourceData.driftWatch.address.toLowerCase());
    expect(DEPLOYMENTS.driftGuard.address.toLowerCase()).toBe(sourceData.driftGuard.address.toLowerCase());
    expect(DEPLOYMENTS.driftWatch.sha256).toBe(sourceData.driftWatch.sha256);
    expect(DEPLOYMENTS.driftGuard.sha256).toBe(sourceData.driftGuard.sha256);
  });

  it('matches local contract files SHA-256 byte for byte against deployments.json', () => {
    const watchCode = fs.readFileSync(path.resolve('contracts/DriftWatch.py'), 'ascii');
    const guardCode = fs.readFileSync(path.resolve('contracts/DriftGuard.py'), 'ascii');

    const watchSha = createHash('sha256').update(watchCode, 'ascii').digest('hex');
    const guardSha = createHash('sha256').update(guardCode, 'ascii').digest('hex');

    expect(watchSha).toBe(DEPLOYMENTS.driftWatch.sha256);
    expect(guardSha).toBe(DEPLOYMENTS.driftGuard.sha256);
  });
});
