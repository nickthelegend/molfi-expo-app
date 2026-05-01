import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAccount, useBalance } from 'wagmi';
import { Address } from 'viem';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSwap } from '@/hooks/useSwap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Common tokens mapped for 0G Mainnet
const A0GI = { symbol: 'A0GI', name: '0G Native', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18 };
const USDC = { symbol: 'USDC', name: 'USD Coin', address: '0x627d32C41D35284050b168925501867160965383', decimals: 6 }; // Placeholder 0G USDC

const STEP_LABELS: Record<string, string> = {
  idle: 'Swap',
  quoting: 'Fetching route...',
  checking_allowance: 'Checking allowance...',
  approving: 'Approve in wallet',
  waiting_approval: 'Confirming approval...',
  signing_swap: 'Sign swap in wallet',
  waiting_confirmation: 'Broadcasting...',
  done: 'Swap Complete ✓',
  error: 'Swap Failed',
};

export default function SwapScreen() {
  const { tokenId } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { address } = useAccount();
  const { getQuote, executeSwap, step, quote, error: swapError, reset } = useSwap();

  const [inputAmount, setInputAmount] = useState('');
  const [tokenIn, setTokenIn] = useState(A0GI);
  const [tokenOut, setTokenOut] = useState(USDC);
  const [isQuotingLocal, setIsQuotingLocal] = useState(false);

  const { data: balanceIn } = useBalance({ 
    address, 
    token: tokenIn.address === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? undefined : tokenIn.address as Address,
    chainId: 16661 // 0G Mainnet
  });

  // Debounced quote fetch
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      reset();
      setIsQuotingLocal(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsQuotingLocal(true);
      await getQuote({
        chainId: 16661, // Defaulting to 0G Mainnet for this generic screen
        tokenIn: tokenIn.address as `0x${string}`,
        tokenOut: tokenOut.address as `0x${string}`,
        tokenInDecimals: tokenIn.decimals,
        tokenOutDecimals: tokenOut.decimals,
        amountIn: inputAmount,
      });
      setIsQuotingLocal(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [inputAmount, tokenIn, tokenOut, getQuote]);

  const handleSwap = async () => {
    if (!quote || step === 'done') return;
    const hash = await executeSwap({
      chainId: 16661,
      tokenIn: tokenIn.address as `0x${string}`,
      tokenOut: tokenOut.address as `0x${string}`,
      tokenInDecimals: tokenIn.decimals,
      tokenOutDecimals: tokenOut.decimals,
      amountIn: inputAmount,
    });
    
    if (hash) {
      setTimeout(() => router.back(), 2000);
    }
  };

  const switchTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    if (quote?.amountOutFormatted) {
      setInputAmount(parseFloat(quote.amountOutFormatted).toFixed(4));
    }
  };

  const isProcessing = step !== 'idle' && step !== 'error' && step !== 'done';
  const outputAmount = quote?.amountOutFormatted ? parseFloat(quote.amountOutFormatted).toFixed(6) : '';

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Swap (0G Mainnet)</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color="#A0A0A0" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Input Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Sell</Text>
              <Text style={styles.balanceText}>Balance: {balanceIn?.formatted.slice(0, 8) || '0.00'}</Text>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.mainInput}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.1)"
                keyboardType="decimal-pad"
                value={inputAmount}
                onChangeText={setInputAmount}
              />
              <TouchableOpacity style={styles.tokenSelector}>
                <View style={[styles.tokenIcon, { backgroundColor: `${theme.primary}22` }]}>
                  <Text style={styles.tokenIconText}>{tokenIn.symbol[0]}</Text>
                </View>
                <Text style={styles.tokenSymbol}>{tokenIn.symbol}</Text>
                <Ionicons name="chevron-down" size={16} color="#A0A0A0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Switch Button */}
          <View style={styles.switchWrapper}>
            <TouchableOpacity style={[styles.switchBtn, { backgroundColor: '#1d1d1d' }]} onPress={switchTokens}>
              <Ionicons name="arrow-down" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {/* Output Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Buy</Text>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.outputValueContainer}>
                {isQuotingLocal || step === 'quoting' ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Text style={[styles.mainInput, !outputAmount && { color: 'rgba(255,255,255,0.1)' }]}>
                    {outputAmount || '0'}
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.tokenSelector}>
                <View style={[styles.tokenIcon, { backgroundColor: `${theme.primary}22` }]}>
                  <Text style={styles.tokenIconText}>{tokenOut.symbol[0]}</Text>
                </View>
                <Text style={styles.tokenSymbol}>{tokenOut.symbol}</Text>
                <Ionicons name="chevron-down" size={16} color="#A0A0A0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quote Details */}
          {quote && !isQuotingLocal && (
            <Animated.View entering={FadeIn} style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rate</Text>
                <Text style={styles.detailValue}>1 {tokenIn.symbol} = {(parseFloat(outputAmount)/parseFloat(inputAmount)).toFixed(4)} {tokenOut.symbol}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Network Fee</Text>
                <Text style={styles.detailValue}>{quote.gasCostUSD}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pool Fee Tier</Text>
                <Text style={styles.detailValue}>{(quote.fee / 10000).toFixed(2)}%</Text>
              </View>
            </Animated.View>
          )}

          {swapError && (
            <View style={styles.errorCard}>
              <Ionicons name="warning-outline" size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{swapError}</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.swapBtn, { backgroundColor: theme.primary }, (!quote || isProcessing) && { opacity: 0.5 }]}
            onPress={handleSwap}
            disabled={!quote || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.swapBtnText}>{STEP_LABELS[step] || 'Swap'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 16, color: '#fff', opacity: 0.8 },
  settingsBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  content: { padding: 20 },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  cardLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  balanceText: { fontFamily: 'Inter-Medium', fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mainInput: { fontFamily: 'Manrope-Bold', fontSize: 32, color: '#fff', flex: 1 },
  outputValueContainer: { flex: 1, height: 40, justifyContent: 'center' },
  tokenSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 8, paddingRight: 12, gap: 8 },
  tokenIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#b157fb', justifyContent: 'center', alignItems: 'center' },
  tokenIconText: { color: '#fff', fontSize: 12, fontFamily: 'Manrope-ExtraBold' },
  tokenSymbol: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },
  switchButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a1a1a', alignSelf: 'center', marginTop: -22, marginBottom: -10, zIndex: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#0a0a0a' },
  detailsContainer: { paddingHorizontal: 12, gap: 12, marginTop: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  detailValue: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#fff' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, paddingHorizontal: 4 },
  errorText: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#FF3B30', flex: 1 },
  swapButton: { height: 64, borderRadius: 32, backgroundColor: '#b157fb', justifyContent: 'center', alignItems: 'center', marginTop: 32, shadowColor: '#b157fb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  swapBtnText: { fontFamily: 'Manrope-ExtraBold', fontSize: 16, color: '#fff', letterSpacing: 1 },
});

