import React from 'react';
import { ArrowRight, CheckCircle2, Shield, Eye, Lock } from 'lucide-react';

export const LandingPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 0' }}>
      {/* Hero Sentence */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'var(--accent-gold-soft)',
            color: 'var(--accent-gold)',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '16px',
            border: '1px solid var(--border-strong)',
          }}
        >
          <Shield size={14} /> Smart Terms-of-Service Drift Detection
        </div>
        <h1
          style={{
            fontSize: '36px',
            lineHeight: 1.25,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '16px',
          }}
        >
          Monitor legal agreements against plain English red lines with on-chain consensus.
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: 'var(--text-muted)',
            maxWidth: '620px',
            margin: '0 auto 28px',
          }}
        >
          DriftWatch evaluates live policy changes, filters cosmetic revisions, and alerts dApps before unauthorized terms compromise user rights.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/app')}
            style={{
              padding: '12px 24px',
              borderRadius: '6px',
              background: 'var(--ink-primary)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Open app <ArrowRight size={16} />
          </button>
          <button
            onClick={() => navigate('/app/evidence')}
            style={{
              padding: '12px 24px',
              borderRadius: '6px',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '15px',
              fontWeight: 600,
              border: '1px solid var(--border-strong)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Eye size={16} /> See the evidence
          </button>
        </div>
      </div>

      {/* 3 Honest Boundaries */}
      <div
        style={{
          borderTop: '1px solid var(--border-light)',
          paddingTop: '32px',
          marginTop: '20px',
        }}
      >
        <h2
          style={{
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-dim)',
            textAlign: 'center',
            marginBottom: '24px',
            fontWeight: 700,
          }}
        >
          System Design Boundaries
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {/* Boundary 1 */}
          <div
            style={{
              padding: '20px',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 700 }}>
              <CheckCircle2 size={18} color="var(--accent-gold)" /> On-Demand Execution
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Checks execute solely when triggered by transactions. No hidden daemons run in the background.
            </p>
          </div>

          {/* Boundary 2 */}
          <div
            style={{
              padding: '20px',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 700 }}>
              <Shield size={18} color="var(--accent-gold)" /> Code Determines Verdicts
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Validators evaluate small clause facts; deterministic code and tripwires enforce final consensus verdicts.
            </p>
          </div>

          {/* Boundary 3 */}
          <div
            style={{
              padding: '20px',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 700 }}>
              <Lock size={18} color="var(--accent-gold)" /> Anchored Baseline
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Baselines never shift automatically. Only explicit owner transactions advance baseline sequences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
