import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  Dimensions,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  runOnJS
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter, Stack } from 'expo-router';
import { useAccount, useBalance } from 'wagmi';
import { API_URL } from '@/constants/Config';

const { width } = Dimensions.get('window');

const STRATEGIES = [
  { id: 'DCA', name: 'DCA', desc: 'Dollar Cost Averaging', icon: 'trending-up-outline' },
  { id: 'Momentum', name: 'Momentum', desc: 'Trend Following', icon: 'flash-outline' },
  { id: 'Arbitrage', name: 'Arbitrage', desc: 'Cross-DEX Arbitrage', icon: 'swap-horizontal-outline' },
  { id: 'AI Free Form', name: 'AI Free Form', desc: 'Natural Language Strategy', icon: 'brain-outline' },
];

const AVATAR_COLORS = ['#b157fb', '#FF3B30', '#00C896', '#FF9500', '#5856D6', '#AF52DE'];

export default function NewAgentScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [strategy, setStrategy] = useState('');
  const [freeFormPrompt, setFreeFormPrompt] = useState('');
  const [funding, setFunding] = useState('');
  const [riskLevel, setRiskLevel] = useState(5);
  const [maxPositionPct, setMaxPositionPct] = useState(10);
  const [tradingPairs, setTradingPairs] = useState(['ETH/USDC', 'BTC/USDC']);

  // Animation
  const slideOffset = useSharedValue(0);

  const animatedSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(-slideOffset.value * width) }],
  }));

  const nextStep = () => {
    if (step < 3) {
      setStep(s => s + 1);
      slideOffset.value = step;
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(s => s - 1);
      slideOffset.value = step - 2;
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!address || !name || !strategy || !funding) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          name,
          strategy,
          avatarColor,
          config: {
            initialFunding: parseFloat(funding),
            riskLevel,
            maxPositionPct,
            tradingPairs,
            freeFormPrompt: strategy === 'AI Free Form' ? freeFormPrompt : null
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        router.replace('/(tabs)/agents');
      }
    } catch (error) {
      console.error('Create agent error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Agent</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressLine}>
          <Animated.View style={[styles.progressFill, { width: `${(step / 3) * 100}%`, backgroundColor: theme.primary }]} />
        </View>
        <View style={styles.stepDots}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.dot, step >= i && { backgroundColor: theme.primary }, step === i && styles.activeDot]} />
          ))}
        </View>
      </View>

      <Animated.View style={[styles.slideContainer, animatedSlideStyle]}>
        {/* Step 1: Identity */}
        <View style={styles.stepPage}>
          <ScrollView contentContainerStyle={styles.stepContent}>
            <Text style={styles.sectionTitle}>Agent Identity</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Agent Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Alpha Hunter"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={name}
                onChangeText={setName}
              />
              <Text style={styles.helperText}>Give your agent a unique name</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Agent Avatar</Text>
              <View style={styles.colorRow}>
                {AVATAR_COLORS.map(c => (
                  <TouchableOpacity 
                    key={c} 
                    onPress={() => setAvatarColor(c)}
                    style={[styles.colorCircle, { backgroundColor: c }, avatarColor === c && styles.activeColor]}
                  >
                    {avatarColor === c && <Ionicons name="checkmark" size={16} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.previewContainer}>
              <Text style={styles.label}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={[styles.avatarLarge, { backgroundColor: avatarColor }]}>
                  <Text style={styles.avatarLargeText}>{name ? name[0].toUpperCase() : '?'}</Text>
                </View>
                <Text style={styles.previewName}>{name || 'Agent Name'}</Text>
              </View>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: theme.primary }, !name && styles.disabledBtn]}
              onPress={nextStep}
              disabled={!name}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 2: Strategy */}
        <View style={styles.stepPage}>
          <ScrollView contentContainerStyle={styles.stepContent}>
            <Text style={styles.sectionTitle}>Select Strategy</Text>
            
            <View style={styles.strategyGrid}>
              {STRATEGIES.map(item => (
                <TouchableOpacity 
                  key={item.id}
                  style={[styles.strategyCard, strategy === item.id && { borderColor: theme.primary, backgroundColor: 'rgba(255,255,255,0.05)' }]}
                  onPress={() => setStrategy(item.id)}
                >
                  <Ionicons name={item.icon as any} size={28} color={strategy === item.id ? theme.primary : 'rgba(255,255,255,0.4)'} />
                  <Text style={[styles.strategyName, strategy === item.id && { color: theme.primary }]}>{item.name}</Text>
                  <Text style={styles.strategyDesc}>{item.desc}</Text>
                  {strategy === item.id && (
                    <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {strategy === 'AI Free Form' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Describe your strategy</Text>
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="e.g. Buy ETH when volatility is low and BTC is pumping..."
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  multiline
                  numberOfLines={4}
                  value={freeFormPrompt}
                  onChangeText={setFreeFormPrompt}
                />
              </View>
            )}
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: theme.primary }, !strategy && styles.disabledBtn]}
              onPress={nextStep}
              disabled={!strategy}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 3: Config */}
        <View style={styles.stepPage}>
          <ScrollView contentContainerStyle={styles.stepContent}>
            <Text style={styles.sectionTitle}>Configuration</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fund Agent Wallet (USDC)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="numeric"
                value={funding}
                onChangeText={setFunding}
              />
              <Text style={styles.helperText}>Available: {balance ? parseFloat(balance.formatted).toFixed(2) : '0.00'} USDC</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Risk Level: {riskLevel}/10</Text>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack} />
                <View style={[styles.sliderFill, { width: `${riskLevel * 10}%`, backgroundColor: theme.primary }]} />
                <View style={[styles.sliderThumb, { left: `${riskLevel * 10}%`, borderColor: theme.primary }]} />
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ width: '100%', height: 40 }}
                  onScroll={(e) => setRiskLevel(Math.round(e.nativeEvent.contentOffset.x / (width - 40) * 10))}
                  scrollEventThrottle={16}
                >
                  <View style={{ width: (width - 40) * 2 }} />
                </ScrollView>
              </View>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>Review</Text>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Name</Text>
                <Text style={styles.reviewValue}>{name}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Strategy</Text>
                <Text style={styles.reviewValue}>{strategy}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Initial Funding</Text>
                <Text style={styles.reviewValue}>{funding} USDC</Text>
              </View>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: theme.primary }, (!funding || isSubmitting) && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={!funding || isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create Agent</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, height: 60 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Syne_700Bold', fontSize: 18, color: '#fff' },
  progressContainer: { paddingHorizontal: 24, paddingVertical: 10 },
  progressLine: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%' },
  stepDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
  activeDot: { width: 24 },
  slideContainer: { flexDirection: 'row', width: width * 3, flex: 1 },
  stepPage: { width: width, flex: 1 },
  stepContent: { padding: 24 },
  sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, color: '#fff', marginBottom: 32 },
  inputGroup: { marginBottom: 32 },
  label: { fontFamily: 'Syne_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
  input: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 18, color: '#fff', fontFamily: 'Syne_400Regular', fontSize: 16 },
  multilineInput: { height: 120, textAlignVertical: 'top' },
  helperText: { fontFamily: 'KHTeka', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  activeColor: { borderWidth: 2, borderColor: '#fff' },
  previewContainer: { marginTop: 16 },
  previewCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)' },
  avatarLarge: { width: 80, height: 80, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarLargeText: { color: '#fff', fontFamily: 'Syne_700Bold', fontSize: 32 },
  previewName: { fontFamily: 'Syne_700Bold', fontSize: 20, color: '#fff' },
  strategyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  strategyCard: { width: (width - 60) / 2, padding: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 12, position: 'relative' },
  strategyName: { fontFamily: 'Syne_700Bold', fontSize: 16, color: '#fff' },
  strategyDesc: { fontFamily: 'KHTeka', fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 18 },
  checkBadge: { position: 'absolute', top: 12, right: 12, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  sliderContainer: { height: 40, justifyContent: 'center', position: 'relative' },
  sliderTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 },
  sliderFill: { height: 4, position: 'absolute', borderRadius: 2 },
  sliderThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#0A0A0A', borderWidth: 4, position: 'absolute', marginLeft: -10 },
  reviewCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 24, marginTop: 24 },
  reviewTitle: { fontFamily: 'Syne_700Bold', fontSize: 18, color: '#fff', marginBottom: 20 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  reviewLabel: { fontFamily: 'KHTeka', fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  reviewValue: { fontFamily: 'Syne_600SemiBold', fontSize: 14, color: '#fff' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  primaryBtn: { height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { fontFamily: 'Syne_700Bold', fontSize: 18, color: '#fff' },
  disabledBtn: { opacity: 0.5 }
});
