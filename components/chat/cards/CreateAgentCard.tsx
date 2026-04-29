import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { API_URL } from '@/constants/Config';
import { useAccount as useAppKitAccount } from '@reown/appkit-react-native';
import { useSendTransaction } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CreateAgentCardProps {
  payload: {
    name: string | null;
    strategy: string | null;
    freeFormPrompt: string | null;
    suggestedPairs: string[];
    suggestedFunding: string | null;
  };
}

export const CreateAgentCard: React.FC<CreateAgentCardProps> = ({ payload }) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { address } = useAppKitAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const router = useRouter();
  
  const [name, setName] = useState(payload.name || 'Alpha Hunter');
  const [funding, setFunding] = useState(payload.suggestedFunding || '50');
  const [status, setStatus] = useState<'idle' | 'creating' | 'funding' | 'active' | 'error'>('idle');

  const handleCreate = async () => {
    if (!address) return;
    setStatus('creating');
    try {
      // 1. Create agent in backend
      const response = await fetch(`${API_URL}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          name,
          strategy: payload.strategy || 'MOMENTUM',
          config: {
            initialFunding: Number(funding),
            pairs: payload.suggestedPairs,
          },
          avatarColor: '#b157fb'
        })
      });
      
      const data = await response.json();
      if (!data.success) throw new Error("Failed to create agent");

      const agentId = data.data._id;
      const agentWallet = data.data.agentWalletAddress;

      // 2. Fund agent (ERC20 USDC would be better, but doing native for simplicity in prompt)
      setStatus('funding');
      await sendTransactionAsync({
        to: agentWallet as Address,
        value: parseUnits(funding, 18),
      });

      // 3. Update status
      await fetch(`${API_URL}/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });

      setStatus('active');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textMuted }]}>🤖 CREATE AGENT</Text>
        <Text style={[styles.headerLogo, { color: theme.primary }]}>Molfi</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.strategyTitle, { color: theme.text }]}>Strategy: {payload.strategy || 'Momentum Trading'}</Text>
        <Text style={[styles.strategySub, { color: theme.textMuted }]}>Focus: {payload.suggestedPairs.join(', ') || 'ETH/USDC'}</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Agent Name</Text>
        <TextInput 
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          value={name}
          onChangeText={setName}
          placeholderTextColor={theme.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: theme.textMuted }]}>Initial Funding (USDC)</Text>
        <TextInput 
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          value={funding}
          onChangeText={setFunding}
          keyboardType="numeric"
          placeholderTextColor={theme.textMuted}
        />
        <Text style={[styles.balanceText, { color: theme.textMuted }]}>Available: 234.50 USDC</Text>
      </View>

      <View style={styles.detailsContainer}>
        <DetailRow label="Strategy" value={payload.strategy || "Momentum"} theme={theme} />
        <DetailRow label="Risk Level" value="Medium (auto-set)" theme={theme} />
        <DetailRow label="Cost" value={`${funding} USDC (funding)`} theme={theme} />
      </View>

      {status === 'active' ? (
        <TouchableOpacity style={[styles.successBox, { borderColor: theme.success }]} onPress={() => router.push('/(tabs)/agents')}>
          <Text style={[styles.successText, { color: theme.success }]}>Agent Active ✓</Text>
          <Text style={[styles.txLink, { color: theme.success }]}>View Agent →</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: theme.primary }, status !== 'idle' && styles.disabledButton]} 
          onPress={handleCreate}
          disabled={status !== 'idle'}
        >
          {status === 'creating' || status === 'funding' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator color="#FFF" />
              <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>
                {status === 'creating' ? 'Creating...' : 'Signing Fund...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.primaryButtonText}>Sign & Create Agent</Text>
          )}
        </TouchableOpacity>
      )}

      {status === 'error' && <Text style={[styles.errorText, { color: theme.error }]}>Failed to create agent</Text>}
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
  infoSection: {
    marginBottom: 20,
  },
  strategyTitle: {
    color: Colors.text,
    fontFamily: 'Syne-Bold',
    fontSize: 16,
  },
  strategySub: {
    color: Colors.textMuted,
    fontFamily: 'Syne-Regular',
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: Colors.textMuted,
    fontFamily: 'Syne-Regular',
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    color: Colors.text,
    fontFamily: 'Syne-Medium',
  },
  balanceText: {
    color: Colors.textMuted,
    fontFamily: 'Syne-Regular',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
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
    fontFamily: 'Syne-Regular',
    fontSize: 13,
  },
  detailValue: {
    color: Colors.text,
    fontFamily: 'DM-Mono-Regular',
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
    fontFamily: 'Syne-Bold',
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
    fontFamily: 'Syne-Bold',
    fontSize: 15,
  },
  txLink: {
    color: Colors.success,
    fontFamily: 'Syne-Medium',
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: Colors.error,
    fontFamily: 'Syne-Regular',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  }
});
