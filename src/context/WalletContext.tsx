import React, { createContext, useContext, useState, useEffect } from 'react';
import { ensureStudionetWallet } from '../services/watchWrite';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (eth && eth.selectedAddress) {
      setAddress(eth.selectedAddress.toLowerCase());
    }
  }, []);

  const connect = async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      setError('No Web3 wallet detected. Please install MetaMask or use a compatible browser.');
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      await ensureStudionetWallet(eth);
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts[0]) {
        setAddress(accounts[0].toLowerCase());
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: Boolean(address),
        isConnecting,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
