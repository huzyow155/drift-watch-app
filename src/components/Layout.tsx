import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { Sun, Moon, ShieldCheck, ExternalLink, Menu, X } from 'lucide-react';
import { DEPLOYMENTS } from '../config/deployments';

export const Layout: React.FC<{ children: React.ReactNode; currentPath: string; navigate: (path: string) => void }> = ({
  children,
  currentPath,
  navigate,
}) => {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const navLinks = [
    { path: '/app', label: 'Watches' },
    { path: '/app/create', label: 'New Watch' },
    { path: '/app/guard', label: 'DriftGuard' },
    { path: '/app/evidence', label: 'Evidence' },
    { path: '/app/limits', label: 'Limits' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-card)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '60px',
          }}
        >
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'var(--ink-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              DW
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Drift Watch
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'var(--accent-gold-soft)',
                    color: 'var(--accent-gold)',
                    border: '1px solid var(--border-strong)',
                  }}
                >
                  Preview
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="desktop-nav">
            {navLinks.map(link => {
              const active = currentPath === link.path || (link.path === '/app' && currentPath.startsWith('/app/watch'));
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--text-main)' : 'var(--text-muted)',
                    background: active ? 'var(--bg-inset)' : 'transparent',
                    border: active ? '1px solid var(--border-light)' : '1px solid transparent',
                  }}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={toggleTheme}
              title="Toggle dark/light theme"
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid var(--border-light)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {isConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    padding: '6px 10px',
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '4px',
                  }}
                >
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button
                  onClick={disconnect}
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-dim)',
                    padding: '6px',
                  }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '7px 14px',
                  borderRadius: '6px',
                  background: 'var(--ink-primary)',
                  color: '#fff',
                }}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ padding: '6px', display: 'none' }}
              className="mobile-menu-btn"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {menuOpen && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-light)',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {navLinks.map(link => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setMenuOpen(false);
                }}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px 0' }}>
        <div className="container">{children}</div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-light)',
          padding: '24px 0',
          background: 'var(--bg-card)',
          fontSize: '12px',
          color: 'var(--text-muted)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div>
            <strong>Drift Watch</strong> &bull; Intelligent Terms-of-Service Change Monitor on GenLayer Studionet (Chain 61999)
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a
              href={`${DEPLOYMENTS.explorerBase}/${DEPLOYMENTS.driftWatch.address}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Watch Contract <ExternalLink size={12} />
            </a>
            <a
              href={`${DEPLOYMENTS.explorerBase}/${DEPLOYMENTS.driftGuard.address}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Guard Contract <ExternalLink size={12} />
            </a>
            <a
              href="https://github.com/huzyow155/drift-watch-genlayer"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Contract Repo <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
