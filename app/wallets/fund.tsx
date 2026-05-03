import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSendTransaction, useWaitForTransactionReceipt, useBalance, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FundWalletScreen() {
  const { address: targetAddress, name } = useLocalSearchParams<{ address: string, name: string }>();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { address: userAddress } = useAccount();

  const [amount, setAmount] = useState('');
  const { data: balance } = useBalance({ address: userAddress });
  
  const { data: hash, sendTransaction, isPending, error } = useSendTransaction();
  
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      Alert.alert("Success", "Funds sent to agentic wallet successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }
  }, [isSuccess]);

  const handleSend = () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (Number(amount) > Number(balance?.formatted || 0)) {
      Alert.alert("Error", "Insufficient balance");
      return;
    }

    sendTransaction({
      to: targetAddress as `0x${string}`,
      value: parseEther(amount),
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Fund Agent</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.agentInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name?.charAt(0)}</Text>
          </View>
          <Text style={styles.agentName}>{name}</Text>
          <Text style={styles.agentAddress}>{targetAddress}</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Amount (ETH)</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              placeholderTextColor="rgba(255,255,255,0.2)"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
            <Text style={styles.currency}>ETH</Text>
          </View>
          <Text style={styles.balance}>
            Available: {balance?.formatted?.slice(0, 6)} {balance?.symbol}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.sendBtn, { backgroundColor: theme.primary }]}
          onPress={handleSend}
          disabled={isPending || isWaiting}
        >
          {isPending || isWaiting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.sendBtnText}>Confirm Transfer</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        {(error || hash) && (
          <View style={styles.statusBox}>
            {error && <Text style={styles.errorText}>Error: {error.message}</Text>}
            {hash && <Text style={styles.hashText}>Tx: {hash.slice(0, 20)}...</Text>}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontFamily: 'Manrope-Bold', fontSize: 18, color: '#fff' },
  content: { flex: 1, padding: 24, alignItems: 'center' },
  agentInfo: { alignItems: 'center', marginBottom: 40 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatarText: { fontFamily: 'Manrope-Bold', fontSize: 24, color: '#fff' },
  agentName: { fontFamily: 'Manrope-Bold', fontSize: 20, color: '#fff', marginBottom: 4 },
  agentAddress: { fontFamily: 'SpaceMono-Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  inputSection: { width: '100%', marginBottom: 40 },
  label: { fontFamily: 'Inter-Medium', fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 12 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 12 },
  input: { flex: 1, fontFamily: 'Manrope-Bold', fontSize: 40, color: '#fff' },
  currency: { fontFamily: 'Manrope-Bold', fontSize: 20, color: 'rgba(255,255,255,0.4)', marginLeft: 12 },
  balance: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 12 },
  sendBtn: { width: '100%', height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  sendBtnText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },
  statusBox: { marginTop: 24, padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, width: '100%' },
  errorText: { color: '#FF3B30', fontSize: 12, textAlign: 'center' },
  hashText: { color: '#00FF94', fontSize: 12, textAlign: 'center', fontFamily: 'SpaceMono-Regular' }
});
