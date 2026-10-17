import React, { useEffect, useState } from 'react';
import { fetchStats, fetchListWatches, WatchRecord, WatchStats } from '../services/watchRead';
import { Plus, ArrowRight, RefreshCw } from 'lucide-react';

export const WatchesPage: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [stats, setStats] = useState<WatchStats | null>(null);
  const [watches, setWatches] = useState<WatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, w] = await Promise.all([fetchStats(), fetchListWatches(20)]);
      setStats(s);
      setWatches(w);
    } catch (err: any) {
      setError(err?.message || 'Failed to load watches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div>
      {/* Title & Top Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Monitored Watches</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Registered policy watchers on GenLayer Studionet.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadData}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-strong)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button
            onClick={() => navigate('/app/create')}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              background: 'var(--ink-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <Plus size={16} /> New Watch
          </button>
        </div>
      </div>

      {/* Global Contract Stats */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
            padding: '16px',
            background: 'var(--bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--border-light)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Checks</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.stat_total_checks}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Material</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--verdict-material)' }}>
              {stats.stat_verdict_MATERIAL}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Minor</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--verdict-minor)' }}>
              {stats.stat_verdict_MINOR}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Cosmetic</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--verdict-cosmetic)' }}>
              {stats.stat_verdict_COSMETIC}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Unchanged</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--verdict-unchanged)' }}>
              {stats.stat_verdict_UNCHANGED}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Review</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--verdict-review)' }}>
              {stats.stat_verdict_REVIEW}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            background: 'var(--verdict-material-bg)',
            color: 'var(--verdict-material)',
            marginBottom: '20px',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* Watches List Cards */}
      {loading && watches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading watches from contract...</div>
      ) : watches.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: 'var(--bg-card)',
            borderRadius: '8px',
            border: '1px solid var(--border-light)',
          }}
        >
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No watches found on chain.</p>
          <button
            onClick={() => navigate('/app/create')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              background: 'var(--ink-primary)',
              color: '#fff',
              fontSize: '14px',
            }}
          >
            Create first watch
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
          {watches.map(watch => (
            <div
              key={watch.id}
              onClick={() => navigate(`/app/watch/${watch.id}`)}
              style={{
                padding: '18px 20px',
                background: 'var(--bg-card)',
                borderRadius: '8px',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '16px' }}>{watch.name}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: watch.status === 'ACTIVE' ? 'var(--verdict-unchanged-bg)' : 'var(--accent-gold-soft)',
                      color: watch.status === 'ACTIVE' ? 'var(--verdict-unchanged)' : 'var(--accent-gold)',
                      fontWeight: 600,
                    }}
                  >
                    {watch.status}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    #{watch.id}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                  <span>Host: <code>{watch.host}</code></span>
                  <span>Baseline Seq: <strong>{watch.baseline_seq}</strong></span>
                  <span>Red Lines: <strong>{watch.red_lines?.length || 0}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Inspect <ArrowRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
