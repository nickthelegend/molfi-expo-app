import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAcross } from '@/hooks/useAcross';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { parseUnits } from 'viem';

const { width } = Dimensions.get('window');

interface SwapCardProps {
  payload: {
    fromToken: string;
    fromTokenAddress: string | null;
    toToken: string;
    toTokenAddress: string | null;
    amount: string;
    chainId: number;
    toChainId?: number;
    isMultiSwap?: boolean;
    swaps?: any[];
  };
}

// REAL addresses for supported chains, placeholders for 0G
const TOKEN_ADDRESSES: Record<number, Record<string, string>> = {
  8453: {
    'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    'ETH': 'ETH',
    'WETH': '0x4200000000000000000000000000000000000006',
  },
  1: {
    'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eb48',
    'ETH': 'ETH',
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  16601: {
    'USDC': '0x627d32C41D35284050b168925501867160965383', // 0G Testnet USDC
    'USDT': '0xe444985223630f9a656683526010041d8e64c383', // 0G Testnet USDT
    'ETH': 'ETH',
  },
  16661: {
    'USDC': '0x627d32C41D35284050b168925501867160965383', // 0G Mainnet USDC (Placeholder)
    'USDT': '0xe444985223630f9a656683526010041d8e64c383', // 0G Mainnet USDT (Placeholder)
    'ETH': 'ETH',
  }
};

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  16600: '0G Newton',
  16601: '0G Galileo',
  16661: '0G Mainnet',
  80087: '0G Galileo',
  42161: 'Arbitrum',
};

