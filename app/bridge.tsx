import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAccount, useBalance } from 'wagmi';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';

const { width } = Dimensions.get('window');

const CHAINS = [
  { id: '16661', name: '0G Mainnet', symbol: '0G', color: '#b157fb' },
  { id: '1', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { id: '137', name: 'Polygon', symbol: 'POL', color: '#8247E5' },
];

export default function BridgeScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [fromChain, setFromChain] = useState(CHAINS[1]); // Ethereum
  const [toChain, setToChain] = useState(CHAINS[0]);   // 0G
  const [isBridging, setIsBridging] = useState(false);

  const { data: balance } = useBalance({ 
    address, 
    chainId: parseInt(fromChain.id)
  });

  const handleBridge = async () => {
    if (!amount) return;
    setIsBridging(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsBridging(false);
    router.back();
  };

  const switchChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
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
            <Text style={styles.headerTitle}>Bridge Assets</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* From Chain */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
              <Text style={styles.cardLabel}>From</Text>
              <TouchableOpacity style={styles.chainSelector}>
                 <View style={[styles.chainIcon, { backgroundColor: fromChain.color }]}>
                   <Text style={styles.chainIconText}>{fromChain.symbol[0]}</Text>
                 </View>
                 <View style={{ flex: 1 }}>
                   <Text style={styles.chainName}>{fromChain.name}</Text>
                   <Text style={styles.balanceText}>Balance: {balance?.formatted.slice(0, 8) || '0.00'}</Text>
                 </View>
                 <Ionicons name="chevron-down" size={18} color="#666" />
              </TouchableOpacity>
              
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.1)"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </Animated.View>

            {/* Switch */}
            <View style={styles.switchWrapper}>
              <TouchableOpacity style={styles.switchBtn} onPress={switchChains}>
                <Ionicons name="swap-vertical" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {/* To Chain */}
            <Animated.View entering={FadeInDown.delay(200)} style={[styles.card, { marginTop: -20 }]}>
              <Text style={styles.cardLabel}>To</Text>
              <TouchableOpacity style={styles.chainSelector}>
                 <View style={[styles.chainIcon, { backgroundColor: toChain.color }]}>
                   <Text style={styles.chainIconText}>{toChain.symbol[0]}</Text>
                 </View>
                 <View style={{ flex: 1 }}>
                   <Text style={styles.chainName}>{toChain.name}</Text>
                   <Text style={styles.balanceText}>Estimated Arrival: ~5 mins</Text>
                 </View>
                 <Ionicons name="chevron-down" size={18} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.receiveBox}>
                <Text style={styles.receiveLabel}>You will receive</Text>
                <Text style={styles.receiveAmount}>{amount || '0.00'} {fromChain.symbol}</Text>
              </View>
            </Animated.View>

            {/* Info */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bridge Fee</Text>
                <Text style={styles.infoValue}>0.001 ETH</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gas (Estimated)</Text>
                <Text style={styles.infoValue}>$4.20</Text>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Action Button */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
             <Button
                onPress={handleBridge}
                loading={isBridging}
                disabled={!amount || isBridging}
                variant="primary"
                size="large"
                style={{ width: '100%' }}
             >
               {isBridging ? 'Initiating Bridge...' : 'Bridge Assets'}
             </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 18, color: '#fff' },
  content: { padding: 20 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardLabel: { fontFamily: 'Manrope-Bold', fontSize: 12, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  chainSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 12, gap: 12, marginBottom: 20 },
  chainIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  chainIconText: { color: '#fff', fontSize: 16, fontFamily: 'Manrope-ExtraBold' },
  chainName: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },
  balanceText: { fontFamily: 'Inter-Medium', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  amountInput: { fontFamily: 'Manrope-ExtraBold', fontSize: 36, color: '#fff' },
  switchWrapper: { alignItems: 'center', zIndex: 10 },
  switchBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#050505', elevation: 5 },
  receiveBox: { marginTop: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  receiveLabel: { fontFamily: 'Inter-Regular', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 4 },
  receiveAmount: { fontFamily: 'Manrope-Bold', fontSize: 20, color: '#fff' },
  infoContainer: { marginTop: 24, paddingHorizontal: 10, gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoLabel: { fontFamily: 'Inter-Regular', fontSize: 14, color: 'rgba(255,255,255,0.3)' },
  infoValue: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#fff' },
  footer: { paddingHorizontal: 20, paddingTop: 10 }
});
