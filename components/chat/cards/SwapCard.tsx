import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useUniswapSwap, formatQuoteAmount } from '@/hooks/useUniswapSwap';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

interface SwapCardProps {
  payload: {
    fromToken: string;
    fromTokenAddress: string | null;
    toToken: string;
    toTokenAddress: string | null;
    amount: string;
    chainId: number;
    isMultiSwap?: boolean;
    swaps?: any[];
  };
}

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
  16600: {
    'USDC': '0x...', // TODO: Add 0G token addresses
    'ETH': 'ETH',
  }
};

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  16600: '0G Galileo',
  42161: 'Arbitrum',
};

export const SwapCard: React.FC<SwapCardProps> = ({ payload }) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { getQuote, executeSwap, isLoading: isSwapping, error: swapError } = useUniswapSwap();
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'approving' | 'signing' | 'broadcasting' | 'confirmed' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    setIsLoading(true);
    const tokenIn = payload.fromTokenAddress || TOKEN_ADDRESSES[payload.chainId]?.[payload.fromToken] || payload.fromToken;
    const tokenOut = payload.toTokenAddress || TOKEN_ADDRESSES[payload.chainId]?.[payload.toToken] || payload.toToken;
    
    try {
      const data = await getQuote({
        tokenIn,
        tokenOut,
        amount: payload.amount,
        chainId: payload.chainId,
      });
      
      setQuote(data);
    } catch (e) {
      console.error("Fetch quote error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [getQuote, payload]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleSwap = async () => {
    if (!quote) return;
    setStatus('signing');
    const hash = await executeSwap(quote);
    if (hash) {
      setTxHash(hash);
      setStatus('confirmed');
    } else {
      setStatus('error');
    }
  };

  if (payload.isMultiSwap) {
    return (
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.textMuted }]}>⚡ MULTI-SWAP PREVIEW</Text>
          <Text style={[styles.headerLogo, { color: theme.primary }]}>Molfi</Text>
        </View>
        <Text style={[styles.subHeader, { color: theme.text }]}>Splitting {payload.amount} {payload.fromToken} into {payload.swaps?.length} tokens</Text>
        {payload.swaps?.map((s, i) => (
          <View key={i} style={styles.multiRow}>
             <Text style={[styles.multiText, { color: theme.text }]}>{s.amount} {s.fromToken} → {s.toToken}</Text>
             <Ionicons name="checkmark-circle" size={16} color={theme.success} />
          </View>
        ))}
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: 0.5 }]} disabled>
          <Text style={styles.primaryButtonText}>Sign All ({payload.swaps?.length} txns)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const outputAmount = quote ? formatQuoteAmount(quote) : '?';
  const routing = quote?.routing || 'CLASSIC';
  const gasUSD = quote?.quote?.gasFeeUSD ? `~$${quote.quote.gasFeeUSD}` : routing.includes('DUTCH') ? '$0.00 (gasless)' : '-';

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textMuted }]}>⚡ SWAP PREVIEW</Text>
        <Text style={[styles.headerLogo, { color: theme.primary }]}>Molfi</Text>
      </View>

      <View style={styles.swapMain}>
        <View style={styles.tokenInfo}>
          <Text style={[styles.tokenAmount, { color: theme.text }]}>{payload.amount} {payload.fromToken}</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color={theme.textMuted} />
        <View style={styles.tokenInfo}>
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text style={[styles.tokenAmount, { color: theme.text }]}>
              ~{outputAmount} {payload.toToken}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <DetailRow label="Network" value={CHAIN_NAMES[payload.chainId] || `Chain ${payload.chainId}`} theme={theme} />
        <DetailRow label="Route" value={routing === 'DUTCH_V2' ? "UniswapX (Gasless)" : routing} theme={theme} />
        <DetailRow label="Gas" value={gasUSD} theme={theme} />
        <DetailRow label="Slippage" value="0.5%" theme={theme} />
      </View>

      {status === 'confirmed' ? (
        <View style={[styles.successBox, { borderColor: theme.success, backgroundColor: 'rgba(0, 255, 148, 0.05)' }]}>
          <Text style={[styles.successText, { color: theme.success }]}>Swap Executed ✓</Text>
          <Text style={[styles.txLink, { color: theme.success }]}>TX: {txHash?.slice(0, 10)}...</Text>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={fetchQuote} disabled={isLoading || isSwapping}>
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Refresh Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: theme.primary }, (!quote || isSwapping || isLoading) && styles.disabledButton]} 
            onPress={handleSwap}
            disabled={!quote || isSwapping || isLoading}
          >
            {isSwapping ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign & Swap</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {status === 'error' && <Text style={[styles.errorText, { color: theme.error }]}>Failed - {swapError || 'Check wallet balance'}</Text>}
    </View>
  );
};

const DetailRow = ({ label, value, theme }: { label: string; value: string; theme: any }) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>{label}</Text>
    <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Syne-Bold',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  headerLogo: {
    fontFamily: 'Syne-Bold',
    fontSize: 12,
  },
  subHeader: {
    fontFamily: 'Syne-Medium',
    fontSize: 14,
    marginBottom: 12,
  },
  swapMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  tokenInfo: {
    alignItems: 'center',
    flex: 1,
  },
  tokenAmount: {
    fontFamily: 'DM-Mono-Medium',
    fontSize: 18,
  },
  detailsContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontFamily: 'Syne-Regular',
    fontSize: 13,
  },
  detailValue: {
    fontFamily: 'DM-Mono-Regular',
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1.5,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontFamily: 'Syne-Bold',
    fontSize: 15,
  },
  secondaryButtonText: {
    fontFamily: 'Syne-Medium',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  successBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  successText: {
    fontFamily: 'Syne-Bold',
    fontSize: 15,
  },
  txLink: {
    fontFamily: 'Syne-Medium',
    fontSize: 12,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontFamily: 'Syne-Regular',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  multiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  multiText: {
    fontFamily: 'DM-Mono-Medium',
    fontSize: 14,
  }
});
