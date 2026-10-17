import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { fetchWatch, fetchListChecks, WatchRecord, CheckRecord } from '../services/watchRead';
import { executeWatchWrite } from '../services/watchWrite';
import { createClient, chains } from 'genlayer-js';
import { RefreshCw, Play, CheckCircle2, Globe, Clock, ShieldAlert } from 'lucide-react';

export const WatchDetailPage: React.FC<{ watchId: string; navigate: (path: string) => void }> = ({ watchId, navigate }) => {
  const { address, isConnected, connect } = useWallet();

  const [watch, setWatch] = useState<WatchRecord | null>(null);
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Write action states
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [actionElapsed, setActionElapsed] = useState(0);
  const [actionStage, setActionStage] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Update source modal/input state
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');

  const loadWatchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, c] = await Promise.all([fetchWatch(watchId), fetchListChecks(watchId, 20)]);
      setWatch(w);
      setChecks(c);
      if (w.url) setNewUrl(w.url);
    } catch (err: any) {
      setError(err?.message || 'Failed to load watch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchData();
  }, [watchId]);

  const isOwner = isConnected && address && watch && address.toLowerCase() === watch.owner.toLowerCase();

  const executeAction = async (fnName: string, args: any[]) => {
    if (!isConnected) {
      await connect();
      return;
    }

    setRunningAction(fnName);
    setActionError(null);
    setActionElapsed(0);
    setActionStage('Submitting transaction...');

    try {
      const eth = (window as any).ethereum;
      const client = createClient({
        chain: chains.studionet,
        provider: eth,
      });

      const res = await executeWatchWrite(client, fnName, args, (s, st) => {
        setActionElapsed(s);
        setActionStage(st);
      });

      if (res.success) {
        setShowUpdateModal(false);
        await loadWatchData();
      } else {
        setActionError(res.error?.message || 'Transaction failed');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Action error');
    } finally {
      setRunningAction(null);
    }
  };

  if (loading && !watch) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading watch details...</div>;
  }

  if (error || !watch) {
    return (
      <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--verdict-material)', marginBottom: '8px' }}>Watch Lookup Failed</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{error || 'Watch not found.'}</p>
        <button onClick={() => navigate('/app')} style={{ fontSize: '13px', color: 'var(--accent-gold)' }}>Return to Watches</button>
      </div>
    );
  }

  const latest = checks.length > 0 ? checks[0] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800 }}>{watch.name}</h1>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: watch.status === 'ACTIVE' ? 'var(--verdict-unchanged-bg)' : 'var(--accent-gold-soft)',
                color: watch.status === 'ACTIVE' ? 'var(--verdict-unchanged)' : 'var(--accent-gold)',
                fontWeight: 700,
              }}
            >
              {watch.status}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>#{watch.id}</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Monitored: <code style={{ wordBreak: 'break-all' }}>{watch.url}</code>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={loadWatchData}
            disabled={Boolean(runningAction)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-strong)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>

          {watch.status === 'NEEDS_BASELINE' && (
            <button
              onClick={() => executeAction('set_baseline', [watch.id])}
              disabled={Boolean(runningAction)}
              style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--verdict-unchanged)', color: '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle2 size={16} /> Set Baseline
            </button>
          )}

          {watch.status === 'ACTIVE' && (
            <button
              onClick={() => executeAction('check', [watch.id])}
              disabled={Boolean(runningAction)}
              style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--ink-primary)', color: '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Play size={15} /> Run Check (On Demand)
            </button>
          )}

          {isOwner && (
            <button
              onClick={() => setShowUpdateModal(true)}
              disabled={Boolean(runningAction)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-strong)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Globe size={14} /> Update URL
            </button>
          )}
        </div>
      </div>

      {/* Progress / Status banner during action */}
      {runningAction && (
        <div style={{ padding: '14px 18px', borderRadius: '6px', background: 'var(--accent-gold-soft)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={18} className="spin" color="var(--accent-gold)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Executing {runningAction}... ({actionElapsed}s)</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{actionStage}</div>
          </div>
        </div>
      )}

      {actionError && (
        <div style={{ padding: '12px 16px', borderRadius: '6px', background: 'var(--verdict-material-bg)', color: 'var(--verdict-material)', fontSize: '13px' }}>
          <strong>Action Failed:</strong> {actionError}
        </div>
      )}

      {/* Update Source Modal */}
      {showUpdateModal && (
        <div style={{ padding: '16px', background: 'var(--bg-inset)', borderRadius: '8px', border: '1px solid var(--border-strong)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Update Source URL (Same Host: {watch.host})</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-strong)', background: 'var(--bg-card)' }}
            />
            <button
              onClick={() => executeAction('update_source', [watch.id, newUrl])}
              style={{ padding: '8px 16px', background: 'var(--ink-primary)', color: '#fff', borderRadius: '4px', fontWeight: 600, fontSize: '13px' }}
            >
              Save URL
            </button>
            <button
              onClick={() => setShowUpdateModal(false)}
              style={{ padding: '8px 12px', border: '1px solid var(--border-strong)', borderRadius: '4px', fontSize: '13px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Watch Meta & Red Lines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Baseline Info */}
        <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '10px' }}>
            Baseline Security Parameters
          </h3>
          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)' }}>
            <div><strong>Sequence:</strong> {watch.baseline_seq}</div>
            <div><strong>Check Anchor:</strong> #{watch.baseline_check_id || 'none'}</div>
            <div><strong>Owner:</strong> {watch.owner}</div>
            <div style={{ wordBreak: 'break-all' }}>
              <strong>Norm Hash:</strong> {watch.baseline_norm_hash || 'none'}
            </div>
          </div>
        </div>

        {/* Red Lines */}
        <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: '10px' }}>
            Active Red Lines ({watch.red_lines?.length || 0})
          </h3>
          <ul style={{ paddingLeft: '18px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {watch.red_lines?.map((rl, idx) => (
              <li key={idx}><strong>#{idx + 1}:</strong> {rl}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Salami View: Baseline vs Previous Step */}
      {checks.length >= 2 && (
        <div style={{ padding: '18px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>
            Salami-Slicing Defense: Baseline vs Previous Step
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Demonstrates why step-by-step diffs evade detection while DriftWatch anchors against the immutable baseline.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '6px' }}>Check</th>
                  <th style={{ padding: '6px' }}>Verdict</th>
                  <th style={{ padding: '6px' }}>Gate</th>
                  <th style={{ padding: '6px' }}>Tripwire</th>
                  <th style={{ padding: '6px' }}>Changes vs Baseline</th>
                  <th style={{ padding: '6px' }}>Cumulative Defense</th>
                </tr>
              </thead>
              <tbody>
                {checks.slice(0, 5).map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)' }}>#{c.id}</td>
                    <td style={{ padding: '8px 6px' }}><span className={`stamp stamp-${c.verdict}`}>{c.verdict}</span></td>
                    <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)' }}>{c.gate || 'LLM judged'}</td>
                    <td style={{ padding: '8px 6px' }}>{c.tripwire === 'true' ? 'TRIGGERED' : 'CLEAR'}</td>
                    <td style={{ padding: '8px 6px' }}>{c.changes?.length || 0} change(s)</td>
                    <td style={{ padding: '8px 6px', color: 'var(--text-muted)' }}>
                      Evaluated against baseline seq {watch.baseline_seq}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Checks History */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
          Recorded Checks ({checks.length})
        </h2>

        {checks.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No checks recorded yet for this watch.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {checks.map(check => (
              <div
                key={check.id}
                style={{
                  padding: '18px',
                  background: 'var(--bg-card)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                }}
              >
                {/* Check Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700 }}>Check #{check.id}</span>
                    <span className={`stamp stamp-${check.verdict}`}>{check.verdict}</span>
                    {check.gate && (
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '2px 6px', background: 'var(--bg-inset)', borderRadius: '3px' }}>
                        Gate: {check.gate}
                      </span>
                    )}
                    {check.tripwire === 'true' && (
                      <span style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--verdict-material-bg)', color: 'var(--verdict-material)', fontWeight: 700, borderRadius: '3px' }}>
                        TRIPWIRE TRIGGERED
                      </span>
                    )}
                  </div>

                  {/* Owner Accept Change Button */}
                  {isOwner && check.verdict !== 'UNCHANGED' && check.snapshot_dropped === 'false' && (
                    <button
                      onClick={() => executeAction('accept_change', [watch.id, check.id])}
                      disabled={Boolean(runningAction)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: 'var(--accent-gold-soft)',
                        color: 'var(--accent-gold)',
                        border: '1px solid var(--border-strong)',
                        borderRadius: '4px',
                      }}
                    >
                      Accept Change as New Baseline
                    </button>
                  )}
                </div>

                {/* Unparseable model answer explanation */}
                {check.verdict === 'REVIEW' && check.change_labels?.length === 0 && (
                  <div style={{ padding: '8px 12px', borderRadius: '4px', background: 'var(--verdict-review-bg)', color: 'var(--verdict-review)', fontSize: '12px', marginBottom: '10px' }}>
                    <ShieldAlert size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
                    The model answer could not be read; REVIEW is the safe default.
                  </div>
                )}

                {/* Changes Redline Diff */}
                {check.changes && check.changes.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Detected Differences ({check.changes.length}):
                    </div>
                    {check.changes.map((ch, cIdx) => (
                      <div
                        key={cIdx}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '4px',
                          background: 'var(--bg-inset)',
                          fontSize: '13px',
                          fontFamily: 'var(--font-mono)',
                          borderLeft: '3px solid var(--border-strong)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: 'var(--text-dim)' }}>
                          <span>Change #{cIdx + 1} ({ch.kind})</span>
                          <span>Label: <strong>{check.change_labels?.[cIdx] || 'REVIEW'}</strong></span>
                        </div>
                        {ch.old && (
                          <div style={{ marginBottom: '4px' }}>
                            <span className="redline-del">{ch.old}</span>
                          </div>
                        )}
                        {ch.new && (
                          <div>
                            <span className="redline-ins">{ch.new}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
