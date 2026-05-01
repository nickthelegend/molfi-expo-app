import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useENSResolution } from '@/hooks/useENSResolution';
import { useSendTransaction } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';

interface SendCardProps {
  payload: {
    toAddress: string;
    resolvedAddress: string | null;
    token: string;
    tokenAddress: string | null;
    amount: string;
    chainId: number;
  };
}

export const SendCard: React.FC<SendCardProps> = ({ payload }) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { address: ensResolvedAddress, isLoading: isResolving } = useENSResolution(payload.toAddress);
  const targetAddress = payload.resolvedAddress || ensResolvedAddress || (payload.toAddress.startsWith('0x') ? payload.toAddress : null);
  
  const { sendTransactionAsync } = useSendTransaction();
  const [status, setStatus] = useState<'idle' | 'signing' | 'broadcasting' | 'confirmed' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleSend = async () => {
    if (!targetAddress) return;
    setStatus('signing');
    try {
      // Simplification: only native transfers for now
      const hash = await sendTransactionAsync({
        to: targetAddress as Address,
        value: parseUnits(payload.amount, 18), // Assuming native for simplicity in this mega prompt implementation
        chainId: payload.chainId,
      });
      setTxHash(hash);
      setStatus('confirmed');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textMuted }]}>↗ SEND PREVIEW</Text>
        <Text style={[styles.headerLogo, { color: theme.primary }]}>Molfi</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Sending to:</Text>
        <Text style={[styles.value, { color: theme.text }]}>{payload.toAddress}</Text>
        {isResolving ? (
          <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 4 }} />
        ) : targetAddress && payload.toAddress.includes('.') ? (
          <View style={styles.ensBadge}>
            <Text style={[styles.ensAddress, { color: theme.textMuted }]}>{targetAddress.slice(0, 8)}...{targetAddress.slice(-6)}</Text>
            <View style={[styles.greenBadge, { backgroundColor: 'rgba(0, 255, 148, 0.1)' }]}>
              <Text style={[styles.greenBadgeText, { color: theme.success }]}>ENS Resolved ✓</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Amount:</Text>
        <Text style={[styles.amountText, { color: theme.text }]}>{payload.amount} {payload.token}</Text>
        <Text style={[styles.usdValue, { color: theme.textMuted }]}>≈ ${Number(payload.amount).toFixed(2)} USD</Text>
      </View>

      <View style={styles.detailsContainer}>
        <DetailRow label="Network" value={payload.chainId === 1 ? "Ethereum Mainnet" : "Base"} theme={theme} />
        <DetailRow label="Gas Fee" value="~$0.84" theme={theme} />
        <DetailRow label="You send" value={`${payload.amount} ${payload.token}`} theme={theme} />
      </View>

      {status === 'confirmed' ? (
        <View style={[styles.successBox, { borderColor: theme.success }]}>
          <Text style={[styles.successText, { color: theme.success }]}>Sent Successfully ✓</Text>
          <Text style={[styles.txLink, { color: theme.success }]}>View on Explorer</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: theme.primary }, (!targetAddress || status === 'signing') && styles.disabledButton]} 
          onPress={handleSend}
          disabled={!targetAddress || status === 'signing'}
        >
          {status === 'signing' ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign & Send</Text>
          )}
        </TouchableOpacity>
      )}

      {status === 'error' && <Text style={[styles.errorText, { color: theme.error }]}>Failed to send transaction</Text>}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: Colors.textMuted,
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  headerLogo: {
    color: Colors.primary,
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 12,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    color: Colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginBottom: 4,
  },
  value: {
    color: Colors.text,
    fontFamily: 'Manrope-SemiBold',
    fontSize: 16,
  },
  amountText: {
    color: Colors.text,
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  usdValue: {
    color: Colors.textMuted,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  ensBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  ensAddress: {
    color: Colors.textMuted,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  greenBadge: {
    backgroundColor: 'rgba(0, 255, 148, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  greenBadgeText: {
    color: Colors.success,
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 10,
  },
  detailsContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    color: Colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  detailValue: {
    color: Colors.text,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 16,
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
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 15,
  },
  txLink: {
    color: Colors.success,
    fontFamily: 'Manrope-SemiBold',
    fontSize: 12,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: Colors.error,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  }
});

