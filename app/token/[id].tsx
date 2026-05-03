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
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AIResearchBox } from '@/components/token/AIResearchBox';
import { Skeleton } from '@/components/ui/Skeleton';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { ModernLineChart } from '@/components/charts/modern-line-chart';
import { Button } from '@/components/ui/Button';

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
  const { id, logoUrl: initialLogo, symbol: initialSymbol, name: initialName, chainId: initialChainId } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const router = useRouter();

  const [token, setToken] = useState<any>({
    id: id,
    symbol: initialSymbol || 'TOKEN',
    name: initialName || 'Token',
    logoUrl: initialLogo,
    chainId: initialChainId ? Number(initialChainId) : 8453
  });
  const [dayData, setDayData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const isAddress = (id as string).startsWith('0x');

      if (isAddress) {
        // 1. Fetch Price from DefiLlama Coins
        const priceRes = await fetch(`https://coins.llama.fi/prices/current/ethereum:${id},base:${id}`);
        const priceData = await priceRes.json();
        
        const coinKey = priceData.coins[`ethereum:${id}`] ? `ethereum:${id}` : `base:${id}`;
        const priceInfo = priceData.coins[coinKey];

        const yieldsRes = await fetch('https://yields.llama.fi/pools');
        const yieldsData = await yieldsRes.json();
        const pool = yieldsData.data.find((p: any) => 
          p.project === 'uniswap-v3' && 
          p.underlyingTokens.some((t: string) => t.toLowerCase() === (id as string).toLowerCase())
        );

        setToken({
          id: id,
          symbol: priceInfo?.symbol || 'TOKEN',
          name: priceInfo?.name || priceInfo?.symbol || 'Token',
          totalValueLockedUSD: pool?.tvlUsd || 0,
          logoUrl: `https://tokens.llama.fi/token/${coinKey.split(':')[0]}/${id}`
        });

        setDayData([
          { priceUSD: priceInfo?.price?.toString() || '0', volumeUSD: pool?.volumeUsd1d || 0 },
          { priceUSD: ((priceInfo?.price || 0) * 0.95).toString(), volumeUSD: 0 }
        ]);
      } else {
        // Fetch Protocol Data
        const res = await fetch(`https://api.llama.fi/protocol/${id}`);
        const p = await res.json();
        
        setToken({
          id: id,
          symbol: p.symbol || 'PROT',
          name: p.name || 'Protocol',
          totalValueLockedUSD: p.tvl?.[p.tvl.length - 1]?.totalLiquidity || 0,
          logoUrl: p.logo
        });

        setDayData(p.tvl?.slice(-2).map((t: any) => ({
          priceUSD: t.totalLiquidity.toString(),
          volumeUSD: 0
        })) || []);
      }
    } catch (error) {
      console.error('Data fetch error:', error);
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
    if (dayData.length < 2) return <View style={styles.chartPlaceholder} />;

    const chartDataFormatted = dayData.map((d, i) => ({
      x: i === 0 ? 'Now' : i === 1 ? '24h' : '',
      y: parseFloat(d.priceUSD),
      label: i === 0 ? 'Current Price' : 'Previous Price'
    })).reverse();

    const positive = chartDataFormatted[chartDataFormatted.length - 1].y >= chartDataFormatted[0].y;
    const color = positive ? '#00C896' : theme.primary;

    return (
      <View style={styles.chartContainer}>
        <ModernLineChart 
          data={chartDataFormatted}
          height={200}
          color={color}
          hideYAxis
        />
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
              {token?.logoUrl ? (
                <Image source={{ uri: token.logoUrl }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
              ) : (
                <Text style={styles.tokenIconText}>{token?.symbol?.[0]}</Text>
              )}
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
            <Button
              onPress={() => router.push({ 
                pathname: '/swap', 
                params: { 
                  tokenAddress: id, 
                  symbol: token?.symbol,
                  name: token?.name,
                  chainId: token?.chainId
                } 
              })}
              variant="primary"
              size="large"
              style={{ flex: 1, height: 56 }}
              icon="swap-horizontal"
            >
              Trade
            </Button>
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
  tokenIconText: { color: '#fff', fontFamily: 'Manrope-ExtraBold', fontSize: 24 },
  tokenNameContainer: { flex: 1, marginLeft: 16 },
  titleWithBadge: { flexDirection: 'row', alignItems: 'center' },
  tokenName: { fontFamily: 'Manrope-Bold', fontSize: 20, color: '#fff' },
  verifiedBadge: { marginLeft: 6 },
  tokenTicker: { fontFamily: 'Inter-Regular', fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  priceContainer: { alignItems: 'flex-end' },
  price: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#fff' },
  priceChange: { fontFamily: 'Inter-Medium', fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 24, flexWrap: 'wrap' },
  statPill: { flex: 1, minWidth: (width - 64) / 3, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 },
  statValue: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#fff' },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 32, gap: 12 },
  socialButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.05)', justifyContent: 'center', alignItems: 'center' },
  getButton: { flex: 1, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});
