import React, { useState, useEffect, useMemo } from 'react';
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
import { Image } from 'expo-image';
import { useAccount, useBalance } from 'wagmi';
import { Address, formatUnits, parseUnits } from 'viem';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUniswapSwap } from '@/hooks/useUniswapSwap';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Common tokens
const ETH = { symbol: 'ETH', name: 'Ethereum', address: 'ETH', decimals: 18 };
const USDC = { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 };

export default function SwapScreen() {
  const { tokenId } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { address } = useAccount();
  const { getQuote, executeSwap, isLoading: isSwapping, error: swapError } = useUniswapSwap();

  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const [tokenIn, setTokenIn] = useState(ETH);
  const [tokenOut, setTokenOut] = useState(USDC);
  const [quote, setQuote] = useState<any>(null);
  const [isQuoting, setIsQuoting] = useState(false);

  const { data: balanceIn } = useBalance({ 
    address, 
    token: tokenIn.address === 'ETH' ? undefined : tokenIn.address as Address 
  });

  // Debounced quote fetch
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setQuote(null);
      setOutputAmount('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsQuoting(true);
      const amountRaw = parseUnits(inputAmount, tokenIn.decimals).toString();
      const res = await getQuote({
        tokenIn: tokenIn.address === 'ETH' ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : tokenIn.address,
        tokenOut: tokenOut.address === 'ETH' ? '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' : tokenOut.address,
        amount: amountRaw,
        chainId: 1, // Mainnet for now
      });
      
      if (res) {
        setQuote(res);
        const outAmt = res.routing === 'CLASSIC' 
          ? formatUnits(BigInt(res.quote.output.amount), tokenOut.decimals)
          : formatUnits(BigInt(res.quote.orderInfo.outputs[0].startAmount), tokenOut.decimals);
        setOutputAmount(parseFloat(outAmt).toFixed(6));
      }
      setIsQuoting(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputAmount, tokenIn, tokenOut]);

  const handleSwap = async () => {
    if (!quote) return;
    const hash = await executeSwap(quote);
    if (hash) {
      // Success logic
      router.back();
    }
  };

  const switchTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setInputAmount(outputAmount);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Swap</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color="#A0A0A0" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Input Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Sell</Text>
              <Text style={styles.balanceText}>Balance: {balanceIn?.formatted.slice(0, 8)}</Text>
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
                {isQuoting ? (
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
          {quote && (
            <Animated.View entering={FadeIn} style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Exchange Rate</Text>
                <Text style={styles.detailValue}>1 {tokenIn.symbol} = {(parseFloat(outputAmount)/parseFloat(inputAmount)).toFixed(4)} {tokenOut.symbol}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Slippage Tolerance</Text>
                <Text style={styles.detailValue}>0.5%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Network Fee</Text>
                <Text style={styles.detailValue}>~${quote.quote?.gasFeeUSD || '0.00'}</Text>
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
            style={[styles.swapBtn, { backgroundColor: theme.primary }, (!quote || isSwapping) && { opacity: 0.5 }]}
            onPress={handleSwap}
            disabled={!quote || isSwapping}
          >
            {isSwapping ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.swapBtnText}>Swap</Text>
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
  headerTitle: { fontFamily: 'Syne_700Bold', fontSize: 18, color: '#fff' },
  settingsBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  content: { padding: 20 },
  card: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cardLabel: { fontFamily: 'KHTeka', fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  balanceText: { fontFamily: 'DM Mono', fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainInput: { fontFamily: 'Syne_700Bold', fontSize: 32, color: '#fff', flex: 1 },
  outputValueContainer: { flex: 1, height: 40, justifyContent: 'center' },
  tokenSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 8 },
  tokenIcon: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tokenIconText: { color: '#fff', fontSize: 12, fontFamily: 'Syne_700Bold' },
  tokenSymbol: { fontFamily: 'Syne_700Bold', fontSize: 16, color: '#fff' },
  switchWrapper: { height: 40, alignItems: 'center', justifyContent: 'center', zIndex: 10, marginVertical: -20 },
  switchBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#0A0A0A' },
  detailsCard: { marginTop: 24, paddingHorizontal: 4, gap: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontFamily: 'KHTeka', fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  detailValue: { fontFamily: 'DM Mono', fontSize: 13, color: '#fff' },
  errorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,59,48,0.1)', padding: 12, borderRadius: 12, marginTop: 24, gap: 8 },
  errorText: { fontFamily: 'KHTeka', fontSize: 12, color: '#FF3B30', flex: 1 },
  swapBtn: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 32 },
  swapBtnText: { fontFamily: 'Syne_700Bold', fontSize: 16, color: '#fff' },
});
