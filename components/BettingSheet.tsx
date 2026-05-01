import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useAccount, useBalance } from 'wagmi';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BottomSheet } from './ui/BottomSheet';
import * as SecureStore from 'expo-secure-store';

const { width } = Dimensions.get('window');

interface BettingSheetProps {
  isVisible: boolean;
  onClose: () => void;
  market: any;
  side: 'YES' | 'NO';
}

export function BettingSheet({ isVisible, onClose, market, side }: BettingSheetProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  // Form State
  const [orderType, setOrderType] = useState<'limit' | 'market'>('market');
  const [dollarAmount, setDollarAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Derived Values
  const currentPrice = useMemo(() => {
    if (!market) return 0.5;
    return side === 'YES' ? market.outcomePrices?.[0] : market.outcomePrices?.[1];
  }, [market, side]);

  const shares = useMemo(() => {
    const amount = parseFloat(dollarAmount) || 0;
    const price = orderType === 'limit' ? parseFloat(limitPrice) : currentPrice;
    if (!price || price <= 0) return 0;
    return amount / price;
  }, [dollarAmount, limitPrice, currentPrice, orderType]);

  const potentialReturn = shares; // 1 share = $1 on resolution
  const potentialProfit = potentialReturn - (parseFloat(dollarAmount) || 0);
  const profitPercent = ((potentialProfit / (parseFloat(dollarAmount) || 1)) * 100).toFixed(1);

  useEffect(() => {
    if (isVisible) {
      setLimitPrice(currentPrice?.toString() || '0.50');
      setOrderStatus('idle');
      setDollarAmount('');
    }
  }, [isVisible, currentPrice]);

  const handleConfirmOrder = async () => {
    if (!dollarAmount || parseFloat(dollarAmount) <= 0) return;
    
    setIsLoading(true);
    setOrderStatus('loading');
    
    try {
      // Simulate API call for now since we need a signer and CLOB client setup
      await new Promise(resolve => setTimeout(resolve, 2000));
      setOrderStatus('success');
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      setOrderStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (orderStatus === 'success') {
      return (
        <View style={styles.successState}>
          <Ionicons name="checkmark-circle" size={80} color="#00C896" />
          <Text style={styles.successTitle}>Order Live on Polymarket</Text>
          <View style={styles.orderIdPill}>
            <Text style={styles.orderIdText}>ID: 0x82...f92c</Text>
          </View>
          <TouchableOpacity style={[styles.doneBtn, { backgroundColor: theme.primary }]} onPress={onClose}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close-outline" size={28} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
          <View style={[styles.sideBadge, { backgroundColor: side === 'YES' ? 'rgba(0,200,150,0.15)' : 'rgba(255,45,85,0.15)' }]}>
            <Text style={[styles.sideBadgeText, { color: side === 'YES' ? '#00C896' : '#FF2D55' }]}>
              {side === 'YES' ? '▲ YES' : '▼ NO'}
            </Text>
          </View>
          <Text style={styles.headerPrice}>{Math.round(currentPrice * 100)}¢</Text>
        </View>

        <Text style={styles.marketQuestion} numberOfLines={2}>{market?.question}</Text>
        <Text style={styles.marketEnds}>Ends {market?.endDate ? new Date(market.endDate).toLocaleDateString() : 'TBD'}</Text>

        {/* Order Type Toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity 
            style={[styles.toggleBtn, orderType === 'limit' && styles.toggleBtnActive]}
            onPress={() => setOrderType('limit')}
          >
            <Text style={[styles.toggleText, orderType === 'limit' && styles.toggleTextActive]}>Limit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, orderType === 'market' && styles.toggleBtnActive]}
            onPress={() => setOrderType('market')}
          >
            <Text style={[styles.toggleText, orderType === 'market' && styles.toggleTextActive]}>Market</Text>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={styles.inputSection}>
          <View style={styles.dollarInputRow}>
            <Text style={styles.dollarSymbol}>$</Text>
            <TextInput
              style={styles.mainInput}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.1)"
              keyboardType="decimal-pad"
              value={dollarAmount}
              onChangeText={setDollarAmount}
              autoFocus
            />
          </View>
          <Text style={styles.shareEstimation}>
            ≈ {shares.toFixed(2)} shares @ {Math.round((orderType === 'limit' ? parseFloat(limitPrice) : currentPrice) * 100)}¢
          </Text>
        </View>

        {/* Quick Amounts */}
        <View style={styles.quickAmountRow}>
          {['10', '25', '50', '100', '250'].map(amt => (
            <TouchableOpacity key={amt} style={styles.amtChip} onPress={() => setDollarAmount(amt)}>
              <Text style={styles.amtChipText}>${amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Limit Price Input */}
        {orderType === 'limit' && (
          <View style={styles.limitInputRow}>
            <Text style={styles.limitLabel}>Limit Price</Text>
            <View style={styles.limitInputWrapper}>
              <TextInput
                style={styles.limitInput}
                value={limitPrice}
                onChangeText={setLimitPrice}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        )}

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Max Return</Text>
            <Text style={styles.summaryValue}>${potentialReturn.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Potential Profit</Text>
            <Text style={[styles.summaryValue, { color: '#00C896' }]}>
              +${potentialProfit.toFixed(2)} ({profitPercent}%)
            </Text>
          </View>
        </View>

        {/* Balance & Button */}
        <View style={styles.footer}>
          <Text style={styles.balanceText}>
            Available: <Text style={styles.balanceValue}>$142.80 pUSD</Text>
          </Text>
          <TouchableOpacity 
            style={[
              styles.confirmBtn, 
              { backgroundColor: side === 'YES' ? '#00C896' : '#FF2D55' },
              (!dollarAmount || orderStatus === 'loading') && { opacity: 0.5 }
            ]}
            onPress={handleConfirmOrder}
            disabled={!dollarAmount || orderStatus === 'loading'}
          >
            {orderStatus === 'loading' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>Confirm Buy {side}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <BottomSheet isVisible={isVisible} onClose={onClose} snapPoints={['85%', '95%']}>
      {renderContent()}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeBtn: { width: 40, height: 40, justifyContent: 'center' },
  sideBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  sideBadgeText: { fontFamily: 'Manrope-ExtraBold', fontSize: 16 },
  headerPrice: { fontFamily: 'Inter-Bold', fontSize: 16, color: '#fff' },
  marketQuestion: { fontFamily: 'Inter-Medium', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20, marginBottom: 4 },
  marketEnds: { fontFamily: 'Inter-Regular', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 24 },
  toggleRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 32 },
  toggleBtn: { flex: 1, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  toggleBtnActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  toggleText: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  toggleTextActive: { color: '#fff' },
  inputSection: { alignItems: 'center', marginBottom: 24 },
  dollarInputRow: { flexDirection: 'row', alignItems: 'center' },
  dollarSymbol: { fontFamily: 'Manrope-ExtraBold', fontSize: 36, color: '#fff', marginRight: 8 },
  mainInput: { fontFamily: 'Manrope-ExtraBold', fontSize: 36, color: '#fff', minWidth: 100 },
  shareEstimation: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 8 },
  quickAmountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  amtChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  amtChipText: { fontFamily: 'Inter-Medium', fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  limitInputRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  limitLabel: { fontFamily: 'Inter-Regular', fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  limitInputWrapper: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, width: 100 },
  limitInput: { fontFamily: 'Inter-Bold', fontSize: 15, color: '#fff', textAlign: 'right' },
  summaryCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, gap: 12, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  summaryValue: { fontFamily: 'Inter-Bold', fontSize: 13, color: '#fff' },
  footer: { marginTop: 'auto', gap: 16 },
  balanceText: { fontFamily: 'Inter-Regular', fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  balanceValue: { color: '#fff', fontFamily: 'Inter-Bold' },
  confirmBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { fontFamily: 'Manrope-ExtraBold', fontSize: 16, color: '#fff' },
  successState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  successTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 20, color: '#fff', marginTop: 24, marginBottom: 12 },
  orderIdPill: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 40 },
  orderIdText: { fontFamily: 'Inter-Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  doneBtn: { width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  doneBtnText: { fontFamily: 'Manrope-ExtraBold', fontSize: 16, color: '#fff' },
});

