import React, { useEffect, useState } from 'react';
import { fetchLimits, WatchLimits } from '../services/watchRead';
import { AlertTriangle, Code, Shield } from 'lucide-react';

export const LimitsPage: React.FC = () => {
  const [limits, setLimits] = useState<WatchLimits | null>(null);

  useEffect(() => {
    fetchLimits().then(setLimits).catch(console.error);
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Contract Architecture & Operational Limits</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          On-chain parameters and security boundaries enforced by consensus code.
        </p>
      </div>

      {/* Contract Parameters */}
      {limits && (
        <div style={{ padding: '20px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>On-Chain Constant Parameters (`get_limits`)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
            <div><strong>Max URL Length:</strong> {limits.max_url_len} chars</div>
            <div><strong>Max Page Bytes:</strong> {limits.max_page_bytes} bytes</div>
            <div><strong>Min Cleaned Text:</strong> {limits.min_text_chars} chars</div>
            <div><strong>Max Changes Judged:</strong> {limits.max_changes_judged} clauses</div>
            <div><strong>Watch Name Range:</strong> {limits.min_name_len} - {limits.max_name_len} ASCII</div>
            <div><strong>Red Lines Range:</strong> {limits.min_red_lines} - {limits.max_red_lines} lines</div>
            <div><strong>Red Line Char Range:</strong> {limits.min_red_line_chars} - {limits.max_red_line_chars} ASCII</div>
            <div><strong>Snapshot Retention:</strong> {limits.snapshot_retention_checks} checks</div>
          </div>
        </div>
      )}

      {/* Honest Limits List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} color="var(--accent-gold)" /> On-Demand Trigger
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Runs solely on transaction trigger.
          </p>
        </div>

        <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Code size={14} color="var(--accent-gold)" /> Raw HTML Only
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            SPAs needing JavaScript revert.
          </p>
        </div>

        <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={14} color="var(--accent-gold)" /> Fail-Safe REVIEW
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Diffs over 12 clauses default to REVIEW.
          </p>
        </div>
      </div>
    </div>
  );
};
