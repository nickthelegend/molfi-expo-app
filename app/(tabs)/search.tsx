import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { 
  FadeIn, 
  FadeOut,
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { Skeleton } from '@/components/ui/Skeleton';

const { width } = Dimensions.get('window');

// API Constants
const UNISWAP_V3_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
const POLYMARKET_GAMMA_API = 'https://gamma-api.polymarket.com';

export default function SearchScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // State
  const [activeMarket, setActiveMarket] = useState<'crypto' | 'predictions'>('crypto');
  const [searchQuery, setSearchQuery] = useState('');
  const [cryptoCategory, setCryptoCategory] = useState('All');
  const [predictionCategory, setPredictionCategory] = useState('All');
  const [cryptoData, setCryptoData] = useState<any[]>([]);
  const [predictionData, setPredictionData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const focusAnim = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);

  // Fetch Uniswap Data
  const fetchUniswapTokens = async () => {
    try {
      const response = await fetch(UNISWAP_V3_SUBGRAPH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            {
              tokens(
                first: 20
                orderBy: totalValueLockedUSD
                orderDirection: desc
                where: { totalValueLockedUSD_gt: "1000000" }
              ) {
                id
                symbol
                name
                tokenDayData(first: 7, orderBy: date, orderDirection: desc) {
                  priceUSD
                  volumeUSD
                }
                totalValueLockedUSD
              }
            }
          `
        })
      });
      const json = await response.json();
      if (json.data?.tokens) {
        setCryptoData(json.data.tokens);
      }
    } catch (error) {
      console.error('Uniswap fetch error:', error);
    }
  };

  // Fetch Polymarket Data
  const fetchPolymarketMarkets = async (tag = '') => {
    try {
      const url = `${POLYMARKET_GAMMA_API}/markets?limit=20&active=true&closed=false&order=volume&ascending=false${tag !== 'All' ? `&tag=${tag.toLowerCase()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setPredictionData(data);
    } catch (error) {
      console.error('Polymarket fetch error:', error);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchUniswapTokens(), fetchPolymarketMarkets()]);
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

  // Filtering
  const filteredCrypto = useMemo(() => {
    return cryptoData.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cryptoData, searchQuery]);

  const filteredPredictions = useMemo(() => {
    return predictionData.filter(m => 
      m.question.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [predictionData, searchQuery]);

  // UI Handlers
  const onFocus = () => {
    setIsFocused(true);
    focusAnim.value = withTiming(1, { duration: 250 });
  };

  const onBlur = () => {
    setIsFocused(false);
    focusAnim.value = withTiming(0, { duration: 250 });
  };

  const inputAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      ['rgba(255,255,255,0.08)', `${theme.primary}66`]
    ),
  }));

  // Render Helpers
  const renderSparkline = (dayData: any[]) => {
    if (!dayData || dayData.length < 2) return null;
    const prices = dayData.map(d => parseFloat(d.priceUSD)).reverse();
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const positive = prices[prices.length - 1] >= prices[0];

    const points = prices.map((p, i) => {
      const x = (i / (prices.length - 1)) * 60;
      const y = 24 - ((p - min) / range) * 20 - 2;
      return `${x},${y}`;
    }).join(' ');

    return (
      <Svg width="60" height="24">
        <Polyline points={points} fill="none" stroke={positive ? '#00C896' : theme.primary} strokeWidth="1.5" />
      </Svg>
    );
  };

  const renderCryptoItem = ({ item }: { item: any }) => (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <TouchableOpacity 
        style={styles.marketRow} 
        onPress={() => router.push(`/token/${item.id}`)}
      >
        <View style={styles.rowLeft}>
          <View style={[styles.logoCircle, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            <Text style={styles.logoLetter}>{item.symbol[0]}</Text>
          </View>
          <View style={styles.nameInfo}>
            <Text style={styles.tokenName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.tokenSymbol}>{item.symbol}</Text>
          </View>
        </View>
        
        <View style={styles.sparkCol}>
          {renderSparkline(item.tokenDayData)}
        </View>

        <View style={styles.rowRight}>
          <Text style={styles.priceText}>
            ${parseFloat(item.tokenDayData?.[0]?.priceUSD || '0').toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </Text>
          <View style={[styles.volBadge, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            <Text style={styles.volText}>
              ${(parseFloat(item.tokenDayData?.[0]?.volumeUSD || '0') / 1000000).toFixed(1)}M vol
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderPredictionItem = ({ item }: { item: any }) => {
    const yesProb = Math.round((item.outcomePrices?.[0] || 0) * 100);
    const probColor = yesProb > 60 ? '#00C896' : yesProb < 40 ? theme.primary : '#F59E0B';

    return (
      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <TouchableOpacity 
          style={styles.predictionRow} 
          onPress={() => router.push(`/market/${item.slug}`)}
        >
          <View style={styles.predLeft}>
            <Text style={styles.predQuestion} numberOfLines={2}>{item.question}</Text>
            <View style={styles.predMeta}>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{item.tags?.[0] || 'Market'}</Text>
              </View>
              <Text style={styles.predVol}>${(parseFloat(item.volume || '0') / 1000000).toFixed(1)}M vol</Text>
            </View>
          </View>

          <View style={styles.predRight}>
            <Text style={[styles.probText, { color: probColor }]}>{yesProb}%</Text>
            <View style={styles.probBarContainer}>
              <View style={[styles.probBarFill, { width: `${yesProb}%`, backgroundColor: probColor }]} />
            </View>
            <Text style={styles.yesLabel}>YES</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('@/assets/logo/logo.png')} style={styles.logo} contentFit="contain" />
            <Text style={styles.molfiTitle}>Molfi AI</Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="refresh-outline" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Markets & Predictions</Text>
        </View>

        <View style={styles.searchSection}>
          <Animated.View style={[styles.searchBar, inputAnimatedStyle]}>
            <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.3)" />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Search tokens or predictions..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>

        {/* Market Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.togglePill, activeMarket === 'crypto' && { backgroundColor: `${theme.primary}26`, borderColor: theme.primary }]}
            onPress={() => setActiveMarket('crypto')}
          >
            <Text style={[styles.toggleText, activeMarket === 'crypto' && { color: theme.primary }]}>🪙 Crypto</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.togglePill, activeMarket === 'predictions' && { backgroundColor: `${theme.primary}26`, borderColor: theme.primary }]}
            onPress={() => setActiveMarket('predictions')}
          >
            <Text style={[styles.toggleText, activeMarket === 'predictions' && { color: theme.primary }]}>🎯 Predictions</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {(activeMarket === 'crypto' ? ['All', 'DeFi', 'Layer 1', 'Layer 2', 'Meme'] : ['All', 'Politics', 'Sports', 'Crypto', 'News']).map(cat => (
              <TouchableOpacity 
                key={cat} 
                onPress={() => activeMarket === 'crypto' ? setCryptoCategory(cat) : (setPredictionCategory(cat), fetchPolymarketMarkets(cat))}
                style={[styles.catChip, (activeMarket === 'crypto' ? cryptoCategory : predictionCategory) === cat ? { backgroundColor: theme.primary } : styles.catChipGhost]}
              >
                <Text style={styles.catText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main List */}
        <FlatList
          data={activeMarket === 'crypto' ? filteredCrypto : filteredPredictions}
          keyExtractor={item => item.id || item.slug}
          renderItem={activeMarket === 'crypto' ? renderCryptoItem : renderPredictionItem}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#fff" />}
          contentContainerStyle={[styles.listContent, { paddingBottom: 100 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            isLoading ? (
              <View style={{ padding: 20, gap: 12 }}>
                {Array(6).fill(0).map((_, i) => (
                  <Skeleton key={i} width="100%" height={80} borderRadius={16} />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.1)" />
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            )
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 32, height: 32 },
  molfiTitle: { fontFamily: 'Syne_700Bold', fontSize: 20, color: '#fff' },
  refreshButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  titleSection: { paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontFamily: 'Syne_700Bold', fontSize: 28, color: '#fff' },
  headerSubtitle: { fontFamily: 'KHTeka', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  searchSection: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: { height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  input: { flex: 1, marginLeft: 10, fontFamily: 'KHTeka', color: '#fff', fontSize: 15 },
  toggleContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  togglePill: { flex: 1, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  toggleText: { fontFamily: 'Syne_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  categoryContainer: { marginBottom: 20 },
  categoryScroll: { paddingHorizontal: 20, gap: 8 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  catChipGhost: { backgroundColor: 'rgba(255,255,255,0.05)' },
  catText: { fontFamily: 'DM Mono', fontSize: 12, color: '#fff' },
  listContent: { paddingTop: 10 },
  marketRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', width: '35%' },
  logoCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  logoLetter: { color: '#fff', fontSize: 18, fontFamily: 'Syne_700Bold' },
  nameInfo: { marginLeft: 12, flex: 1 },
  tokenName: { fontFamily: 'Syne_700Bold', fontSize: 14, color: '#fff' },
  tokenSymbol: { fontFamily: 'DM Mono', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },
  sparkCol: { flex: 1, alignItems: 'center' },
  rowRight: { alignItems: 'flex-end', width: '25%' },
  priceText: { fontFamily: 'DM Mono', fontSize: 14, color: '#fff' },
  volBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  volText: { fontFamily: 'DM Mono', fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  predictionRow: { marginHorizontal: 20, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  predLeft: { flex: 1, marginRight: 16 },
  predQuestion: { fontFamily: 'KHTeka', fontSize: 13, color: '#fff', lineHeight: 18 },
  predMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
  tagPill: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontFamily: 'KHTeka', fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  predVol: { fontFamily: 'DM Mono', fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  predRight: { width: 70, alignItems: 'flex-end', justifyContent: 'center' },
  probText: { fontFamily: 'DM Mono', fontSize: 20, fontWeight: '700' },
  probBarContainer: { width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  probBarFill: { height: '100%', borderRadius: 2 },
  yesLabel: { fontFamily: 'KHTeka', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 4 },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontFamily: 'KHTeka', fontSize: 16, color: 'rgba(255,255,255,0.3)', marginTop: 16 }
});