export const SwapCard: React.FC<SwapCardProps> = ({ payload }) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { getQuote, executeRoute, isLoading: isSwapping, error: swapError } = useLiFi();
  const [route, setRoute] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'approving' | 'signing' | 'broadcasting' | 'confirmed' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    setIsLoading(true);
    setQuoteError(null);
    
    const fromChain = payload.chainId;
    const toChain = payload.toChainId || payload.chainId;
    console.log(`[SwapCard] Fetching quote: ${payload.amount} ${payload.fromToken} (${fromChain}) -> ${payload.toToken} (${toChain})`);
    
    const tokenIn = payload.fromTokenAddress || TOKEN_ADDRESSES[fromChain]?.[payload.fromToken] || payload.fromToken;
    const tokenOut = payload.toTokenAddress || TOKEN_ADDRESSES[toChain]?.[payload.toToken] || payload.toToken;
    
    try {
      const isStable = payload.fromToken.includes('USD');
      const decimals = isStable ? 6 : 18;
      const rawAmount = parseUnits(payload.amount, decimals).toString();
      
      const bestRoute = await getQuote({
        fromChainId: fromChain,
        toChainId: toChain,
        fromTokenAddress: tokenIn,
        toTokenAddress: tokenOut,
        fromAmount: rawAmount,
      });
      
      if (bestRoute) {
        console.log('[SwapCard] Quote received successfully');
        setRoute(bestRoute);
      }
    } catch (e: any) {
      console.error('[SwapCard] Quote fetch failed:', e.message);
      setQuoteError("Failed to fetch bridge route");
    } finally {
      setIsLoading(false);
    }
  }, [getQuote, payload]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleSwap = async () => {
    if (!route) return;
    console.log('[SwapCard] User initiated SIGN & EXECUTE');
    setStatus('signing');
    const hash = await executeRoute(route);
    if (hash) {
      console.log('[SwapCard] Transaction confirmed! Hash:', hash);
      setTxHash(hash);
      setStatus('confirmed');
    } else {
      console.error('[SwapCard] Execution failed or rejected');
      setStatus('error');
    }
  };

  const outputAmount = route ? (Number(route.toAmount) / (10 ** (route.toToken.decimals || 18))).toFixed(6) : null;
  const toolName = route?.steps[0]?.toolDetails?.name || 'Li.Fi';

  return (
    <Animated.View entering={FadeIn} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.03)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="flash" size={12} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.textMuted }]}>PRE-TRADE ANALYSIS</Text>
        </View>
        <Text style={[styles.headerLogo, { color: theme.primary }]}>MOLFI</Text>
      </View>

      <View style={styles.swapMain}>
        <View style={styles.tokenBox}>
          <Text style={[styles.tokenLabel, { color: theme.textMuted }]}>SEND</Text>
          <Text style={[styles.tokenValue, { color: theme.text }]}>{payload.amount} {payload.fromToken}</Text>
        </View>
        
        <View style={styles.arrowContainer}>
          <View style={[styles.arrowCircle, { backgroundColor: theme.border }]}>
            <Ionicons name="arrow-forward" size={16} color={theme.text} />
          </View>
        </View>

        <View style={styles.tokenBox}>
          <Text style={[styles.tokenLabel, { color: theme.textMuted }]}>RECEIVE</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 4 }} />
          ) : (
            <Text style={[styles.tokenValue, { color: quote ? theme.text : theme.textMuted }]}>
              {outputAmount ? `~${outputAmount}` : '?'} {payload.toToken}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <DetailRow 
          label="Network" 
          value={`${CHAIN_NAMES[payload.chainId] || 'Source'} → ${CHAIN_NAMES[payload.toChainId || payload.chainId] || 'Dest'}`} 
          theme={theme} 
        />
        <DetailRow 
          label="Tool" 
          value={toolName} 
          badge={payload.toChainId && payload.toChainId !== payload.chainId ? "CROSS-CHAIN" : "DIRECT"}
          theme={theme} 
        />
        <DetailRow 
          label="Slippage" 
          value="0.5%" 
          theme={theme} 
        />
      </View>

      {quoteError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={14} color="#FF3B30" />
          <Text style={styles.errorBannerText}>{quoteError}</Text>
        </View>
      )}

      {status === 'confirmed' ? (
        <View style={[styles.successBox, { borderColor: theme.success, backgroundColor: `${theme.success}11` }]}>
          <Ionicons name="checkmark-circle" size={24} color={theme.success} />
          <View style={styles.successTextContainer}>
            <Text style={[styles.successText, { color: theme.success }]}>Transaction Broadcst</Text>
            <Text style={[styles.txHash, { color: theme.success }]}>{txHash?.slice(0, 14)}...</Text>
          </View>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.refreshButton, { borderColor: theme.border }]} 
            onPress={fetchQuote} 
            disabled={isLoading || isSwapping}
          >
            <Ionicons name="refresh" size={18} color={theme.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.primaryButton, 
              { backgroundColor: theme.primary }, 
              (!route || isSwapping || isLoading) && styles.disabledButton
            ]} 
            onPress={handleSwap}
            disabled={!route || isSwapping || isLoading}
          >
            {isSwapping ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>SIGN & EXECUTE</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {status === 'error' && (
        <Text style={[styles.errorText, { color: theme.error }]}>
          {swapError || 'Execution failed. Check balance.'}
        </Text>
      )}
    </Animated.View>
  );
};

const DetailRow = ({ label, value, badge, theme }: { label: string; value: string; badge?: string; theme: any }) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>{label}</Text>
    <View style={styles.detailValueRow}>
      {badge && (
        <View style={[styles.badge, { backgroundColor: theme.primary + '22' }]}>
          <Text style={[styles.badgeText, { color: theme.primary }]}>{badge}</Text>
        </View>
      )}
      <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    overflow: 'hidden',
    width: width * 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
  },
  headerLogo: {
    fontFamily: 'Syne_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  swapMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  tokenBox: {
    flex: 1,
  },
  tokenLabel: {
    fontFamily: 'KHTeka',
    fontSize: 10,
    marginBottom: 4,
  },
  tokenValue: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 17,
  },
  arrowContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  detailsContainer: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: 'KHTeka',
    fontSize: 12,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  primaryButtonText: {
    color: '#FFF',
    fontFamily: 'Syne_700Bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.4,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  successTextContainer: {
    flex: 1,
  },
  successText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 14,
  },
  txHash: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 11,
    marginTop: 2,
    opacity: 0.7,
  },
  errorText: {
    fontFamily: 'KHTeka',
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.1)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    fontFamily: 'KHTeka',
    fontSize: 11,
    color: '#FF3B30',
    flex: 1,
  }
});
