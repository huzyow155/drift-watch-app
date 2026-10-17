import React, { useState, useEffect } from 'react';
import { WalletProvider } from './context/WalletContext';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { WatchesPage } from './pages/WatchesPage';
import { CreateWatchPage } from './pages/CreateWatchPage';
import { WatchDetailPage } from './pages/WatchDetailPage';
import { GuardPage } from './pages/GuardPage';
import { EvidencePage } from './pages/EvidencePage';
import { LimitsPage } from './pages/LimitsPage';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const renderContent = () => {
    if (currentPath === '/') {
      return <LandingPage navigate={navigate} />;
    }
    if (currentPath === '/app') {
      return <WatchesPage navigate={navigate} />;
    }
    if (currentPath === '/app/create') {
      return <CreateWatchPage navigate={navigate} />;
    }
    if (currentPath.startsWith('/app/watch/')) {
      const id = currentPath.split('/')[3] || '1';
      return <WatchDetailPage watchId={id} navigate={navigate} />;
    }
    if (currentPath === '/app/guard') {
      return <GuardPage />;
    }
    if (currentPath === '/app/evidence') {
      return <EvidencePage />;
    }
    if (currentPath === '/app/limits') {
      return <LimitsPage />;
    }
    return <WatchesPage navigate={navigate} />;
  };

  return (
    <WalletProvider>
      <Layout currentPath={currentPath} navigate={navigate}>
        {renderContent()}
      </Layout>
    </WalletProvider>
  );
};

export default App;
