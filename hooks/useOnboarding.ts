import { useState, useEffect } from 'react';
import { storage } from '@/utils/StorageUtil';

const ONBOARDING_KEY = '@molfi_onboarding_completed';

export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const completed = await storage.getItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(!!completed);
  };

  const completeOnboarding = async () => {
    await storage.setItem(ONBOARDING_KEY, true);
    setHasCompletedOnboarding(true);
  };

  const skipOnboarding = async () => {
    await storage.setItem(ONBOARDING_KEY, true);
    setHasCompletedOnboarding(true);
  };

  const resetOnboarding = async () => {
    await storage.removeItem(ONBOARDING_KEY);
    setHasCompletedOnboarding(false);
  };

  return {
    hasCompletedOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    isLoading: hasCompletedOnboarding === null,
  };
}
