import { useState, useEffect } from 'react';
import { storage } from '@/utils/StorageUtil';

const ONBOARDING_KEY = '@molfi_onboarding_completed';

// Shared state outside the hook
let globalHasCompletedOnboarding: boolean | null = null;
let listeners: Array<(val: boolean | null) => void> = [];

const notifyListeners = (val: boolean | null) => {
  listeners.forEach(l => l(val));
};

// Initialize shared state
storage.getItem(ONBOARDING_KEY).then(completed => {
  globalHasCompletedOnboarding = !!completed;
  notifyListeners(globalHasCompletedOnboarding);
});

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(globalHasCompletedOnboarding);

  useEffect(() => {
    const listener = (val: boolean | null) => setHasCompletedOnboarding(val);
    listeners.push(listener);
    
    // Check again in case it changed between initialization and mounting
    if (hasCompletedOnboarding !== globalHasCompletedOnboarding) {
      setHasCompletedOnboarding(globalHasCompletedOnboarding);
    }

    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const completeOnboarding = async () => {
    await storage.setItem(ONBOARDING_KEY, true);
    globalHasCompletedOnboarding = true;
    notifyListeners(true);
  };

  const skipOnboarding = async () => {
    await storage.setItem(ONBOARDING_KEY, true);
    globalHasCompletedOnboarding = true;
    notifyListeners(true);
  };

  const resetOnboarding = async () => {
    await storage.removeItem(ONBOARDING_KEY);
    globalHasCompletedOnboarding = false;
    notifyListeners(false);
  };

  return {
    hasCompletedOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    isLoading: hasCompletedOnboarding === null,
  };
}

