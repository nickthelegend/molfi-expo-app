import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AIResearchBox } from '@/components/token/AIResearchBox';
import Svg, { Polyline, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Skeleton } from '@/components/ui/Skeleton';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const UNISWAP_V3_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';

function StatPill({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function TokenDetail() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const router = useRouter();

  const [token, setToken] = useState<any>(null);
  const [dayData, setDayData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(UNISWAP_V3_SUBGRAPH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            {
              token(id: "${id}") {
                id
                symbol
                name
                decimals
                totalValueLockedUSD
                tokenDayData(first: 30, orderBy: date, orderDirection: desc) {
                  date
                  priceUSD
                  volumeUSD
                }
              }
            }
          `
        })
      });
      const json = await response.json();
      if (json.data?.token) {
        setToken(json.data.token);
        setDayData(json.data.token.tokenDayData || []);
      }
    } catch (error) {
      console.error('Token detail fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = useMemo(() => {
    if (!dayData.length) return [];
    return dayData.map(d => parseFloat(d.priceUSD)).reverse();
  }, [dayData]);

  const renderChart = () => {
    if (chartData.length < 2) return <View style={styles.chartPlaceholder} />;

    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const range = max - min || 0.1;
    
    const points = chartData.map((p, i) => {
      const x = (i / (chartData.length - 1)) * (width - 40);
      const y = 200 - ((p - min) / range) * 160 - 20;
      return `${x},${y}`;
    }).join(' ');

    const positive = chartData[chartData.length - 1] >= chartData[0];
    const color = positive ? '#00C896' : theme.primary;

    return (
      <View style={styles.chartContainer}>
        <Svg width={width - 40} height="200">
          <Polyline points={points} fill="none" stroke={color} strokeWidth="2.5" />
        </Svg>
      </View>
    );
  };

  if (isLoading && !token) {
    return (
      <View style={[styles.container, { backgroundColor: '#0A0A0A', justifyContent: 'center' }]}>
        <ActivityIndicator color={theme.primary} size="large" />
      </View>
    );
  }

  const currentPrice = parseFloat(dayData[0]?.priceUSD || '0');
  const prevPrice = parseFloat(dayData[1]?.priceUSD || '0');
  const priceChange = prevPrice ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0A0A0A' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="share-outline" size={20} color="#A0A0A0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="star-outline" size={20} color="#A0A0A0" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Animated.View entering={FadeIn} style={styles.chartWrapper}>
          {renderChart()}
        </Animated.View>

        <View style={styles.tokenInfoSection}>
          <View style={styles.tokenNameRow}>
            <View style={[styles.tokenIcon, { backgroundColor: `${theme.primary}22` }]}>
              <Text style={styles.tokenIconText}>{token?.symbol?.[0]}</Text>
            </View>
            <View style={styles.tokenNameContainer}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.tokenName}>{token?.name}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#2196F3" />
                </View>
              </View>
              <Text style={styles.tokenTicker}>{token?.symbol}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>${currentPrice < 1 ? currentPrice.toFixed(6) : currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
              <Text style={[styles.priceChange, { color: priceChange >= 0 ? '#00C896' : theme.primary }]}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatPill label="TVL" value={`$${(parseFloat(token?.totalValueLockedUSD || '0') / 1000000).toFixed(1)}M`} />
            <StatPill label="24h Vol" value={`$${(parseFloat(dayData[0]?.volumeUSD || '0') / 1000000).toFixed(1)}M`} />
            <StatPill label="Network" value="Ethereum" />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="globe-outline" size={20} color="#A0A0A0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="paper-plane-outline" size={20} color="#A0A0A0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-twitter" size={20} color="#A0A0A0" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.getButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push({ pathname: '/token/swap', params: { tokenId: id } })}
            >
              <Text style={styles.getButtonText}>Trade</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            {token?.name} ({token?.symbol}) is a decentralized asset tracked on the Uniswap v3 protocol. 
            Molfi's AI agents analyze liquidity depth and volume trends to provide real-time execution insights.
          </Text>
        </View>

        <AIResearchBox />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, height: 60 },
  backButton: { padding: 4 },
  headerActions: { flexDirection: 'row', gap: 16 },
  headerIconButton: { padding: 4 },
  chartWrapper: { paddingHorizontal: 20, marginTop: 10 },
  chartContainer: { height: 200, justifyContent: 'center' },
  chartPlaceholder: { height: 200, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16 },
  tokenInfoSection: { paddingHorizontal: 20, marginTop: 24 },
  tokenNameRow: { flexDirection: 'row', alignItems: 'center' },
  tokenIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tokenIconText: { color: '#fff', fontFamily: 'Syne_700Bold', fontSize: 24 },
  tokenNameContainer: { flex: 1, marginLeft: 16 },
  titleWithBadge: { flexDirection: 'row', alignItems: 'center' },
  tokenName: { fontFamily: 'Syne_700Bold', fontSize: 20, color: '#fff' },
  verifiedBadge: { marginLeft: 6 },
  tokenTicker: { fontFamily: 'Syne_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  priceContainer: { alignItems: 'flex-end' },
  price: { fontFamily: 'DMMono_400Regular', fontSize: 18, color: '#fff' },
  priceChange: { fontFamily: 'DMMono_400Regular', fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 24, flexWrap: 'wrap' },
  statPill: { flex: 1, minWidth: (width - 64) / 3, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statLabel: { fontFamily: 'KHTeka', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 },
  statValue: { fontFamily: 'DM Mono', fontSize: 13, color: '#fff' },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 32, gap: 12 },
  socialButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center' },
  getButton: { flex: 1, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  getButtonText: { fontFamily: 'Syne_700Bold', color: '#fff', fontSize: 16 },
  description: { fontFamily: 'KHTeka', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20, marginTop: 24 },
});
