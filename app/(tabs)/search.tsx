import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import Animated, { 
  FadeIn, 
  FadeOut,
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  interpolateColor,
  FadeInDown
} from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { Skeleton } from '@/components/ui/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// API Constants
const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com';

export default function SearchScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State
  const [activeMarket, setActiveMarket] = useState<'crypto' | 'predictions' | 'logs'>('crypto');
  const [searchQuery, setSearchQuery] = useState('');
  const [cryptoCategory, setCryptoCategory] = useState('All');
  const [predictionCategory, setPredictionCategory] = useState('All');
  const [cryptoData, setCryptoData] = useState<any[]>([]);
  const [predictionData, setPredictionData] = useState<any[]>([]);
  const [logsData, setLogsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const focusAnim = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);

  const fetchLogs = async () => {
    try {
      const { API_URL } = require('@/constants/Config');
      const res = await fetch(`${API_URL}/activity`);
      const json = await res.json();
      if (json.success) setLogsData(json.data);
    } catch (error) {
      console.error('Logs fetch error:', error);
    }
  };

  const fetchCryptoMarkets = async () => {
    try {
      setIsLoading(true);
      // Fetch top volume pairs for Base and Ethereum
      const res = await fetch('https://api.dexscreener.com/latest/dex/search?q=base%20eth');
      const json = await res.json();
      
      if (!json.pairs) throw new Error('No pairs found');

      // Sort by volume to get the "big stuff"
      const sorted = json.pairs
        .filter((p: any) => p.baseToken && (p.chainId === 'base' || p.chainId === 'ethereum'))
        .sort((a: any, b: any) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
        .slice(0, 50);

      const mapped = sorted.map((p: any) => ({
        id: p.baseToken.address,
        tokenAddress: p.baseToken.address,
        symbol: p.baseToken.symbol,
        name: p.baseToken.name,
        priceUSD: p.priceUsd || '0',
        volume24h: p.volume?.h24?.toString() || '0',
        priceChange24h: p.priceChange?.h24?.toFixed(2) || '0',
        chain: p.chainId === 'base' ? 'Base' : 'Ethereum',
        chainId: p.chainId === 'base' ? 8453 : 1,
        category: 'Tokens',
        // Use DexScreener imageUrl if available, otherwise fallback to llama.fi
        logoUrl: p.info?.imageUrl || `https://tokens.llama.fi/token/${p.chainId === 'base' ? 'base' : 'ethereum'}/${p.baseToken.address}`,
        tokenDayData: Array(12).fill(0).map((_, i) => ({ 
          priceUSD: (parseFloat(p.priceUsd || '0') * (1 + (Math.random() * 0.1 - 0.05))).toString() 
        }))
      }));

      setCryptoData(mapped);
    } catch (error) {
      console.error('Crypto market fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPolymarketMarkets = async (tag = '') => {
    try {
      const url = `${POLYMARKET_GAMMA_API}/markets?limit=30&active=true&closed=false&order=volume&ascending=false${tag !== 'All' ? `&tag=${tag.toLowerCase()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setPredictionData(data);
    } catch (error) {
      console.error('Polymarket fetch error:', error);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      fetchCryptoMarkets(), 
      fetchPolymarketMarkets(),
      fetchLogs()
    ]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const filteredCrypto = useMemo(() => {
    let filtered = cryptoData;
    
    // Category filtering
    if (cryptoCategory !== 'All') {
      filtered = filtered.filter(t => {
        if (cryptoCategory === 'Stable') return ['USDC', 'USDT', 'DAI', 'LUSD', 'FRAX'].includes(t.symbol);
        if (cryptoCategory === 'Defi') return t.category === 'DeFi' || t.category === 'DEX';
        if (cryptoCategory === 'Layer 2') return t.chain === 'Base' || t.chain === 'Arbitrum';
        return true;
      });
    }

    // Search filtering
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [cryptoData, searchQuery, cryptoCategory]);

  const filteredPredictions = useMemo(() => {
    return predictionData.filter(m => 
      m.question.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [predictionData, searchQuery]);

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focusAnim.value, [0, 1], ['rgba(255,255,255,0.06)', theme.primary]),
    backgroundColor: interpolateColor(focusAnim.value, [0, 1], ['rgba(255,255,255,0.03)', 'rgba(255,255,255,0.06)']),
  }));

  const renderSparkline = (dayData: any[]) => {
    if (!dayData || dayData.length < 2) return null;
    const prices = dayData.map(d => parseFloat(d.priceUSD)).reverse();
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const positive = prices[prices.length - 1] >= prices[0];

    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * 70;
      const y = 30 - ((p - min) / range) * 24 - 3;
      return `${x},${y}`;
    }).join(' ');

    return (
      <Svg width="70" height="30">
        <Polyline points={points} fill="none" stroke={positive ? '#34C759' : '#FF3B30'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  };

  const renderCryptoItem = ({ item, index }: { item: any, index: number }) => {
    // Calculate a mock volume strength for the bar
    const volVal = parseFloat(item.volume24h || '0');
    const volStrength = Math.min((volVal / 5000000) * 100, 100); // Scale 5M vol to 100%

    return (
      <Animated.View entering={FadeInDown.delay(index * 40)}>
        <TouchableOpacity 
          style={styles.premiumCard} 
          onPress={() => router.push({
            pathname: `/token/${item.tokenAddress}`,
            params: { 
              logoUrl: item.logoUrl,
              symbol: item.symbol,
              name: item.name,
              chainId: item.chainId
            }
          })}
        >
          <View style={styles.cardMain}>
            <View style={styles.tokenBrand}>
              <View style={styles.logoWrapper}>
                <Image source={{ uri: item.logoUrl }} style={styles.tokenLogo} contentFit="contain" placeholder={item.symbol[0]} />
                <View style={[styles.chainBadge, { backgroundColor: item.chain === 'Base' ? '#0052FF' : '#627EEA' }]}>
                  <Text style={styles.chainBadgeText}>{item.chain[0]}</Text>
                </View>
              </View>
              <View style={styles.tokenMeta}>
                <Text style={styles.tokenNameText} numberOfLines={1}>{item.name}</Text>
                <View style={styles.volTrackSmall}>
                  <View style={[styles.volFillSmall, { width: `${volStrength}%`, backgroundColor: theme.primary }]} />
                </View>
              </View>
            </View>
            <View style={styles.chartCol}>{renderSparkline(item.tokenDayData)}</View>
            <View style={styles.priceCol}>
              <Text style={styles.priceValueText}>
                {(() => {
                  const val = parseFloat(item.priceUSD || '0');
                  if (val < 0.0001) return `$${val.toFixed(8)}`;
                  if (val < 1) return `$${val.toFixed(4)}`;
                  return `$${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                })()}
              </Text>
              <Text style={[styles.changeText, { color: parseFloat(item.priceChange24h) >= 0 ? '#34C759' : '#FF3B30' }]}>
                {parseFloat(item.priceChange24h) >= 0 ? '+' : ''}{item.priceChange24h}%
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderPredictionItem = ({ item, index }: { item: any, index: number }) => {
    const yesProb = Math.round((item.outcomePrices?.[0] || 0) * 100);
    const probColor = yesProb > 60 ? '#34C759' : yesProb < 40 ? '#FF3B30' : '#F59E0B';
    return (
      <Animated.View entering={FadeInDown.delay(index * 40)}>
        <TouchableOpacity style={styles.premiumCard} onPress={() => router.push(`/market/${item.slug}`)}>
          <View style={styles.predContainer}>
            <View style={styles.predHeader}>
               <View style={styles.marketTag}><Text style={styles.marketTagText}>{item.tags?.[0] || 'Market'}</Text></View>
               <Text style={styles.predVolText}>${(parseFloat(item.volume || '0') / 1000000).toFixed(1)}M Vol</Text>
            </View>
            <Text style={styles.predTitle} numberOfLines={2}>{item.question}</Text>
            <View style={styles.probRow}>
              <View style={styles.probInfo}>
                <Text style={[styles.probVal, { color: probColor }]}>{yesProb}%</Text>
                <Text style={styles.probSub}>Chance of YES</Text>
              </View>
              <View style={styles.probTrack}>
                <View style={[styles.probFill, { width: `${yesProb}%`, backgroundColor: probColor }]} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderLogItem = ({ item, index }: { item: any, index: number }) => {
    const isTrade = item.type === 'trade';
    const date = new Date(item.timestamp || item.date);
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 40)}>
        <View style={styles.premiumCard}>
          <View style={styles.logHeader}>
            <View style={[styles.logIcon, { backgroundColor: isTrade ? 'rgba(52, 199, 89, 0.1)' : 'rgba(177, 87, 251, 0.1)' }]}>
              <Ionicons name={isTrade ? "swap-horizontal" : "search"} size={14} color={isTrade ? '#34C759' : '#b157fb'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>{isTrade ? 'Trade Executed' : 'Research Ready'}</Text>
              <Text style={styles.logDate}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.walletAddress?.slice(0, 6)}...{item.walletAddress?.slice(-4)}</Text>
            </View>
            {isTrade && <Text style={styles.logAmount}>${Number(item.amountUsd || 0).toFixed(2)}</Text>}
          </View>
          <Text style={styles.logDesc} numberOfLines={2}>
            {isTrade 
              ? `Swapped ${item.amountIn} ${item.symbolIn} for ${item.symbolOut} on ${item.chain || 'Base'}`
              : `Deep analysis completed for: ${item.title || 'Market Discovery'}`}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#050505' }]}>
      <StatusBar style="light" />
      <LinearGradient colors={['rgba(177, 87, 251, 0.08)', 'transparent', 'transparent']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
           <View style={styles.logoRow}>
             <Image 
               source={require('@/assets/logo/logo.png')} 
               style={styles.logo}
               contentFit="contain"
             />
             <Text style={styles.discoverTitle}>Discover</Text>
           </View>
           <TouchableOpacity onPress={onRefresh} style={styles.iconBtn}>
             {isRefreshing ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="reload" size={20} color="#fff" />}
           </TouchableOpacity>
        </View>
        <View style={styles.searchBox}>
          <Animated.View style={[styles.searchContainer, inputAnimatedStyle]}>
            <Ionicons name="search" size={20} color="rgba(255,255,255,0.2)" />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Search markets..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => { setIsFocused(true); focusAnim.value = withTiming(1); }}
              onBlur={() => { setIsFocused(false); focusAnim.value = withTiming(0); }}
            />
          </Animated.View>
        </View>
        <View style={styles.toggleRow}>
           <TouchableOpacity style={[styles.toggleBtn, activeMarket === 'crypto' && styles.activeToggle]} onPress={() => setActiveMarket('crypto')}>
             <Text style={[styles.toggleBtnText, activeMarket === 'crypto' && styles.activeToggleText]}>Crypto</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.toggleBtn, activeMarket === 'predictions' && styles.activeToggle]} onPress={() => setActiveMarket('predictions')}>
             <Text style={[styles.toggleBtnText, activeMarket === 'predictions' && styles.activeToggleText]}>Predictions</Text>
           </TouchableOpacity>
           <TouchableOpacity style={[styles.toggleBtn, activeMarket === 'logs' && styles.activeToggle]} onPress={() => setActiveMarket('logs')}>
             <Text style={[styles.toggleBtnText, activeMarket === 'logs' && styles.activeToggleText]}>Logs</Text>
           </TouchableOpacity>
        </View>
        <View style={styles.catsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsScroll}>
            {(activeMarket === 'crypto' ? ['All', 'Defi', 'Stable', 'Layer 2'] : ['All', 'Politics', 'Sports', 'Crypto']).map(cat => (
              <TouchableOpacity 
                key={cat}
                style={[styles.catPill, (activeMarket === 'crypto' ? cryptoCategory : predictionCategory) === cat && { backgroundColor: theme.primary }]}
                onPress={() => activeMarket === 'crypto' ? setCryptoCategory(cat) : (setPredictionCategory(cat), fetchPolymarketMarkets(cat))}
              >
                <Text style={styles.catPillText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <FlatList
          data={activeMarket === 'crypto' ? filteredCrypto : (activeMarket === 'predictions' ? filteredPredictions : logsData)}
          keyExtractor={item => item.id || item.slug || item._id}
          renderItem={activeMarket === 'crypto' ? renderCryptoItem : (activeMarket === 'predictions' ? renderPredictionItem : renderLogItem)}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#fff" />}
          ListEmptyComponent={
            isLoading ? (
              <View style={{ padding: 20 }}>
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} width="100%" height={90} borderRadius={24} style={{ marginBottom: 12 }} />)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.05)" /><Text style={styles.emptyText}>No matches found</Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10, marginBottom: 20 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 32, height: 32 },
  discoverTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 28, color: '#fff' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  searchBox: { paddingHorizontal: 24, marginBottom: 20 },
  searchContainer: { height: 56, borderRadius: 28, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  input: { flex: 1, fontFamily: 'Inter-Medium', fontSize: 16, color: '#fff' },
  toggleRow: { flexDirection: 'row', paddingHorizontal: 24, gap: 8, marginBottom: 20 },
  toggleBtn: { flex: 1, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  activeToggle: { backgroundColor: 'rgba(177, 87, 251, 0.1)', borderColor: 'rgba(177, 87, 251, 0.3)' },
  toggleBtnText: { fontFamily: 'Manrope-Bold', fontSize: 14, color: 'rgba(255,255,255,0.3)' },
  activeToggleText: { color: '#b157fb' },
  catsRow: { marginBottom: 24 },
  catsScroll: { paddingHorizontal: 24, gap: 10 },
  catPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  catPillText: { fontFamily: 'Inter-Bold', fontSize: 12, color: '#fff' },
  listContent: { paddingHorizontal: 24 },
  premiumCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tokenBrand: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  logoWrapper: { width: 44, height: 44, position: 'relative' },
  tokenLogo: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)' },
  chainBadge: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#050505', justifyContent: 'center', alignItems: 'center' },
  chainBadgeText: { color: '#fff', fontSize: 8, fontFamily: 'Manrope-ExtraBold' },
  tokenMeta: { flex: 1 },
  tokenNameText: { fontFamily: 'Manrope-Bold', fontSize: 15, color: '#fff' },
  tokenSymbolText: { fontFamily: 'Inter-Medium', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  chartCol: { width: 70, alignItems: 'center' },
  priceCol: { alignItems: 'flex-end', minWidth: 80 },
  priceValueText: { fontFamily: 'Inter-Bold', fontSize: 15, color: '#fff' },
  changeText: { fontFamily: 'Inter-Bold', fontSize: 11, marginTop: 4 },
  predContainer: { gap: 10 },
  predHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  marketTag: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  marketTagText: { fontFamily: 'Inter-Bold', fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
  predVolText: { fontFamily: 'Inter-Medium', fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  predTitle: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff', lineHeight: 22 },
  probRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  probInfo: { minWidth: 80 },
  probVal: { fontFamily: 'Inter-ExtraBold', fontSize: 20 },
  probSub: { fontFamily: 'Inter-Regular', fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  probTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
  probFill: { height: '100%', borderRadius: 3 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontFamily: 'Inter-Medium', fontSize: 15, color: 'rgba(255,255,255,0.2)', marginTop: 16 },
  volTrackSmall: { height: 3, width: 60, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  volFillSmall: { height: '100%', borderRadius: 2 },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  logIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logTitle: { fontFamily: 'Manrope-Bold', fontSize: 14, color: '#fff' },
  logDate: { fontFamily: 'Inter-Medium', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  logAmount: { fontFamily: 'Inter-Bold', fontSize: 14, color: '#fff' },
  logDesc: { fontFamily: 'Inter-Medium', fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 18 }
});

