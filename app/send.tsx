import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAccount, useBalance } from 'wagmi';
import { Address, parseEther } from 'viem';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { addActivity } from '@/utils/activity';

const { width } = Dimensions.get('window');

export default function SendScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { address } = useAccount();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: balance } = useBalance({ 
    address, 
    chainId: 16661 // 0G Mainnet
  });

  const handleSend = async () => {
    if (!recipient || !amount) return;
    setIsSending(true);
    setStatus('sending');
    
    try {
      // Mocking the send transaction for UI demonstration
      // In a real app, this would use useSendTransaction from wagmi
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await addActivity({
        title: `Sent ${amount} ${balance?.symbol || 'ETH'}`,
        type: 'send'
      });

      setStatus('success');
      setTimeout(() => router.back(), 2000);
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || 'Transaction failed');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#050505' }]}>
      <LinearGradient
        colors={['rgba(177, 87, 251, 0.1)', 'transparent']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Send Assets</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Recipient Card */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>To Recipient</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.addressInput}
                  placeholder="0x... or ENS name"
                  placeholderTextColor="rgba(255,255,255,0.1)"
                  value={recipient}
                  onChangeText={setRecipient}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity style={styles.scanBtn}>
                  <Ionicons name="scan-outline" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Amount Card */}
            <Animated.View entering={FadeInDown.delay(200)} style={[styles.card, { marginTop: 12 }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>Amount</Text>
                <Text style={styles.balanceText}>Available: {balance?.formatted.slice(0, 8) || '0.00'} {balance?.symbol}</Text>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.1)"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />
                <View style={styles.tokenTag}>
                  <Text style={styles.tokenTagText}>{balance?.symbol || 'ETH'}</Text>
                </View>
              </View>
            </Animated.View>

            {/* Transaction Info */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.infoBox}>
               <View style={styles.infoRow}>
                 <Text style={styles.infoLabel}>Estimated Fee</Text>
                 <Text style={styles.infoValue}>0.0001 {balance?.symbol || 'ETH'}</Text>
               </View>
               <View style={styles.infoRow}>
                 <Text style={styles.infoLabel}>Network</Text>
                 <Text style={styles.infoValue}>0G Mainnet</Text>
               </View>
            </Animated.View>

            {status === 'success' && (
              <Animated.View entering={FadeIn} style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                <Text style={styles.successText}>Transfer Successful!</Text>
              </Animated.View>
            )}

            {status === 'error' && (
              <Animated.View entering={FadeIn} style={styles.errorBox}>
                <Ionicons name="alert-circle" size={24} color="#FF3B30" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </Animated.View>
            )}
          </ScrollView>

          {/* Action Button */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
             <Button
                onPress={handleSend}
                loading={status === 'sending'}
                disabled={!recipient || !amount || status === 'sending'}
                variant="primary"
                size="large"
                style={{ width: '100%' }}
             >
               {status === 'sending' ? 'Broadcasting...' : 'Confirm Send'}
             </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15 
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 18, color: '#fff' },
  content: { padding: 20 },
  card: { 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 32, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.06)' 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  cardLabel: { fontFamily: 'Manrope-Bold', fontSize: 14, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 },
  balanceText: { fontFamily: 'Inter-Medium', fontSize: 13, color: 'rgba(255,255,255,0.3)' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addressInput: { fontFamily: 'Inter-Medium', fontSize: 18, color: '#fff', flex: 1 },
  amountInput: { fontFamily: 'Manrope-ExtraBold', fontSize: 36, color: '#fff', flex: 1 },
  scanBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  tokenTag: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  tokenTagText: { fontFamily: 'Manrope-Bold', fontSize: 14, color: '#fff' },
  infoBox: { marginTop: 24, padding: 20, gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontFamily: 'Inter-Regular', fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  infoValue: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#fff' },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, padding: 16, backgroundColor: 'rgba(52, 199, 89, 0.1)', borderRadius: 16 },
  successText: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#34C759' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, padding: 16, backgroundColor: 'rgba(255, 59, 48, 0.1)', borderRadius: 16 },
  errorText: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#FF3B30' },
  footer: { paddingHorizontal: 20, paddingTop: 10 },
});
