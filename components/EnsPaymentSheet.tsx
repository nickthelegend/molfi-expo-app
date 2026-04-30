import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

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
  const snapPoints = useMemo(() => ['55%'], []);

  const priceUsd = parseFloat(priceEth) * ethUsdPrice;
  const isGasOnly = priceEth === '0';

  if (!isVisible) return null;

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backgroundStyle={styles.sheetBg}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      )}
    >
      <BottomSheetView style={styles.sheetContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.sheetTitle}>Register ENS Subdomain</Text>
            <Text style={styles.sheetDomain}>{fullDomain}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        </View>

        {/* Price breakdown */}
        <View style={styles.priceCard}>
          <Row label="Registration" value={isGasOnly ? 'FREE' : `${priceEth} ETH`} isGreen={isGasOnly} />
          {!isGasOnly && <Row label="≈ USD" value={`$${priceUsd.toFixed(2)}`} />}
          <Row label="Duration" value={`${durationYears} year${durationYears > 1 ? 's' : ''}`} />
          <Row label="Gas" value="Estimated on send" />
        </View>

        {/* What this does */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoText}>
            This subdomain will be owned by your agent's wallet:
          </Text>
          <Text style={styles.addressText}>
            {agentWalletAddress.slice(0, 8)}...{agentWalletAddress.slice(-6)}
          </Text>
        </View>

        {/* CTAs */}
        <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
          <Text style={styles.confirmBtnText}>
            {isGasOnly ? 'Register (Gas Only)' : `Pay ${priceEth} ETH & Register`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipBtnText}>Skip — Create Agent Without ENS</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: { backgroundColor: '#0D0D0D' },
  sheetContent: { padding: 24, flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  closeIcon: { padding: 4 },
  sheetTitle: { fontFamily: 'Syne-Bold', fontSize: 18, color: '#FFFFFF', marginBottom: 4 },
  sheetDomain: { fontFamily: 'Syne-Bold', fontSize: 24, color: '#00FF94' },
  priceCard: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    padding: 16, marginBottom: 24, gap: 12
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontFamily: 'Syne-Regular', fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  rowValue: { fontFamily: 'DM-Mono-Regular', fontSize: 14, color: '#FFFFFF' },
  infoBlock: { marginBottom: 32 },
  infoText: { fontFamily: 'Syne-Regular', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 20 },
  addressText: { fontFamily: 'DM-Mono-Regular', fontSize: 14, color: '#00FF94', marginTop: 8 },
  confirmBtn: {
    backgroundColor: '#00FF94', borderRadius: 28,
    height: 56, justifyContent: 'center', alignItems: 'center', marginBottom: 12
  },
  confirmBtnText: { fontFamily: 'Syne-Bold', fontSize: 16, color: '#000000' },
  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipBtnText: { fontFamily: 'Syne-Regular', fontSize: 14, color: 'rgba(255,255,255,0.3)' },
});
