import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { validateWatchName, validateWatchUrl, validateAndHashRedlines } from '../lib/redlines';
import { fetchComputeRedlinesHash } from '../services/watchRead';
import { executeWatchWrite } from '../services/watchWrite';
import { createClient, chains } from 'genlayer-js';
import { Plus, Trash2, Check, AlertCircle } from 'lucide-react';

export const CreateWatchPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const { isConnected, connect } = useWallet();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [redlines, setRedlines] = useState<string[]>(['']);
  const [onChainHash, setOnChainHash] = useState<string | null>(null);
  const [computingHash, setComputingHash] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [stage, setStage] = useState('');
  const [txError, setTxError] = useState<string | null>(null);

  // Quick fill Acme Notes example
  const handleQuickFill = () => {
    setName('Acme Notes Terms Watch');
    setUrl('https://raw.githubusercontent.com/huzyow155/drift-watch-fixtures/c8ff0f0cf8b5e406a44baad04867cb793c52d328/terms-v0.md');
    setRedlines([
      'Must not allow sharing of identifiable or non-anonymized user data with third parties.',
      'Must not keep deleted user data for more than 90 days.',
      'Must keep the right of users to export or delete their data.',
      'Must not permit selling personal data.',
    ]);
  };

  const handleAddRedline = () => {
    if (redlines.length < 5) {
      setRedlines([...redlines, '']);
    }
  };

  const handleRemoveRedline = (index: number) => {
    if (redlines.length > 1) {
      setRedlines(redlines.filter((_, i) => i !== index));
    }
  };

  const handleRedlineChange = (index: number, val: string) => {
    const updated = [...redlines];
    updated[index] = val;
    setRedlines(updated);
  };

  // Validations
  const nameVal = validateWatchName(name);
  const urlVal = validateWatchUrl(url);
  const filteredRedlines = redlines.filter(r => r.trim().length > 0);
  const redlinesVal = validateAndHashRedlines(filteredRedlines);

  // Compute on-chain verification hash
  const handleVerifyOnChain = async () => {
    if (!redlinesVal.valid) return;
    setComputingHash(true);
    try {
      const h = await fetchComputeRedlinesHash(redlinesVal.canonicalJson);
      setOnChainHash(h);
    } catch {
      setOnChainHash('error');
    } finally {
      setComputingHash(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      await connect();
      return;
    }
    if (!nameVal.valid || !urlVal.valid || !redlinesVal.valid) return;

    setSubmitting(true);
    setTxError(null);
    setElapsed(0);
    setStage('Submitting transaction...');

    try {
      const eth = (window as any).ethereum;
      const client = createClient({
        chain: chains.studionet,
        provider: eth,
      });

      const res = await executeWatchWrite(
        client,
        'create_watch',
        [name, url, redlinesVal.canonicalJson],
        (s, st) => {
          setElapsed(s);
          setStage(st);
        }
      );

      if (res.success) {
        navigate('/app');
      } else {
        setTxError(res.error?.message || 'Failed to create watch');
      }
    } catch (err: any) {
      setTxError(err?.message || 'Execution error');
    } finally {
      setSubmitting(false);
    }
  };

  const hashesMatch = onChainHash && onChainHash !== 'error' && onChainHash === redlinesVal.hash;

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Register New Watch</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Configure terms target URL and strict red lines.</p>
        </div>
        <button
          type="button"
          onClick={handleQuickFill}
          style={{
            fontSize: '12px',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid var(--accent-gold)',
            color: 'var(--accent-gold)',
            fontWeight: 600,
          }}
        >
          Use Acme Notes example
        </button>
      </div>

      {txError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            background: 'var(--verdict-material-bg)',
            color: 'var(--verdict-material)',
            marginBottom: '16px',
            fontSize: '13px',
          }}
        >
          {txError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Name Field */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Watch Name (3-60 ASCII)
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Acme Notes Terms Watch"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-inset)',
              color: 'inherit',
            }}
          />
          {name && !nameVal.valid && (
            <div style={{ fontSize: '11px', color: 'var(--verdict-material)', marginTop: '4px' }}>
              {nameVal.error}
            </div>
          )}
        </div>

        {/* URL Field */}
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
            Target URL (HTTPS only, max 300 chars)
          </label>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com/terms.html"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '4px',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg-inset)',
              color: 'inherit',
            }}
          />
          {url && !urlVal.valid && (
            <div style={{ fontSize: '11px', color: 'var(--verdict-material)', marginTop: '4px' }}>
              {urlVal.error}
            </div>
          )}
        </div>

        {/* Red Lines Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600 }}>
              Red Lines (1 to 5 plain English clauses)
            </label>
            {redlines.length < 5 && (
              <button
                type="button"
                onClick={handleAddRedline}
                style={{ fontSize: '12px', color: 'var(--accent-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Add Line
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {redlines.map((line, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', width: '20px' }}>#{idx + 1}</span>
                <input
                  type="text"
                  value={line}
                  onChange={e => handleRedlineChange(idx, e.target.value)}
                  placeholder="e.g. Must not permit selling personal data."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-strong)',
                    background: 'var(--bg-inset)',
                    color: 'inherit',
                  }}
                />
                {redlines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRedline(idx)}
                    style={{ padding: '6px', color: 'var(--text-dim)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Hash Verification Box */}
          {redlinesVal.valid && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '6px',
                background: 'var(--bg-inset)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <div>
                <strong>Client SHA-256:</strong> <code>{redlinesVal.hash}</code>
              </div>
              {onChainHash && (
                <div style={{ marginTop: '4px' }}>
                  <strong>On-chain SHA-256:</strong> <code>{onChainHash}</code>{' '}
                  {hashesMatch ? (
                    <span style={{ color: 'var(--verdict-unchanged)', fontWeight: 700 }}><Check size={14} /> Exact Match</span>
                  ) : (
                    <span style={{ color: 'var(--verdict-material)', fontWeight: 700 }}><AlertCircle size={14} /> Mismatch!</span>
                  )}
                </div>
              )}
              {!onChainHash && (
                <button
                  type="button"
                  onClick={handleVerifyOnChain}
                  disabled={computingHash}
                  style={{ marginTop: '6px', fontSize: '11px', color: 'var(--accent-gold)', fontWeight: 600 }}
                >
                  {computingHash ? 'Verifying on-chain...' : 'Verify on-chain hash match'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !nameVal.valid || !urlVal.valid || !redlinesVal.valid}
          style={{
            padding: '12px',
            borderRadius: '6px',
            background: 'var(--ink-primary)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            marginTop: '8px',
          }}
        >
          {submitting ? `${stage} (${elapsed}s)` : isConnected ? 'Create Watch on Chain' : 'Connect Wallet & Create'}
        </button>
      </form>
    </div>
  );
};
