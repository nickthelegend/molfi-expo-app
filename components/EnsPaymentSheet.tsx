import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EnsPaymentSheetProps {
  isVisible: boolean;
  fullDomain: string;
  agentWalletAddress: string;
  durationYears: number;
  priceEth: string;
  ethUsdPrice: number;
  onConfirm: () => void;
  onSkip: () => void;
  onClose: () => void;
}

function Row({ label, value, isGreen }: { label: string; value: string; isGreen?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, isGreen && { color: '#00FF94' }]}>{value}</Text>
    </View>
  );
}

export function EnsPaymentSheet({
  isVisible,
  fullDomain,
  agentWalletAddress,
  durationYears,
  priceEth,
  ethUsdPrice,
  onConfirm,
  onSkip,
  onClose
}: EnsPaymentSheetProps) {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const priceUsd = parseFloat(priceEth) * ethUsdPrice;
  const isGasOnly = priceEth === '0';

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(SCREEN_HEIGHT * 0.45, { damping: 15, stiffness: 100 });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isVisible]);

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: isVisible ? 'auto' : 'none',
  }));

  if (!isVisible && translateY.value === SCREEN_HEIGHT) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <Pressable style={flex1} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, animatedSheetStyle]}>
        <View style={styles.handle} />
        
        <View style={styles.header}>
          <View>
            <Text style={styles.sheetTitle}>Register ENS Subdomain</Text>
            <Text style={styles.sheetDomain}>{fullDomain}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>

        <View style={styles.priceCard}>
          <Row label="Registration" value={isGasOnly ? 'FREE' : `${priceEth} ETH`} isGreen={isGasOnly} />
          {!isGasOnly && <Row label="≈ USD" value={`$${priceUsd.toFixed(2)}`} />}
          <Row label="Duration" value={`${durationYears} year${durationYears > 1 ? 's' : ''}`} />
          <Row label="Gas" value="Estimated on send" />
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.infoText}>
            This subdomain will be owned by your agent's wallet:
          </Text>
          <Text style={styles.addressText}>
            {agentWalletAddress.slice(0, 8)}...{agentWalletAddress.slice(-6)}
          </Text>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
          <Text style={styles.confirmBtnText}>
            {isGasOnly ? 'Register (Gas Only)' : `Pay ${priceEth} ETH & Register`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipBtnText}>Skip — Create Agent Without ENS</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const flex1 = { flex: 1 };

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: '#0D0D0D',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  closeIcon: { padding: 4 },
  sheetTitle: { fontFamily: 'Manrope-Bold', fontSize: 18, color: '#FFFFFF', marginBottom: 4 },
  sheetDomain: { fontFamily: 'Manrope-ExtraBold', fontSize: 24, color: '#00FF94' },
  priceCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    padding: 16, marginBottom: 24, gap: 12
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  rowValue: { fontFamily: 'Inter-Bold', fontSize: 14, color: '#FFFFFF' },
  infoBlock: { marginBottom: 32 },
  infoText: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 20 },
  addressText: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#00FF94', marginTop: 8 },
  confirmBtn: {
    backgroundColor: '#00FF94', borderRadius: 28,
    height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 12
  },
  confirmBtnText: { fontFamily: 'Manrope-ExtraBold', fontSize: 16, color: '#000000' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipBtnText: { fontFamily: 'Inter-Regular', fontSize: 14, color: 'rgba(255,255,255,0.3)' },
});



