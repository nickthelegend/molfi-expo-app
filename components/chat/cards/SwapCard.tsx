import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useUniswapSwap } from '@/hooks/useUniswapSwap';
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
  }
};

export const SwapCard: React.FC<SwapCardProps> = ({ payload }) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { getQuote, executeSwap, isLoading: isSwapping, error: swapError } = useUniswapSwap();
  const [quote, setQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'approving' | 'signing' | 'broadcasting' | 'confirmed' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const fetchQuote = async () => {
    setIsLoading(true);
    const tokenIn = payload.fromTokenAddress || TOKEN_ADDRESSES[payload.chainId]?.[payload.fromToken];
    const tokenOut = payload.toTokenAddress || TOKEN_ADDRESSES[payload.chainId]?.[payload.toToken];
    
    if (!tokenIn || !tokenOut) {
      setIsLoading(false);
      return;
    }

    const data = await getQuote({
      tokenIn,
      tokenOut,
      amount: payload.amount,
      chainId: payload.chainId,
    });
    
    setQuote(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQuote();
  }, []);

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
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>⚡ MULTI-SWAP PREVIEW</Text>
          <Text style={styles.headerLogo}>Molfi</Text>
        </View>
        <Text style={styles.subHeader}>Splitting {payload.amount} {payload.fromToken} into {payload.swaps?.length} tokens</Text>
        {/* Simplified multi-swap view */}
        {payload.swaps?.map((s, i) => (
          <View key={i} style={styles.multiRow}>
             <Text style={styles.multiText}>{s.amount} {s.fromToken} → {s.toToken}</Text>
             <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          </View>
        ))}
        <TouchableOpacity style={styles.primaryButton} disabled>
          <Text style={styles.primaryButtonText}>Sign All ({payload.swaps?.length} txns)</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
              ~{quote ? (Number(quote.quote.quote) / 10**18).toFixed(4) : '?'} {payload.toToken}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <DetailRow label="Rate" value={quote ? `1 ${payload.toToken} = $...` : '-'} theme={theme} />
        <DetailRow label="Network" value={payload.chainId === 8453 ? "Base" : "Ethereum"} theme={theme} />
        <DetailRow label="Route" value="UniswapX (Gasless)" theme={theme} />
        <DetailRow label="Gas" value="~$0.00 (gasless)" theme={theme} />
        <DetailRow label="Slippage" value="0.5%" theme={theme} />
      </View>

      {status === 'confirmed' ? (
        <View style={[styles.successBox, { borderColor: theme.success }]}>
          <Text style={[styles.successText, { color: theme.success }]}>Swap Executed ✓</Text>
          <Text style={[styles.txLink, { color: theme.success }]}>View Transaction</Text>
        </View>
      ) : (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={fetchQuote} disabled={isLoading}>
            <Text style={[styles.secondaryButtonText, { color: theme.text }]}>Refresh Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: theme.primary }, (!quote || isSwapping) && styles.disabledButton]} 
            onPress={handleSwap}
            disabled={!quote || isSwapping}
          >
            {isSwapping ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign & Swap</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {status === 'error' && <Text style={[styles.errorText, { color: theme.error }]}>Failed - {swapError || 'Unknown error'}</Text>}
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
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(42, 42, 42, 0.3)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: Colors.textMuted,
    fontFamily: 'Syne-Bold',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  headerLogo: {
    color: Colors.primary,
    fontFamily: 'Syne-Bold',
    fontSize: 12,
  },
  subHeader: {
    color: Colors.text,
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
    color: Colors.text,
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
    color: Colors.textMuted,
    fontFamily: 'Syne-Regular',
    fontSize: 13,
  },
  detailValue: {
    color: Colors.text,
    fontFamily: 'DM-Mono-Regular',
    fontSize: 13,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1.5,
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.text,
    fontFamily: 'Syne-Medium',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  successBox: {
    backgroundColor: 'rgba(0, 255, 148, 0.1)',
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  successText: {
    color: Colors.success,
    fontFamily: 'Syne-Bold',
    fontSize: 15,
  },
  txLink: {
    color: Colors.success,
    fontFamily: 'Syne-Medium',
    fontSize: 12,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: Colors.error,
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
    color: Colors.text,
    fontFamily: 'DM-Mono-Medium',
    fontSize: 14,
  }
});
