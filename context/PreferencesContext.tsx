import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '@/constants/Config';
import { useAccount as useAppKitAccount } from '@reown/appkit-react-native';

interface Preferences {
  defaultChain: number;
  slippage: number;
  favoriteTokens: string[];
}

interface PreferencesContextType {
  preferences: Preferences;
  isLoading: boolean;
  updatePreferences: (newPrefs: Partial<Preferences>) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAppKitAccount();
  const [preferences, setPreferences] = useState<Preferences>({
    defaultChain: 8453,
    slippage: 0.5,
    favoriteTokens: ["ETH", "USDC"]
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/preferences?walletAddress=${address}`);
      const data = await response.json();
      if (data.success) {
        setPreferences(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch preferences:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPrefs: Partial<Preferences>) => {
    if (!address) return;
    try {
      const response = await fetch(`${API_URL}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, ...newPrefs })
      });
      const data = await response.json();
      if (data.success) {
        setPreferences(prev => ({ ...prev, ...newPrefs }));
      }
    } catch (e) {
      console.error("Failed to update preferences:", e);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [address]);

  return (
    <PreferencesContext.Provider value={{ preferences, isLoading, updatePreferences, refreshPreferences: fetchPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
