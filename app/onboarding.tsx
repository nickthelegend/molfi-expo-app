import React from 'react';
import { View, Text } from 'react-native';
import { Onboarding } from '@/components/ui/Onboarding';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRouter } from 'expo-router';

export const MolfiOnboardingSteps = [
  {
    id: 'welcome',
    title: 'Molfi',
    description: 'A more profitable way to trade for Degens. AI-native crypto ecosystem on Solana.',
    icon: <Text style={{ fontSize: 100 }}>🧬</Text>,
  },
  {
    id: 'wallet',
    title: 'Agentic Wallet',
    description: 'A fully autonomous, on-chain agent that researches markets and executes trades for you.',
    icon: <Text style={{ fontSize: 100 }}>🤖</Text>,
  },
  {
    id: 'research',
    title: 'Research AI',
    description: 'Deep, instant market insights. No more manual chart scanning or scrolling through X.',
    icon: <Text style={{ fontSize: 100 }}>🔍</Text>,
  },
  {
    id: 'agents',
    title: 'Deploy Agents',
    description: 'Scale your edge by deploying intelligent agents straight from your mobile wallet.',
    icon: <Text style={{ fontSize: 100 }}>🚀</Text>,
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding, skipOnboarding } = useOnboarding();
  const router = useRouter();

  const handleComplete = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const handleSkip = async () => {
    await skipOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <Onboarding
      steps={MolfiOnboardingSteps}
      onComplete={handleComplete}
      onSkip={handleSkip}
      primaryButtonText="Start Trading"
    />
  );
}

