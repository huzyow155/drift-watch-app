import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { fetchGuardStatus, fetchIsSafeFor, fetchPin, executeGuardWrite, GuardStatus } from '../services/guard';
import { createClient, chains } from 'genlayer-js';
import { ShieldCheck, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

export const GuardPage: React.FC = () => {
  const { address, isConnected, connect } = useWallet();

  const [watchId, setWatchId] = useState('1');
  const [guardStatus, setGuardStatus] = useState<GuardStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields for is_safe_for test
  const [testPinner, setTestPinner] = useState('');
  const [testWatchId, setTestWatchId] = useState('1');
  const [testBaselineHash, setTestBaselineHash] = useState('');
  const [testRedlinesHash, setTestRedlinesHash] = useState('');
  const [isSafeForResult, setIsSafeForResult] = useState<boolean | null>(null);
  const [evaluatingSafeFor, setEvaluatingSafeFor] = useState(false);

  // Write actions
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [ackCheckId, setAckCheckId] = useState('');
  const [actionElapsed, setActionElapsed] = useState(0);
  const [actionStage, setActionStage] = useState('');

  const loadGuard = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const status = await fetchGuardStatus(address, watchId);
      setGuardStatus(status);

      const pin = await fetchPin(address, watchId);
      if (pin) {
        setTestPinner(address);
        setTestWatchId(watchId);
        setTestBaselineHash(pin.pinned_baseline_norm_hash);
        setTestRedlinesHash(pin.pinned_redlines_hash);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch DriftGuard status');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (action: 'pin' | 'acknowledge' | 'repin', args: any[]) => {
    if (!isConnected) {
      await connect();
      return;
    }

    setRunningAction(action);
    setError(null);
    setActionElapsed(0);
    setActionStage('Submitting guard transaction...');

    try {
      const eth = (window as any).ethereum;
      const client = createClient({
        chain: chains.studionet,
        provider: eth,
      });

      const res = await executeGuardWrite(client, action, args, (s, st) => {
        setActionElapsed(s);
        setActionStage(st);
      });

      if (res.success) {
        await loadGuard();
      } else {
        setError(res.error?.message || 'Guard action failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Guard execution error');
    } finally {
      setRunningAction(null);
    }
  };

  const handleTestIsSafeFor = async () => {
    setEvaluatingSafeFor(true);
    try {
      const res = await fetchIsSafeFor(testPinner, testWatchId, testBaselineHash, testRedlinesHash);
      setIsSafeForResult(res);
    } catch {
      setIsSafeForResult(false);
    } finally {
      setEvaluatingSafeFor(false);
    }
  };

  const handleAlterCharacter = () => {
    if (testBaselineHash.length > 5) {
      const lastChar = testBaselineHash.slice(-1);
      const flipped = lastChar === '0' ? '1' : '0';
      setTestBaselineHash(testBaselineHash.slice(0, -1) + flipped);
      setIsSafeForResult(null);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800 }}>DriftGuard Consumer Interface</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Synchronously binding smart contracts to approved terms hashes.
        </p>
      </div>

      {/* Query Bar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
        <label htmlFor="guard-watch-id" style={{ fontSize: '13px', fontWeight: 600 }}>Watch ID:</label>
        <input
          id="guard-watch-id"
          type="text"
          aria-label="Watch ID"
          value={watchId}
          onChange={e => setWatchId(e.target.value)}
          style={{ width: '80px', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-strong)', background: 'var(--bg-inset)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
        />
        <button
          onClick={loadGuard}
          disabled={!isConnected || loading}
          style={{ padding: '7px 14px', borderRadius: '6px', background: 'var(--ink-primary)', color: '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Read Status
        </button>
        {!isConnected && (
          <span style={{ fontSize: '12px', color: 'var(--accent-gold)' }}>Connect wallet to query your pin</span>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '6px', background: 'var(--verdict-material-bg)', color: 'var(--verdict-material)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {runningAction && (
        <div style={{ padding: '14px 18px', borderRadius: '6px', background: 'var(--accent-gold-soft)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={18} className="spin" color="var(--accent-gold)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Executing {runningAction}... ({actionElapsed}s)</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{actionStage}</div>
          </div>
        </div>
      )}

      {/* Guard Status Display */}
      {guardStatus && (
        <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700 }}>Caller Safety Evaluation (`is_safe`)</h2>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '4px',
                background: guardStatus.safe === 'true' ? 'var(--verdict-unchanged-bg)' : 'var(--verdict-material-bg)',
                color: guardStatus.safe === 'true' ? 'var(--verdict-unchanged)' : 'var(--verdict-material)',
                border: '1px solid currentColor',
              }}
            >
              SAFE: {guardStatus.safe.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
            <div><strong>Reason:</strong> <code>{guardStatus.reason}</code></div>
            <div><strong>Latest Check ID:</strong> #{guardStatus.latest_check_id || 'none'}</div>
            <div><strong>Latest Verdict:</strong> {guardStatus.latest_verdict ? <span className={`stamp stamp-${guardStatus.latest_verdict}`}>{guardStatus.latest_verdict}</span> : 'none'}</div>
          </div>

          {/* Guard Actions */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <button
              onClick={() => handleExecute('pin', [watchId])}
              disabled={Boolean(runningAction)}
              style={{ padding: '8px 14px', borderRadius: '4px', background: 'var(--ink-primary)', color: '#fff', fontSize: '13px', fontWeight: 600 }}
            >
              Pin Watch #{watchId}
            </button>

            <button
              onClick={() => handleExecute('repin', [watchId])}
              disabled={Boolean(runningAction)}
              style={{ padding: '8px 14px', borderRadius: '4px', border: '1px solid var(--border-strong)', fontSize: '13px', fontWeight: 600 }}
            >
              Repin After Baseline Advance
            </button>

            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                placeholder="Check ID"
                aria-label="Check ID to acknowledge"
                value={ackCheckId}
                onChange={e => setAckCheckId(e.target.value)}
                style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-strong)', background: 'var(--bg-inset)', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              />
              <button
                onClick={() => handleExecute('acknowledge', [watchId, ackCheckId])}
                disabled={Boolean(runningAction) || !ackCheckId}
                style={{ padding: '8px 14px', borderRadius: '4px', border: '1px solid var(--border-strong)', fontSize: '13px', fontWeight: 600 }}
              >
                Acknowledge Check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* is_safe_for Playground */}
      <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Synchronous `is_safe_for` Verification</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Simulates consumer contract checks. Returns true only if caller pin matches both expected hashes exactly.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label htmlFor="test-pinner" style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Pinner Address:</label>
            <input
              id="test-pinner"
              type="text"
              aria-label="Pinner Address"
              value={testPinner}
              onChange={e => setTestPinner(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-strong)', background: 'var(--bg-inset)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            />
          </div>

          <div>
            <label htmlFor="test-baseline-hash" style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Expected Baseline Norm Hash:</label>
            <input
              id="test-baseline-hash"
              type="text"
              aria-label="Expected Baseline Norm Hash"
              value={testBaselineHash}
              onChange={e => setTestBaselineHash(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-strong)', background: 'var(--bg-inset)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            />
          </div>

          <div>
            <label htmlFor="test-redlines-hash" style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Expected Redlines Hash:</label>
            <input
              id="test-redlines-hash"
              type="text"
              aria-label="Expected Redlines Hash"
              value={testRedlinesHash}
              onChange={e => setTestRedlinesHash(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-strong)', background: 'var(--bg-inset)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
            <button
              onClick={handleTestIsSafeFor}
              disabled={evaluatingSafeFor || !testPinner || !testBaselineHash || !testRedlinesHash}
              style={{ padding: '8px 16px', borderRadius: '4px', background: 'var(--ink-primary)', color: '#fff', fontSize: '13px', fontWeight: 600 }}
            >
              {evaluatingSafeFor ? 'Querying...' : 'Evaluate is_safe_for'}
            </button>

            <button
              onClick={handleAlterCharacter}
              style={{ padding: '8px 14px', borderRadius: '4px', border: '1px solid var(--border-strong)', fontSize: '12px', color: 'var(--verdict-material)', fontWeight: 600 }}
            >
              Change one character
            </button>

            {isSafeForResult !== null && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: isSafeForResult ? 'var(--verdict-unchanged)' : 'var(--verdict-material)',
                }}
              >
                Result: {isSafeForResult ? 'TRUE (Safe)' : 'FALSE (Rejected / Mismatched)'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
