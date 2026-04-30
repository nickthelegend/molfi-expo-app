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
import { useAccount as useAppKitAccount } from '@reown/appkit-react-native';
import { useBalance, useEnsName } from 'wagmi';
import { API_URL } from '@/constants/Config';
import { useRouter, Stack } from 'expo-router';
import { useEnsSubdomain } from '@/hooks/useEnsSubdomain';
import { EnsPaymentSheet } from '@/components/EnsPaymentSheet';
import { useDebounce } from 'use-debounce';

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
  const { address } = useAppKitAccount();
  const { data: balance } = useBalance({ address: address as `0x${string}` });
  const { data: userEns } = useEnsName({ address: address as `0x${string}`, chainId: 1 });
  const { checkAvailability, registerSubdomain } = useEnsSubdomain();

  const ensParent = userEns ? userEns.replace('.eth', '') : null;

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingText, setLoadingText] = useState('Provisioning Agent...');

  // Form State
  const [name, setName] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [agentEnsSub, setAgentEnsSub] = useState('');
  const [ensSubError, setEnsSubError] = useState('');
  const [marketType, setMarketType] = useState<'tokens' | 'prediction'>('tokens');
  const [strategy, setStrategy] = useState('');
  const [freeFormPrompt, setFreeFormPrompt] = useState('');
  const [funding, setFunding] = useState('');
  const [riskLevel, setRiskLevel] = useState(5);
  const [maxPositionPct, setMaxPositionPct] = useState(10);
  const [tradingPairs, setTradingPairs] = useState(['ETH/USDC', 'BTC/USDC']);
  const [predictionTopics, setPredictionTopics] = useState(['Crypto', 'Politics']);

  // ENS Payment State
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [ensAvailable, setEnsAvailable] = useState<boolean | null>(null);
  const [checkingEns, setCheckingEns] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(1);

  const fullEnsDomain = ensParent && agentEnsSub ? `${agentEnsSub}.${ensParent}.eth` : null;
  const [debouncedDomain] = useDebounce(fullEnsDomain, 600);

  // Animation
  const slideOffset = useSharedValue(0);
  const cursorOpacity = useSharedValue(0);

  const animatedSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(-slideOffset.value * width) }],
  }));

  const animatedCursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  React.useEffect(() => {
    if (isSubmitting) {
      cursorOpacity.value = withTiming(1, { duration: 500 }, (finished) => {
        if (finished) {
          cursorOpacity.value = withTiming(0, { duration: 500 });
        }
      });
      const interval = setInterval(() => {
        cursorOpacity.value = withTiming(1, { duration: 500 }, (finished) => {
          if (finished) {
            cursorOpacity.value = withTiming(0, { duration: 500 });
          }
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isSubmitting]);

  React.useEffect(() => {
    if (debouncedDomain) {
      setCheckingEns(true);
      checkAvailability(debouncedDomain)
        .then(setEnsAvailable)
        .finally(() => setCheckingEns(false));
    } else {
      setEnsAvailable(null);
    }
  }, [debouncedDomain, checkAvailability]);

  const validateEnsSub = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setAgentEnsSub(slug);
    if (slug.length > 0 && slug.length < 3) setEnsSubError('Min 3 characters');
    else if (slug.startsWith('-') || slug.endsWith('-')) setEnsSubError('No leading/trailing hyphens');
    else if (slug.length > 32) setEnsSubError('Max 32 characters');
    else setEnsSubError('');
  };

  const nextStep = () => {
    if (step === 3 && !agentEnsSub) {
      // Skip ENS payment step if no subdomain entered
      handleSubmit();
      return;
    }
    if (step < 4) {
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

  const handleEnsPayAndCreateAgent = async () => {
    if (!address || !name || !strategy || !funding) return;
    
    setIsSubmitting(true);
    setLoadingText('Initializing OWS Wallet...');
    
    try {
      // STEP 1: Call API to create agent wallet via OWS
      const initRes = await fetch(`${API_URL}/agents/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          name,
          avatarColor,
        })
      });
      const initJson = await initRes.json();
      if (!initJson.success) throw new Error(initJson.error || 'Initialization failed');
      
      const { agentId, agentWalletAddress } = initJson;

      // STEP 2: Register ENS subdomain on-chain (user signs)
      setLoadingText('Awaiting ENS Signature...');
      const { txHash, success } = await registerSubdomain(
        fullEnsDomain!,
        agentWalletAddress,
        selectedDuration
      );

      if (!success) throw new Error('ENS registration transaction failed');

      // STEP 3: Finalize agent with ENS metadata
      setLoadingText('Finalizing Identity...');
      const finalizeRes = await fetch(`${API_URL}/agents/${agentId}/finalize`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ensSubdomain: fullEnsDomain,
          ensTxHash: txHash,
          market: marketType,
          strategy,
          funding: parseFloat(funding),
          riskLevel,
          tradingPairs,
          freeFormPrompt: strategy === 'AI Free Form' ? freeFormPrompt : null
        })
      });

      const finalizeJson = await finalizeRes.json();
      if (finalizeJson.success) {
        setLoadingText('Agent Live!');
        setTimeout(() => router.replace('/(tabs)/agents'), 1000);
      } else {
        throw new Error(finalizeJson.error || 'Finalization failed');
      }

    } catch (error: any) {
      console.error('ENS Create agent error:', error);
      alert(error.message || 'An error occurred during creation.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!address || !name || !strategy || !funding) return;
    
    setIsSubmitting(true);
    setLoadingText('Initializing OWS Wallet...');
    
    try {
      // One-step creation (no ENS registration)
      const res = await fetch(`${API_URL}/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          name,
          strategy,
          market: marketType,
          avatarColor,
          createEns: false,
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
        setLoadingText('Agent Live!');
        setTimeout(() => router.replace('/(tabs)/agents'), 1000);
      } else {
        alert('Creation failed: ' + json.error);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Create agent error:', error);
      alert('A network error occurred.');
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
          <Animated.View style={[styles.progressFill, { width: `${(step / 4) * 100}%`, backgroundColor: theme.primary }]} />
        </View>
        <View style={styles.stepDots}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={[styles.dot, step >= i && { backgroundColor: theme.primary }, step === i && styles.activeDot]} />
          ))}
        </View>
      </View>

      <Animated.View style={[styles.slideContainer, animatedSlideStyle, { width: width * 4 }]}>
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
                {fullEnsDomain && <Text style={styles.previewEns}>{fullEnsDomain}</Text>}
              </View>
            </View>

            {ensParent && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ENS Subdomain <Text style={styles.optionalTag}>(optional)</Text></Text>
                <View style={styles.ensInputRow}>
                  <TextInput
                    style={styles.ensSubInput}
                    placeholder="your-agent"
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={agentEnsSub}
                    onChangeText={validateEnsSub}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={32}
                  />
                  <Text style={styles.ensSuffix}>.{ensParent}.eth</Text>
                </View>
                {ensSubError ? <Text style={styles.ensError}>{ensSubError}</Text> : null}
                {checkingEns && <ActivityIndicator size="small" color={theme.primary} style={{ alignSelf: 'flex-start', marginTop: 8 }} />}
                {!checkingEns && ensAvailable === true && <Text style={styles.ensSuccess}>✓ Available</Text>}
                {!checkingEns && ensAvailable === false && <Text style={styles.ensError}>✗ Already taken</Text>}
              </View>
            )}
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
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trading Market</Text>
              <View style={styles.marketToggleRow}>
                <TouchableOpacity 
                  style={[styles.marketToggle, marketType === 'tokens' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => { setMarketType('tokens'); setStrategy(''); }}
                >
                  <Ionicons name="swap-horizontal" size={20} color={marketType === 'tokens' ? '#fff' : 'rgba(255,255,255,0.4)'} />
                  <Text style={[styles.marketToggleText, marketType === 'tokens' && { color: '#fff' }]}>Tokens</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.marketToggle, marketType === 'prediction' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => { setMarketType('prediction'); setStrategy(''); }}
                >
                  <Ionicons name="stats-chart" size={20} color={marketType === 'prediction' ? '#fff' : 'rgba(255,255,255,0.4)'} />
                  <Text style={[styles.marketToggleText, marketType === 'prediction' && { color: '#fff' }]}>Prediction</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.label}>{marketType === 'tokens' ? 'Token Strategies' : 'Prediction Strategies'}</Text>
            <View style={styles.strategyGrid}>
              {(marketType === 'tokens' ? STRATEGIES : [
                { id: 'Market Making', name: 'Market Making', desc: 'Provide Liquidity', icon: 'water-outline' },
                { id: 'Event Arbitrage', name: 'Event Arb', desc: 'Cross-market arb', icon: 'git-compare-outline' },
                { id: 'Sentiment AI', name: 'Sentiment', desc: 'Social Media Analysis', icon: 'chatbubbles-outline' },
                { id: 'AI Free Form', name: 'AI Free Form', desc: 'Custom Logic', icon: 'brain-outline' },
              ]).map(item => (
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

            {marketType === 'tokens' ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Trading Pairs</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ETH/USDC, BTC/USDC"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={tradingPairs.join(', ')}
                  onChangeText={(txt) => setTradingPairs(txt.split(',').map(s => s.trim()))}
                />
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Prediction Topics</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Politics, Crypto, Sports"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={predictionTopics.join(', ')}
                  onChangeText={(txt) => setPredictionTopics(txt.split(',').map(s => s.trim()))}
                />
              </View>
            )}

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
              onPress={nextStep}
              disabled={!funding || isSubmitting}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 4: ENS Payment */}
        <View style={styles.stepPage}>
          <ScrollView contentContainerStyle={styles.stepContent}>
            <Text style={styles.sectionTitle}>ENS Confirmation</Text>
            
            <View style={styles.paymentDomainCard}>
              <Text style={styles.paymentDomainLabel}>Domain to Register</Text>
              <Text style={styles.paymentDomainValue}>{fullEnsDomain}</Text>
              <View style={styles.availabilityRow}>
                {checkingEns ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Text style={[styles.availabilityText, { color: ensAvailable ? '#00FF94' : '#FF3B30' }]}>
                    {ensAvailable ? '✓ Available' : '✗ Taken'}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.paymentInfoBox}>
              <Ionicons name="information-circle-outline" size={20} color="rgba(255,255,255,0.4)" />
              <Text style={styles.paymentInfoText}>
                Registering this subdomain will link it to your agent's wallet. You'll need to sign a transaction in your wallet.
              </Text>
            </View>

            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Registration</Text>
                <Text style={styles.priceValue}>FREE (Gas only)</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Duration</Text>
                <Text style={styles.priceValue}>Permanent</Text>
              </View>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: theme.primary }, (!ensAvailable || isSubmitting) && styles.disabledBtn]}
              onPress={() => setPaymentVisible(true)}
              disabled={!ensAvailable || isSubmitting}
            >
              <Text style={styles.primaryBtnText}>Confirm & Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} style={styles.skipEnsBtn}>
              <Text style={styles.skipEnsText}>Skip ENS, create agent directly</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <EnsPaymentSheet
        isVisible={paymentVisible}
        fullDomain={fullEnsDomain!}
        agentWalletAddress="0x..." // placeholder, handled in flow
        durationYears={selectedDuration}
        priceEth="0"
        ethUsdPrice={2400} // Mock price
        onConfirm={() => {
          setPaymentVisible(false);
          handleEnsPayAndCreateAgent();
        }}
        onSkip={() => {
          setPaymentVisible(false);
          handleSubmit();
        }}
        onClose={() => setPaymentVisible(false)}
      />

      {/* Loading Overlay */}
      {isSubmitting && (
        <Animated.View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingTitle}>SYSTEM PROVISIONING</Text>
            <View style={styles.terminalLine}>
              <Text style={styles.terminalText}>$ {loadingText}</Text>
              <Animated.View style={[styles.cursor, animatedCursorStyle]} />
            </View>
            <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, height: 60 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontFamily: 'Syne-Bold', fontSize: 18, color: '#fff' },
  progressContainer: { paddingHorizontal: 24, paddingVertical: 10 },
  progressLine: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%' },
  stepDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)' },
  activeDot: { width: 24 },
  slideContainer: { flexDirection: 'row', width: width * 4, flex: 1 },
  stepPage: { width: width, flex: 1 },
  stepContent: { padding: 24 },
  sectionTitle: { fontFamily: 'Syne-Bold', fontSize: 24, color: '#fff', marginBottom: 32 },
  inputGroup: { marginBottom: 32 },
  label: { fontFamily: 'Syne-Medium', fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
  input: { backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 18, color: '#fff', fontFamily: 'Syne-Regular', fontSize: 16 },
  multilineInput: { height: 120, textAlignVertical: 'top' },
  helperText: { fontFamily: 'Syne-Regular', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  activeColor: { borderWidth: 2, borderColor: '#fff' },
  previewContainer: { marginTop: 16 },
  previewCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)' },
  avatarLarge: { width: 80, height: 80, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarLargeText: { color: '#fff', fontFamily: 'Syne-Bold', fontSize: 32 },
  previewName: { fontFamily: 'Syne-Bold', fontSize: 20, color: '#fff' },
  marketToggleRow: { flexDirection: 'row', gap: 12 },
  marketToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, paddingVertical: 14, gap: 10 },
  marketToggleText: { fontFamily: 'Syne-Bold', fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  strategyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  strategyCard: { width: (width - 60) / 2, padding: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 12, position: 'relative' },
  strategyName: { fontFamily: 'Syne-Bold', fontSize: 16, color: '#fff' },
  strategyDesc: { fontFamily: 'Syne-Regular', fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 18 },
  checkBadge: { position: 'absolute', top: 12, right: 12, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  sliderContainer: { height: 40, justifyContent: 'center', position: 'relative' },
  sliderTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 },
  sliderFill: { height: 4, position: 'absolute', borderRadius: 2 },
  sliderThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#0A0A0A', borderWidth: 4, position: 'absolute', marginLeft: -10 },
  reviewCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 24, marginTop: 24 },
  reviewTitle: { fontFamily: 'Syne-Bold', fontSize: 18, color: '#fff', marginBottom: 20 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  reviewLabel: { fontFamily: 'Syne-Regular', fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  reviewValue: { fontFamily: 'Syne-Medium', fontSize: 14, color: '#fff' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  primaryBtn: { height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { fontFamily: 'Syne-Bold', fontSize: 18, color: '#fff' },
  disabledBtn: { opacity: 0.5 },
  loadingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(10,10,10,0.95)', 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 1000
  },
  loadingContent: { width: '80%', alignItems: 'center' },
  loadingTitle: { 
    fontFamily: 'Syne-Bold', 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.4)', 
    letterSpacing: 2, 
    marginBottom: 20 
  },
  terminalLine: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,255,148,0.05)', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,255,148,0.2)'
  },
  terminalText: { 
    fontFamily: 'DM-Mono-Regular', 
    fontSize: 16, 
    color: '#00FF94' 
  },
  cursor: { 
    width: 10, 
    height: 20, 
    backgroundColor: '#00FF94', 
    marginLeft: 8 
  },
  previewEns: {
    fontFamily: 'DM-Mono-Regular',
    fontSize: 14,
    color: '#00FF94',
    marginTop: 4
  },
  ensInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingHorizontal: 18,
    height: 60
  },
  ensSubInput: {
    flex: 1,
    color: '#fff',
    fontFamily: 'Syne-Regular',
    fontSize: 16
  },
  ensSuffix: {
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'Syne-Medium',
    fontSize: 16
  },
  ensError: {
    color: '#FF3B30',
    fontFamily: 'Syne-Regular',
    fontSize: 12,
    marginTop: 8
  },
  ensSuccess: {
    color: '#00FF94',
    fontFamily: 'Syne-Regular',
    fontSize: 12,
    marginTop: 8
  },
  optionalTag: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11
  },
  paymentDomainCard: {
    backgroundColor: 'rgba(0,255,148,0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,255,148,0.2)',
    marginBottom: 24
  },
  paymentDomainLabel: {
    fontFamily: 'Syne-Medium',
    fontSize: 12,
    color: 'rgba(0,255,148,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8
  },
  paymentDomainValue: {
    fontFamily: 'Syne-Bold',
    fontSize: 28,
    color: '#fff'
  },
  availabilityRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  availabilityText: {
    fontFamily: 'Syne-Bold',
    fontSize: 14
  },
  paymentInfoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 24
  },
  paymentInfoText: {
    flex: 1,
    fontFamily: 'Syne-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18
  },
  priceBreakdown: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 20,
    padding: 20,
    gap: 16
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  priceLabel: {
    fontFamily: 'Syne-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)'
  },
  priceValue: {
    fontFamily: 'DM-Mono-Regular',
    fontSize: 14,
    color: '#fff'
  },
  skipEnsBtn: {
    marginTop: 16,
    alignItems: 'center'
  },
  skipEnsText: {
    fontFamily: 'Syne-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)'
  }
});
