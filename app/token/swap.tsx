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
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';

const { width } = Dimensions.get('window');

// Common tokens mapped for 0G Mainnet
const A0GI = { symbol: 'A0GI', name: '0G Native', address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', decimals: 18 };
const USDC = { symbol: 'USDC', name: 'USD Coin', address: '0x627d32C41D35284050b168925501867160965383', decimals: 6 }; 

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

  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      reset();
      setIsQuotingLocal(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsQuotingLocal(true);
      await getQuote({
        chainId: 16661, 
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
    <View style={[styles.container, { backgroundColor: '#050505' }]}>
      <LinearGradient
        colors={['rgba(177, 87, 251, 0.1)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Swap (0G Mainnet)</Text>
            <TouchableOpacity style={styles.settingsBtn}>
              <Ionicons name="options-outline" size={22} color="#A0A0A0" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Input Card */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
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
                  autoFocus
                />
                <TouchableOpacity style={styles.tokenSelector}>
                  <View style={[styles.tokenIcon, { backgroundColor: `${theme.primary}44` }]}>
                    <Text style={styles.tokenIconText}>{tokenIn.symbol[0]}</Text>
                  </View>
                  <Text style={styles.tokenSymbol}>{tokenIn.symbol}</Text>
                  <Ionicons name="chevron-down" size={16} color="#A0A0A0" />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Switch Button */}
            <View style={styles.switchWrapper}>
              <TouchableOpacity style={styles.switchBtn} onPress={switchTokens}>
                <Ionicons name="swap-vertical" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {/* Output Card */}
            <Animated.View entering={FadeInDown.delay(200)} style={[styles.card, { marginTop: -20 }]}>
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
                  <View style={[styles.tokenIcon, { backgroundColor: '#34C75944' }]}>
                    <Text style={styles.tokenIconText}>{tokenOut.symbol[0]}</Text>
                  </View>
                  <Text style={styles.tokenSymbol}>{tokenOut.symbol}</Text>
                  <Ionicons name="chevron-down" size={16} color="#A0A0A0" />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Quote Details */}
            {quote && !isQuotingLocal && (
              <Animated.View entering={FadeIn.duration(400)} style={styles.detailsCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Exchange Rate</Text>
                  <Text style={styles.detailValue}>1 {tokenIn.symbol} ≈ {(parseFloat(outputAmount)/parseFloat(inputAmount)).toFixed(4)} {tokenOut.symbol}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Estimated Gas</Text>
                  <Text style={styles.detailValue}>{quote.gasCostUSD}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Price Impact</Text>
                  <Text style={[styles.detailValue, { color: '#34C759' }]}>&lt; 0.01%</Text>
                </View>
              </Animated.View>
            )}

            {swapError && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={20} color="#FF3B30" />
                <Text style={styles.errorText}>{swapError}</Text>
              </View>
            )}
          </ScrollView>

          {/* Action Button */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
             <Button
                onPress={handleSwap}
                loading={isProcessing}
                disabled={!quote || isProcessing}
                variant="primary"
                size="large"
                style={{ width: '100%' }}
             >
               {STEP_LABELS[step] || 'Swap'}
             </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15 
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 18, color: '#fff' },
  settingsBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  card: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 32, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.06)' 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  cardLabel: { fontFamily: 'Manrope-Bold', fontSize: 14, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  balanceText: { fontFamily: 'Inter-Medium', fontSize: 13, color: 'rgba(255,255,255,0.3)' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  mainInput: { fontFamily: 'Manrope-ExtraBold', fontSize: 36, color: '#fff', flex: 1 },
  outputValueContainer: { flex: 1, justifyContent: 'center' },
  tokenSelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.06)', 
    borderRadius: 20, 
    padding: 8, 
    paddingRight: 14, 
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  tokenIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  tokenIconText: { color: '#fff', fontSize: 14, fontFamily: 'Manrope-ExtraBold' },
  tokenSymbol: { fontFamily: 'Manrope-ExtraBold', fontSize: 16, color: '#fff' },
  switchWrapper: { alignItems: 'center', zIndex: 10 },
  switchBtn: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    backgroundColor: '#121212', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 4, 
    borderColor: '#050505',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10
  },
  detailsCard: { 
    marginTop: 24, 
    padding: 20, 
    backgroundColor: 'rgba(255,255,255,0.02)', 
    borderRadius: 24, 
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)'
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontFamily: 'Inter-Regular', fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  detailValue: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#fff' },
  errorCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    marginTop: 20, 
    padding: 16, 
    backgroundColor: 'rgba(255, 59, 48, 0.1)', 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)'
  },
  errorText: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#FF3B30', flex: 1 },
  footer: { paddingHorizontal: 20, paddingTop: 10 },
});

