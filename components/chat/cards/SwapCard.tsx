import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Linking } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useSwap } from '@/hooks/useSwap';
import { useBridge } from '@/hooks/useBridge';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface SwapCardProps {
  payload: {
    reasoning: string;
    plan: {
      intent: string;
      steps: Array<{
        action: 'swap' | 'send';
        params: any;
      }>;
      totalValueUsd: number;
    };
    riskAssessment: {
      verdict: 'AUTO_EXECUTE' | 'NEEDS_APPROVAL';
      reason: string;
    };
  };
}

// Minimal fallback addresses if intent parser misses them
const FALLBACK_ADDRESSES: Record<string, Record<string, string>> = {
  '1': {
    'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  '137': {
    'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    'WMATIC': '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
    'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  },
  '8453': {
    'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    'WETH': '0x4200000000000000000000000000000000000006',
    'USDT': '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
  },
  '42161': {
    'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    'WETH': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
  '16601': {
    'WETH': '0x1Cd0690fF9a693f5EF2dD976660a8dAFc81A109c',
    'USDC': '0x627d32C41D35284050b168925501867160965383', // 0G USDC
  }
};

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  8453: 'Base',
  16661: '0G Mainnet',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  56: 'BNB Chain',
  43114: 'Avalanche',
};

export const SwapCard: React.FC<SwapCardProps> = ({ payload }) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const {
    getQuote, executeSwap, step: swapStep, quote: swapQuote,
    txHash: swapTxHash, error: swapError, reset: resetSwap
  } = useSwap();

  const {
    getRoute, executeBridge, step: bridgeStep, quote: bridgeQuote,
    sourceTxHash: bridgeTxHash, error: bridgeError, reset: resetBridge
  } = useBridge();

  const swapStepData = payload.plan.steps.find(s => s.action === 'swap');
  const swapParams = swapStepData?.params;

  const isCrossChain = useMemo(() => {
    if (!swapParams) return false;
    const from = swapParams.fromChain || swapParams.chainId;
    const to = swapParams.toChain || from;
    return from !== to;
  }, [swapParams]);

  const fetchRoute = useCallback(() => {
    if (!swapParams) return;

    const fromChain = swapParams.fromChain || swapParams.chainId;
    const toChain = swapParams.toChain || fromChain;

    const tokenIn = (swapParams.tokenIn === "null" || !swapParams.tokenIn) ? null : swapParams.tokenIn;
    const tokenOut = (swapParams.tokenOut === "null" || !swapParams.tokenOut) ? null : swapParams.tokenOut;

    const fromTokenAddr = tokenIn || swapParams.fromTokenAddress || FALLBACK_ADDRESSES[String(fromChain)]?.[swapParams.symbolIn?.toUpperCase()];
    const toTokenAddr = tokenOut || swapParams.toTokenAddress || FALLBACK_ADDRESSES[String(toChain || fromChain)]?.[swapParams.symbolOut?.toUpperCase()];
    
    console.log('[SwapCard] Resolved addresses:', {
      from: swapParams.symbolIn, fromAddr: fromTokenAddr,
      to: swapParams.symbolOut, toAddr: toTokenAddr,
      isCrossChain
    });

    if (!fromTokenAddr || !toTokenAddr) {
      console.warn("Missing token addresses for routing:", { 
        from: swapParams.symbolIn, fromAddr: fromTokenAddr, 
        to: swapParams.symbolOut, toAddr: toTokenAddr 
      });
      return;
    }

    if (isCrossChain) {
      resetBridge();
      getRoute({
        fromChainId: fromChain,
        toChainId: toChain,
        tokenAddress: fromTokenAddr as `0x${string}`,
        toTokenAddress: toTokenAddr as `0x${string}`,
        tokenSymbol: swapParams.symbolIn,
        tokenDecimals: swapParams.tokenInDecimals ?? 6,
        amount: swapParams.amount,
      });
    } else {
      resetSwap();
      getQuote({
        chainId: fromChain as 16661 | 137,
        tokenIn: fromTokenAddr as `0x${string}`,
        tokenOut: toTokenAddr as `0x${string}`,
        tokenInDecimals: swapParams.tokenInDecimals ?? 6,
        tokenOutDecimals: swapParams.tokenOutDecimals ?? 18,
        amountIn: swapParams.amount,
      });
    }
  }, [swapParams, isCrossChain, getRoute, getQuote]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  const handleExecute = async () => {
    if (!swapParams) return;

    const fromChain = swapParams.fromChain || swapParams.chainId;
    const toChain = swapParams.toChain || fromChain;

    if (isCrossChain) {
      if (!bridgeQuote) return;
      const tokenIn = (swapParams.tokenIn === "null" || !swapParams.tokenIn) ? null : swapParams.tokenIn;
      const tokenOut = (swapParams.tokenOut === "null" || !swapParams.tokenOut) ? null : swapParams.tokenOut;
      
      const fromTokenAddr = tokenIn || FALLBACK_ADDRESSES[String(fromChain)]?.[swapParams.symbolIn?.toUpperCase()];
      const toTokenAddr = tokenOut || FALLBACK_ADDRESSES[String(toChain || fromChain)]?.[swapParams.symbolOut?.toUpperCase()];
      await executeBridge({
        fromChainId: fromChain,
        toChainId: toChain,
        tokenAddress: fromTokenAddr as `0x${string}`,
        toTokenAddress: toTokenAddr as `0x${string}`,
        tokenSymbol: swapParams.symbolIn,
        tokenDecimals: swapParams.tokenInDecimals ?? 6,
        amount: swapParams.amount,
      });
    } else {
      if (!swapQuote) return;
      const tokenIn = (swapParams.tokenIn === "null" || !swapParams.tokenIn) ? null : swapParams.tokenIn;
      const tokenOut = (swapParams.tokenOut === "null" || !swapParams.tokenOut) ? null : swapParams.tokenOut;

      const fromTokenAddr = tokenIn || FALLBACK_ADDRESSES[String(fromChain)]?.[swapParams.symbolIn?.toUpperCase()];
      const toTokenAddr = tokenOut || FALLBACK_ADDRESSES[String(fromChain)]?.[swapParams.symbolOut?.toUpperCase()];
      await executeSwap({
        chainId: fromChain as 16661 | 137,
        tokenIn: fromTokenAddr as `0x${string}`,
        tokenOut: toTokenAddr as `0x${string}`,
        tokenInDecimals: swapParams.tokenInDecimals ?? 6,
        tokenOutDecimals: swapParams.tokenOutDecimals ?? 18,
        amountIn: swapParams.amount,
      });
    }
  };

  const STEP_LABELS: Record<string, string> = {
    idle: '',
    quoting: 'Fetching best route...',
    checking_allowance: 'Checking approval...',
    approving: 'Approve token spend',
    waiting_approval: 'Confirming approval...',
    signing_swap: 'Sign swap in wallet',
    waiting_confirmation: 'Broadcasting...',
    fetching_route: 'Fetching bridge route...',
    initiating: 'Sign bridge tx',
    waiting_source: 'Confirming on source...',
    relaying: 'Relayer processing...',
    done: 'Complete ✓',
    error: 'Failed',
  };

  const currentStep = isCrossChain ? bridgeStep : swapStep;
  const currentError = isCrossChain ? bridgeError : swapError;
  const currentTx = isCrossChain ? bridgeTxHash : swapTxHash;
  const isLoading = currentStep !== 'idle' && currentStep !== 'done' && currentStep !== 'error';
  const isReady = isCrossChain ? !!bridgeQuote : !!swapQuote;
  
  const outputAmount = isCrossChain 
    ? bridgeQuote?.estimatedOutputAmount 
    : swapQuote?.amountOutFormatted;

  const toolName = isCrossChain 
    ? (bridgeQuote?.provider === 'stargate' ? 'Stargate V2' : 'Wormhole')
    : 'Uniswap V3 (0G)';

  const requireManualBridge = isCrossChain && currentError?.includes('bridge.0g.ai');

  return (
    <Animated.View entering={FadeIn} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <LinearGradient colors={['rgba(255,255,255,0.03)', 'transparent']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name={isCrossChain ? "git-network" : "flash"} size={12} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.textMuted }]}>
            {isCrossChain ? 'BRIDGE PREVIEW' : 'PRE-TRADE ANALYSIS'}
          </Text>
        </View>
        <Text style={[styles.headerLogo, { color: theme.primary }]}>MOLFI</Text>
      </View>

      <View style={styles.swapMain}>
        <View style={styles.tokenBox}>
          <Text style={[styles.tokenLabel, { color: theme.textMuted }]}>SEND</Text>
          <Text style={[styles.tokenValue, { color: theme.text }]}>{swapParams?.amount} {swapParams?.symbolIn}</Text>
        </View>
        
        <View style={styles.arrowContainer}>
          <View style={[styles.arrowCircle, { backgroundColor: theme.border }]}>
            <Ionicons name="arrow-forward" size={16} color={theme.text} />
          </View>
        </View>

        <View style={styles.tokenBox}>
          <Text style={[styles.tokenLabel, { color: theme.textMuted }]}>RECEIVE</Text>
          {currentStep === 'quoting' || currentStep === 'fetching_route' ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 4 }} />
          ) : (
            <Text style={[styles.tokenValue, { color: isReady ? theme.text : theme.textMuted }]}>
              {outputAmount ? `~${Number(outputAmount).toFixed(6)}` : '?'} {swapParams?.symbolOut}
            </Text>
          )}
        </View>
      </View>

      {/* AI Reasoning Section */}
      <View style={[styles.aiReasoning, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.aiHeader}>
          <Ionicons name="sparkles" size={12} color={theme.primary} />
          <Text style={[styles.aiTitle, { color: theme.textMuted }]}>AGENT REASONING</Text>
        </View>
        <Text style={[styles.aiText, { color: theme.text }]}>{payload.reasoning}</Text>
        
        <View style={[styles.riskBadge, { backgroundColor: payload.riskAssessment.verdict === 'AUTO_EXECUTE' ? `${theme.success}22` : `${theme.warning}22` }]}>
          <Text style={[styles.riskBadgeText, { color: payload.riskAssessment.verdict === 'AUTO_EXECUTE' ? theme.success : theme.warning }]}>
            {payload.riskAssessment.verdict}: {payload.riskAssessment.reason}
          </Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <DetailRow 
          label="Route" 
          value={`${CHAIN_NAMES[swapParams?.fromChain || swapParams?.chainId] || 'Unknown'} → ${CHAIN_NAMES[swapParams?.toChain || swapParams?.fromChain || swapParams?.chainId] || 'Unknown'}`} 
          theme={theme} 
        />
        <DetailRow 
          label={isCrossChain ? "Provider" : "Pool"} 
          value={toolName} 
          badge={isCrossChain ? "CROSS-CHAIN" : undefined}
          theme={theme} 
        />
        {isCrossChain ? (
          <DetailRow label="Est. Time" value={bridgeQuote?.estimatedTime || '?'} theme={theme} />
        ) : (
          <DetailRow label="Fee Tier" value={`${(swapQuote?.fee || 0) / 10000}%`} theme={theme} />
        )}
      </View>

      {requireManualBridge && (
        <View style={[styles.errorBanner, { backgroundColor: 'rgba(255,165,0,0.1)' }]}>
          <Ionicons name="warning" size={16} color="#FFA500" />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.errorBannerText, { color: '#FFA500', fontFamily: 'Syne_700Bold' }]}>
              Manual Bridge Required
            </Text>
            <Text style={[styles.errorBannerText, { color: '#FFA500', opacity: 0.8 }]}>
              0G → Polygon is not yet supported by automated relayers. Please use the official 0G bridge manually.
            </Text>
            <TouchableOpacity 
              style={{ marginTop: 4, padding: 6, backgroundColor: '#FFA50022', borderRadius: 6, alignSelf: 'flex-start' }}
              onPress={() => Linking.openURL('https://bridge.0g.ai')}
            >
              <Text style={{ color: '#FFA500', fontSize: 10, fontFamily: 'Syne_700Bold' }}>OPEN BRIDGE.0G.AI</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!requireManualBridge && currentError && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={14} color="#FF3B30" />
          <Text style={styles.errorBannerText}>{currentError}</Text>
        </View>
      )}

      {currentStep === 'done' ? (
        <View style={[styles.successBox, { borderColor: theme.success, backgroundColor: `${theme.success}11` }]}>
          <Ionicons name="checkmark-circle" size={24} color={theme.success} />
          <View style={styles.successTextContainer}>
            <Text style={[styles.successText, { color: theme.success }]}>Transaction Sent</Text>
            <Text style={[styles.txHash, { color: theme.success }]}>{currentTx?.slice(0, 14)}...</Text>
          </View>
        </View>
      ) : !requireManualBridge && (
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.refreshButton, { borderColor: theme.border }]} 
            onPress={fetchRoute} 
            disabled={isLoading}
          >
            <Ionicons name="refresh" size={18} color={theme.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.primaryButton, 
              { backgroundColor: theme.primary }, 
              (!isReady || isLoading) && styles.disabledButton
            ]} 
            onPress={handleExecute}
            disabled={!isReady || isLoading}
          >
            {isLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color="#FFF" size="small" />
                <Text style={styles.primaryButtonText}>{STEP_LABELS[currentStep] || 'Processing...'}</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>SIGN & EXECUTE</Text>
            )}
          </TouchableOpacity>
        </View>
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
  },
  aiReasoning: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  aiTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 8,
    letterSpacing: 1,
  },
  aiText: {
    fontFamily: 'KHTeka',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  riskBadgeText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 9,
  }
});
