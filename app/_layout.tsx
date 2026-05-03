import '../polyfills';
import { ToastProvider } from '@/components/ui/Toast';
import {
  AppKit,
  AppKitProvider,
  createAppKit,
} from "@reown/appkit-react-native";
import { WagmiAdapter } from "@reown/appkit-wagmi-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { arbitrum, mainnet, polygon, base, zeroGMainnet, zeroGTestnet, zeroGGalileoTestnet } from "@wagmi/core/chains";
import { WagmiProvider, useAccount } from "wagmi";

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import * as Reanimated from 'react-native-reanimated';
if (!(Reanimated as any).useWorkletCallback) {
  (Reanimated as any).useWorkletCallback = (cb: any) => cb;
}
if (!(Reanimated as any).useAnimatedGestureHandler) {
  (Reanimated as any).useAnimatedGestureHandler = () => ({});
}
import * as Clipboard from 'expo-clipboard';
import { Syne_400Regular, Syne_600SemiBold, Syne_700Bold } from '@expo-google-fonts/syne';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';
import { 
  Manrope_400Regular, 
  Manrope_500Medium, 
  Manrope_600SemiBold, 
  Manrope_700Bold, 
  Manrope_800ExtraBold 
} from '@expo-google-fonts/manrope';
import { 
  Inter_400Regular, 
  Inter_500Medium, 
  Inter_600SemiBold, 
  Inter_700Bold 
} from '@expo-google-fonts/inter';

import { useColorScheme } from '@/hooks/useColorScheme';
import { storage } from "@/utils/StorageUtil";
import { View } from 'react-native';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

const clipboardClient = {
  setString: async (value: string) => {
    Clipboard.setStringAsync(value);
  },
};

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId at https://dashboard.reown.com
const projectId = "22260d6680223859f9b07dadfafce02d";

// 2. Create config
const metadata = {
  name: "Molfi",
  description: "AI-Native Crypto Trading Ecosystem",
  url: "https://molfi.app",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
  redirect: {
    native: "molfi://",
    universal: "molfi.app",
  },
};

const networks = [mainnet, arbitrum, base, polygon, zeroGMainnet, zeroGGalileoTestnet];

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

// 3. Create modal
const appkit = createAppKit({
  projectId,
  networks,
  adapters: [wagmiAdapter],
  metadata,
  clipboardClient,
  storage,
  defaultNetwork: zeroGMainnet,
  enableAnalytics: true,
});

import { registerForPushNotificationsAsync } from '@/hooks/useNotifications';

function RootContent() {
  const { hasCompletedOnboarding, isLoading } = useOnboarding();
  const router = useRouter();
  const segments = useSegments();
  const { isConnected, status, address } = useAccount();

  useEffect(() => {
    if (isConnected && address) {
      registerForPushNotificationsAsync(address);
    }
  }, [isConnected, address]);

  useEffect(() => {
    // Wait for onboarding state to load
    if (isLoading) return;

    // Wait for wallet state to resolve if it's currently (re)connecting
    if (status === 'connecting' || status === 'reconnecting') return;

    const inOnboardingGroup = segments[0] === 'onboarding';
    const inConnectWallet = segments[0] === 'connect-wallet';

    if (!hasCompletedOnboarding && !inOnboardingGroup) {
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding) {
      if (!isConnected && !inConnectWallet) {
        router.replace('/connect-wallet');
      } else if (isConnected && (inConnectWallet || inOnboardingGroup)) {
        router.replace('/(tabs)');
      }
    }
  }, [hasCompletedOnboarding, isConnected, isLoading, segments, status]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="connect-wallet" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

import { PreferencesProvider } from '@/context/PreferencesContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    KHTeka: require('../assets/fonts/KHTeka-Regular.otf'),
    KHTekaMedium: require('../assets/fonts/KHTeka-Medium.otf'),
    KHTekaMono: require('../assets/fonts/KHTekaMono-Regular.otf'),
    Syne: Syne_400Regular,
    'Inter-Regular': Syne_400Regular,
    'Manrope-SemiBold': Syne_600SemiBold,
    'Manrope-ExtraBold': Syne_700Bold,
    'Inter-Medium': DMMono_400Regular,
    'Inter-Bold': DMMono_400Regular, // Use regular if medium not available
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
    'Manrope-ExtraBold': Manrope_800ExtraBold,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <AppKitProvider instance={appkit}>
              <PreferencesProvider>
                <ToastProvider>
                  <RootContent />
                </ToastProvider>
              </PreferencesProvider>
              <StatusBar style="auto" />
              {/* This is a workaround for the Android modal issue. https://github.com/expo/expo/issues/32991#issuecomment-2489620459 */}
              <View style={{ position: "absolute", height: "100%", width: "100%" }} pointerEvents="box-none">
                <AppKit />
              </View>
            </AppKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}



