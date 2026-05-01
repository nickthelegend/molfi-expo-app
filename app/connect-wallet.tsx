import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  SafeAreaView, 
  TouchableOpacity 
} from 'react-native';
import { useAppKit } from '@reown/appkit-react-native';
import { useAccount } from 'wagmi';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';

export default function ConnectWalletScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { open } = useAppKit();
  const { isConnected, isConnecting } = useAccount();
  const router = useRouter();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const handleConnect = () => {
    open();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.logoText, { color: theme.primary }]}>MOLFI</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Animated.View 
            style={[
              styles.pulseGlow, 
              { 
                backgroundColor: theme.primary,
                transform: [{ scale: pulseAnim }],
                opacity: opacityAnim
              }
            ]} 
          />
          <Ionicons name="wallet-outline" size={80} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Connect Your Wallet</Text>
        <Text style={[styles.subtext, { color: '#A0A0A0' }]}>
          Link your EVM or Solana wallet to access your AI agents, prediction markets, and portfolio.
        </Text>

        <Button 
          onPress={handleConnect} 
          loading={isConnecting}
          style={styles.button}
          size="lg"
        >
          Connect Wallet
        </Button>

        <TouchableOpacity style={styles.secondaryLink}>
          <Text style={styles.secondaryLinkText}>Learn more about Molfi wallets →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  logoText: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 24,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  pulseGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 280,
  },
  button: {
    width: '100%',
  },
  secondaryLink: {
    marginTop: 24,
  },
  secondaryLinkText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6C6C6C',
    textDecorationLine: 'underline',
  },
});

