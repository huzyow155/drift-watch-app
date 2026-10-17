import React, { useEffect, useState } from 'react';
import { ExternalLink, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { DEPLOYMENTS } from '../config/deployments';

export const EvidencePage: React.FC = () => {
  const [evidence, setEvidence] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/evidence.json')
      .then(res => res.json())
      .then(data => {
        setEvidence(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load evidence.json:', err);
        setLoading(false);
      });
  }, []);

  if (loading || !evidence) {
    return <div style={{ textAlign: 'center', padding: '60px' }}>Loading on-chain evidence matrix...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800 }}>On-Chain Verification Evidence</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Exact verification receipts, pre-registered fixture outcomes, and measured robustness data.
        </p>
      </div>

      {/* Contract Commit & Deployments */}
      <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
        <div><strong>Contract Repo Commit:</strong> <code>{evidence.contractRepoHead}</code></div>
        <div><strong>Active DriftWatch:</strong> <code>{evidence.activeWatch}</code></div>
        <div><strong>Active DriftGuard:</strong> <code>{evidence.activeGuard}</code></div>
      </div>

      {/* Expected vs Actual Fixtures Table */}
      <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Pre-Registered Fixture Matrix (8 / 8 Matches)</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Exact comparisons from <code>docs/EXPECTED_VS_ACTUAL.md</code> on active deployment.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-dim)' }}>
                <th style={{ padding: '8px' }}>Fixture</th>
                <th style={{ padding: '8px' }}>Pre-Registered</th>
                <th style={{ padding: '8px' }}>Mechanism</th>
                <th style={{ padding: '8px' }}>Actual Verdict</th>
                <th style={{ padding: '8px' }}>Transaction</th>
                <th style={{ padding: '8px' }}>Match?</th>
              </tr>
            </thead>
            <tbody>
              {evidence.fixtures.map((f: any, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px', fontWeight: 600 }}><code>{f.fixture}</code></td>
                  <td style={{ padding: '8px' }}><span className={`stamp stamp-${f.expectedVerdict}`}>{f.expectedVerdict}</span></td>
                  <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{f.mechanism}</td>
                  <td style={{ padding: '8px' }}><span className={`stamp stamp-${f.actualVerdict}`}>{f.actualVerdict}</span></td>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>
                    <a
                      href={`${DEPLOYMENTS.explorerBase}/${f.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent-gold)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                    >
                      {f.txHash.slice(0, 10)}... <ExternalLink size={10} />
                    </a>
                  </td>
                  <td style={{ padding: '8px' }}>
                    {f.match ? (
                      <span style={{ color: 'var(--verdict-unchanged)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={14} /> YES
                      </span>
                    ) : (
                      <span style={{ color: 'var(--verdict-material)', fontWeight: 700 }}>NO</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Robustness Evidence */}
      {evidence.robustness && (
        <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
            Statistical Robustness (35 On-Chain Runs): {evidence.robustness.overallSuccessRatePct}% Parse Success
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            {evidence.robustness.finding}
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '8px' }}>Fixture</th>
                  <th style={{ padding: '8px' }}>File</th>
                  <th style={{ padding: '8px' }}>Runs</th>
                  <th style={{ padding: '8px' }}>Success</th>
                  <th style={{ padding: '8px' }}>Rate %</th>
                  <th style={{ padding: '8px' }}>Avg Time</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(evidence.robustness.byFixture).map(([k, v]: [string, any]) => (
                  <tr key={k} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px', fontWeight: 700 }}>{k.toUpperCase()}</td>
                    <td style={{ padding: '8px' }}><code>{v.name}</code></td>
                    <td style={{ padding: '8px' }}>{v.runs}</td>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{v.success} / {v.runs}</td>
                    <td style={{ padding: '8px', fontWeight: 700, color: v.pct === '100.0' ? 'var(--verdict-unchanged)' : 'inherit' }}>
                      {v.pct}%
                    </td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{v.avgElapsed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Superseded Deployments */}
      <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Superseded Deployments Archive</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Prior deployments preserved for audit trails.
        </p>

        {evidence.superseded.map((sup: any, idx: number) => (
          <div key={idx} style={{ padding: '12px', background: 'var(--bg-inset)', borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div><strong>Superseded Watch:</strong> {sup.driftWatch}</div>
            <div><strong>Superseded Guard:</strong> {sup.driftGuard}</div>
            <div><strong>Deploy Tx:</strong> {sup.deployTxHash}</div>
            <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginTop: '4px' }}>
              <strong>Reason:</strong> {sup.reason}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
