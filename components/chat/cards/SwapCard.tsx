import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Linking } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useSwap } from '@/hooks/useSwap';
import { useBridge } from '@/hooks/useBridge';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

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
  },
  '42161': {
    'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'WETH': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
};

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  8453: 'Base',
  42161: 'Arbitrum',
};

export const SwapCard: React.FC<SwapCardProps> = ({ payload }) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const [fromChain, setFromChain] = useState<number>(1);
  const [toChain, setToChain] = useState<number>(1);

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

  useEffect(() => {
    if (swapParams) {
      setFromChain(swapParams.fromChain || swapParams.chainId || 1);
      setToChain(swapParams.toChain || swapParams.fromChain || swapParams.chainId || 1);
    }
  }, [swapParams]);

  const isCrossChain = useMemo(() => fromChain !== toChain, [fromChain, toChain]);

  const fetchRoute = useCallback(() => {
    if (!swapParams) return;

    const tokenIn = (swapParams.tokenIn === "null" || !swapParams.tokenIn) ? null : swapParams.tokenIn;
    const tokenOut = (swapParams.tokenOut === "null" || !swapParams.tokenOut) ? null : swapParams.tokenOut;

    const fromTokenAddr = tokenIn || swapParams.fromTokenAddress || FALLBACK_ADDRESSES[String(fromChain)]?.[swapParams.symbolIn?.toUpperCase()];
    const toTokenAddr = tokenOut || swapParams.toTokenAddress || FALLBACK_ADDRESSES[String(toChain)]?.[swapParams.symbolOut?.toUpperCase()];
    
    if (!fromTokenAddr || !toTokenAddr) return;

    if (isCrossChain) {
      console.log('[SwapCard] Fetching bridge route...');
      resetBridge();
      getRoute({
        fromChainId: fromChain,
        toChainId: toChain,
        fromTokenAddress: fromTokenAddr as `0x${string}`,
        toTokenAddress: toTokenAddr as `0x${string}`,
        amount: swapParams.amount,
      });
    } else {
      console.log('[SwapCard] Fetching swap quote...');
      resetSwap();
      getQuote({
        chainId: fromChain,
        tokenIn: fromTokenAddr as `0x${string}`,
        tokenOut: toTokenAddr as `0x${string}`,
        tokenInDecimals: swapParams.tokenInDecimals ?? 6,
        tokenOutDecimals: swapParams.tokenOutDecimals ?? 18,
        amountIn: swapParams.amount,
      });
    }
  }, [swapParams, fromChain, toChain, isCrossChain, getRoute, getQuote, resetBridge, resetSwap]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  const handleExecute = async () => {
    if (!swapParams) return;

    if (isCrossChain) {
      if (!bridgeQuote) return;
      const tokenIn = (swapParams.tokenIn === "null" || !swapParams.tokenIn) ? null : swapParams.tokenIn;
      const tokenOut = (swapParams.tokenOut === "null" || !swapParams.tokenOut) ? null : swapParams.tokenOut;
      const fromTokenAddr = tokenIn || FALLBACK_ADDRESSES[String(fromChain)]?.[swapParams.symbolIn?.toUpperCase()];
      const toTokenAddr = tokenOut || FALLBACK_ADDRESSES[String(toChain)]?.[swapParams.symbolOut?.toUpperCase()];
      
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
        chainId: fromChain,
        tokenIn: fromTokenAddr as `0x${string}`,
        tokenOut: toTokenAddr as `0x${string}`,
        tokenInDecimals: swapParams.tokenInDecimals ?? 6,
        tokenOutDecimals: swapParams.tokenOutDecimals ?? 18,
        amountIn: swapParams.amount,
      });
    }
  };

  const STEP_LABELS: Record<string, string> = {
    idle: '', quoting: 'Quoting...', checking_allowance: 'Checking...', approving: 'Approve', 
    waiting_approval: 'Confirming...', signing_swap: 'Sign...', waiting_confirmation: 'Broadcasting...',
    fetching_route: 'Routing...', initiating: 'Sign...', waiting_source: 'Confirming...', 
    relaying: 'Relaying...', done: 'Success!', error: 'Failed'
  };

  const currentStep = isCrossChain ? bridgeStep : swapStep;
  const currentError = isCrossChain ? bridgeError : swapError;
  const currentTx = isCrossChain ? bridgeTxHash : swapTxHash;
  const isLoading = currentStep !== 'idle' && currentStep !== 'done' && currentStep !== 'error';
  const isReady = isCrossChain ? !!bridgeQuote : !!swapQuote;
  
  const outputAmount = isCrossChain ? bridgeQuote?.estimatedOutputAmount : swapQuote?.amountOutFormatted;

  return (
    <Animated.View entering={FadeIn} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <LinearGradient colors={['rgba(255,255,255,0.03)', 'transparent']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name={isCrossChain ? "git-network" : "flash"} size={12} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.textMuted }]}>
            {isCrossChain ? 'CROSS-CHAIN BRIDGE' : 'NATIVE SWAP'}
          </Text>
        </View>
        <Text style={[styles.headerLogo, { color: theme.primary }]}>MOLFI</Text>
      </View>

      {/* Chain Selector Dropdown */}
      <View style={styles.dropdownRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.dropdownLabel, { color: theme.textMuted }]}>SOURCE</Text>
          <TouchableOpacity 
            onPress={() => {
              const ids = [1, 137, 8453, 42161];
              const currentIndex = ids.indexOf(fromChain);
              const nextIndex = (currentIndex + 1) % ids.length;
              setFromChain(ids[nextIndex]);
            }}
            style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text style={[styles.dropdownText, { color: theme.text }]}>{CHAIN_NAMES[fromChain]}</Text>
            <Ionicons name="swap-horizontal" size={12} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.dropdownLabel, { color: theme.textMuted }]}>DESTINATION</Text>
          <TouchableOpacity 
            onPress={() => {
              const ids = [1, 137, 8453, 42161];
              const currentIndex = ids.indexOf(toChain);
              const nextIndex = (currentIndex + 1) % ids.length;
              setToChain(ids[nextIndex]);
            }}
            style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text style={[styles.dropdownText, { color: theme.text }]}>{CHAIN_NAMES[toChain]}</Text>
            <Ionicons name="swap-horizontal" size={12} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Asset Display */}
      <View style={styles.assetContainer}>
        <View style={styles.assetSide}>
          <Text style={[styles.assetLabel, { color: theme.textMuted }]}>SEND</Text>
          <Text style={[styles.assetValue, { color: theme.text }]}>
            {swapParams?.amount} <Text style={{ color: theme.primary }}>{swapParams?.symbolIn}</Text>
          </Text>
        </View>
        
        <View style={[styles.arrowCircle, { backgroundColor: theme.border }]}>
          <Ionicons name="arrow-forward" size={16} color={theme.primary} />
        </View>

        <View style={[styles.assetSide, { alignItems: 'flex-end' }]}>
          <Text style={[styles.assetLabel, { color: theme.textMuted }]}>RECEIVE</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text style={[styles.assetValue, { color: theme.text }]}>
              {outputAmount ? `~${Number(outputAmount).toFixed(4)}` : '?'} <Text style={{ color: theme.primary }}>{swapParams?.symbolOut}</Text>
            </Text>
          )}
        </View>
      </View>

      {/* AI Reasoning */}
      <View style={[styles.aiSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.aiHeader}>
          <Ionicons name="sparkles" size={10} color={theme.primary} />
          <Text style={[styles.aiTitle, { color: theme.textMuted }]}>AI LOGIC</Text>
        </View>
        <Text style={[styles.aiText, { color: theme.text }]}>{payload.reasoning}</Text>
      </View>

      {/* Error Banner */}
      {currentError && (
        <View style={[styles.errorBanner, { backgroundColor: `${theme.error}11` }]}>
          <Ionicons name="alert-circle" size={14} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>{currentError}</Text>
        </View>
      )}

      {/* Action Button */}
      {currentStep === 'done' ? (
        <View style={[styles.successBox, { borderColor: theme.success }]}>
          <Ionicons name="checkmark-circle" size={20} color={theme.success} />
          <Text style={[styles.successText, { color: theme.success }]}>Transaction Confirmed</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.mainButton, { backgroundColor: theme.primary }, (!isReady || isLoading) && styles.disabledButton]} 
          onPress={handleExecute}
          disabled={!isReady || isLoading}
        >
          {isLoading ? (
            <View style={styles.buttonLoading}>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={styles.buttonText}>{STEP_LABELS[currentStep] || 'Processing...'}</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>SIGN & EXECUTE</Text>
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, width: width * 0.9, borderWidth: 1, overflow: 'hidden', alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 10, letterSpacing: 1 },
  headerLogo: { fontFamily: 'Manrope-ExtraBold', fontSize: 10 },
  dropdownRow: { flexDirection: 'row', marginBottom: 20 },
  dropdownLabel: { fontSize: 8, fontFamily: 'Manrope-ExtraBold', marginBottom: 4 },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1 },
  dropdownText: { fontSize: 12, fontFamily: 'Inter-Regular' },
  assetContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  assetSide: { flex: 1 },
  assetLabel: { fontSize: 9, fontFamily: 'Manrope-ExtraBold', marginBottom: 4 },
  assetValue: { fontSize: 20, fontFamily: 'DM_Mono_500Medium' },
  arrowCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  aiSection: { padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  aiTitle: { fontSize: 8, fontFamily: 'Manrope-ExtraBold' },
  aiText: { fontSize: 11, fontFamily: 'Inter-Regular', lineHeight: 15 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, marginBottom: 16, gap: 8 },
  errorText: { fontSize: 11, fontFamily: 'Inter-Regular', flex: 1 },
  mainButton: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFF', fontFamily: 'Manrope-ExtraBold', fontSize: 14, letterSpacing: 1 },
  buttonLoading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  disabledButton: { opacity: 0.5 },
  successBox: { height: 56, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  successText: { fontFamily: 'Manrope-ExtraBold', fontSize: 14 }
});

