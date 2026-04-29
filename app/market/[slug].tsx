import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import Svg, { Polyline, Defs, LinearGradient as SvgGradient, Stop, Path } from 'react-native-svg';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Skeleton } from '@/components/ui/Skeleton';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BettingSheet } from '@/components/BettingSheet';

const { width } = Dimensions.get('window');

export default function MarketDetailScreen() {
  const { slug } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [market, setMarket] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [orderbook, setOrderbook] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState('1w');
  const [expandedRules, setExpandedRules] = useState(false);
  const [bettingVisible, setBettingVisible] = useState(false);
  const [bettingSide, setBettingSide] = useState<'YES' | 'NO'>('YES');

  const handleOpenBetting = (side: 'YES' | 'NO') => {
    setBettingSide(side);
    setBettingVisible(true);
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch Market
      const mRes = await fetch(`https://gamma-api.polymarket.com/markets?slug=${slug}`);
      const mData = await mRes.json();
      const marketItem = mData[0];
      setMarket(marketItem);

      if (marketItem?.clobTokenIds) {
        // Fetch Orderbook (YES token)
        const bRes = await fetch(`https://clob.polymarket.com/book?token_id=${marketItem.clobTokenIds[0]}`);
        const bData = await bRes.json();
        setOrderbook(bData);

        // Fetch History
        const hRes = await fetch(`https://clob.polymarket.com/prices-history?market=${marketItem.clobTokenIds[0]}&interval=${selectedInterval}&fidelity=60`);
        const hData = await hRes.json();
        setHistory(hData.history || []);
      }
    } catch (error) {
      console.error('Market detail fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [slug, selectedInterval]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  const renderChart = () => {
    if (!history.length) return <View style={styles.chartPlaceholder} />;
    
    const prices = history.map(h => h.p);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 0.1;
    
    const points = history.map((h, i) => {
      const x = (i / (history.length - 1)) * (width - 40);
      const y = 160 - ((h.p - min) / range) * 120 - 20;
      return `${x},${y}`;
    }).join(' ');

    const positive = prices[prices.length - 1] >= prices[0];
    const chartColor = positive ? '#00C896' : theme.primary;

    return (
      <View style={styles.chartContainer}>
        <Svg width={width - 40} height="160">
          <Polyline
            points={points}
            fill="none"
            stroke={chartColor}
            strokeWidth="2"
          />
        </Svg>
        <View style={styles.chartLabels}>
          <Text style={styles.chartLabelText}>0%</Text>
          <Text style={styles.chartLabelText}>100%</Text>
        </View>
      </View>
    );
  };

  if (isLoading && !market) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  const yesProb = Math.round((market?.outcomePrices?.[0] || 0) * 100);
  const noProb = 100 - yesProb;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
        {/* Hero Header */}
        <View style={styles.hero}>
          <Image source={{ uri: market?.image }} style={styles.heroImage} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(10,10,10,0.8)', '#0A0A0A']}
            style={styles.heroOverlay}
          />
          <View style={styles.heroHeader}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Ionicons name="chevron-back-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroQuestion} numberOfLines={3}>{market?.question}</Text>
        </View>

        {/* Probability Card */}
        <Animated.View entering={FadeInDown} style={styles.probCard}>
          <View style={styles.probSplit}>
            <View style={styles.probHalf}>
              <Text style={styles.probLabel}>YES</Text>
              <Text style={[styles.probValue, { color: yesProb >= 50 ? '#00C896' : theme.primary }]}>{yesProb}%</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.probHalf}>
              <Text style={styles.probLabel}>NO</Text>
              <Text style={[styles.probValue, { color: noProb > 50 ? '#00C896' : theme.primary }]}>{noProb}%</Text>
            </View>
          </View>
          <View style={styles.probBar}>
            <View style={[styles.probBarFill, { width: `${yesProb}%`, backgroundColor: '#00C896' }]} />
            <View style={[styles.probBarFill, { width: `${noProb}%`, backgroundColor: theme.primary }]} />
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>{formatCurrency(market?.volume || 0)}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Liquidity</Text>
            <Text style={styles.statValue}>{formatCurrency(market?.liquidity || 0)}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Ends</Text>
            <Text style={styles.statValue}>{market?.endDate ? format(new Date(market.endDate), 'MMM dd, yyyy') : 'TBD'}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Category</Text>
            <Text style={styles.statValue}>{market?.tags?.[0] || 'Market'}</Text>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Price History</Text>
            <View style={styles.intervalRow}>
              {['1D', '1W', '1M', 'MAX'].map(i => (
                <TouchableOpacity key={i} onPress={() => setSelectedInterval(i.toLowerCase())}>
                  <Text style={[styles.intervalText, selectedInterval === i.toLowerCase() && { color: '#fff', borderBottomWidth: 2, borderBottomColor: '#fff' }]}>
                    {i}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {renderChart()}
        </View>

        {/* WebView Embed */}
        <View style={styles.section}>
          <Text style={styles.embedLabel}>Live on Polymarket</Text>
          <View style={styles.webViewContainer}>
            <WebView
              source={{ uri: `https://embed.polymarket.com/market?market=${market?.slug}&theme=dark&height=300` }}
              style={styles.webView}
              scrollEnabled={false}
              backgroundColor="transparent"
            />
          </View>
        </View>

        {/* Rules Section */}
        <TouchableOpacity style={styles.rulesCard} onPress={() => setExpandedRules(!expandedRules)}>
          <View style={styles.rulesHeader}>
            <Text style={styles.rulesTitle}>Market Rules</Text>
            <Ionicons name={expandedRules ? "chevron-up" : "chevron-down"} size={20} color={theme.primary} />
          </View>
          <Text style={styles.rulesText} numberOfLines={expandedRules ? undefined : 4}>
            {market?.description}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky Bottom Trade Bar */}
      <View style={[styles.tradeBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity 
          style={[styles.tradeBtn, styles.yesBtn]}
          onPress={() => handleOpenBetting('YES')}
        >
          <Text style={styles.tradeBtnTextYes}>Buy YES {yesProb}¢</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tradeBtn, styles.noBtn]}
          onPress={() => handleOpenBetting('NO')}
        >
          <Text style={styles.tradeBtnTextNo}>Buy NO {noProb}¢</Text>
        </TouchableOpacity>
      </View>

      <BettingSheet 
        isVisible={bettingVisible}
        onClose={() => setBettingVisible(false)}
        market={market}
        side={bettingSide}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  hero: { height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%' },
  heroHeader: { position: 'absolute', top: 60, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  heroQuestion: { position: 'absolute', bottom: 20, left: 20, right: 20, fontFamily: 'Syne_700Bold', fontSize: 22, color: '#fff', lineHeight: 30 },
  probCard: { margin: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  probSplit: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  probHalf: { flex: 1, alignItems: 'center' },
  divider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  probLabel: { fontFamily: 'KHTeka', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 },
  probValue: { fontFamily: 'Syne_700Bold', fontSize: 40 },
  probBar: { height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },
  probBarFill: { height: '100%' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  statPill: { width: (width - 48) / 2, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statLabel: { fontFamily: 'KHTeka', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 },
  statValue: { fontFamily: 'DM Mono', fontSize: 14, color: '#fff' },
  section: { marginTop: 32, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 16, color: '#fff' },
  intervalRow: { flexDirection: 'row', gap: 16 },
  intervalText: { fontFamily: 'DM Mono', fontSize: 12, color: 'rgba(255,255,255,0.4)', paddingBottom: 4 },
  chartContainer: { height: 160, position: 'relative' },
  chartLabels: { position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'space-between' },
  chartLabelText: { fontFamily: 'DM Mono', fontSize: 10, color: 'rgba(255,255,255,0.2)' },
  embedLabel: { fontFamily: 'KHTeka', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 12 },
  webViewContainer: { height: 300, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  webView: { flex: 1 },
  rulesCard: { margin: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 20 },
  rulesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rulesTitle: { fontFamily: 'Syne_700Bold', fontSize: 14, color: '#fff' },
  rulesText: { fontFamily: 'KHTeka', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  tradeBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 110, backgroundColor: 'rgba(10,10,10,0.8)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', padding: 16, gap: 12 },
  tradeBtn: { flex: 1, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  yesBtn: { backgroundColor: 'rgba(0,200,150,0.1)', borderColor: '#00C896' },
  noBtn: { backgroundColor: 'rgba(255,45,85,0.1)', borderColor: '#FF2D55' },
  tradeBtnTextYes: { fontFamily: 'Syne_700Bold', fontSize: 15, color: '#00C896' },
  tradeBtnTextNo: { fontFamily: 'Syne_700Bold', fontSize: 15, color: '#FF2D55' },
  chartPlaceholder: { height: 160, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16 }
});
