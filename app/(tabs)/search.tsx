import React, { useState, useMemo, useRef } from 'react';
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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { 
  FadeIn, 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming 
} from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Trending 🔥', 'New Listings', 'DeFi', 'Layer 1', 'Layer 2', 'Meme'];

const allTokens = [
  { id: '1', name: 'Bitcoin', ticker: 'BTC', price: '$70,204', change: '+1.2%', positive: true, spark: [40, 42, 41, 45, 44, 47, 50] },
  { id: '2', name: 'Ethereum', ticker: 'ETH', price: '$3,318', change: '-0.8%', positive: false, spark: [50, 48, 47, 46, 45, 44, 43] },
  { id: '3', name: 'Solana', ticker: 'SOL', price: '$226', change: '+4.2%', positive: true, spark: [30, 33, 31, 36, 38, 40, 44] },
  { id: '4', name: '0G Token', ticker: '0G', price: '$0.07', change: '+8.1%', positive: true, spark: [10, 12, 11, 15, 18, 20, 24] },
  { id: '5', name: 'Polygon', ticker: 'MATIC', price: '$0.10', change: '-2.3%', positive: false, spark: [30, 28, 27, 25, 24, 23, 21] },
  { id: '6', name: 'Arbitrum', ticker: 'ARB', price: '$1.24', change: '+0.5%', positive: true, spark: [20, 21, 20, 22, 21, 23, 22] },
  { id: '7', name: 'Chainlink', ticker: 'LINK', price: '$18.40', change: '+3.1%', positive: true, spark: [15, 17, 16, 18, 19, 21, 22] },
  { id: '8', name: 'Uniswap', ticker: 'UNI', price: '$9.70', change: '-1.1%', positive: false, spark: [25, 24, 23, 22, 23, 21, 20] },
];

function Sparkline({ data, positive, color }: { data: number[], positive: boolean, color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 60;
    const y = 24 - ((val - min) / range) * 20 - 2; // Keep some padding
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={styles.sparklineContainer}>
      <Svg width="60" height="24">
        <Polyline
          points={points}
          fill="none"
          stroke={positive ? '#4CAF50' : '#FF3B30'}
          strokeWidth="1.5"
        />
      </Svg>
    </View>
  );
}

export default function SearchScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);
  const inputRef = useRef<TextInput>(null);

  const filteredTokens = useMemo(() => {
    return allTokens.filter(token => 
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.ticker.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

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
    borderWidth: 1,
  }));

  const renderTrendingCard = ({ item }: { item: typeof allTokens[0] }) => (
    <TouchableOpacity 
      style={styles.trendingCard} 
      onPress={() => router.push(`/token/${item.id}`)}
    >
      <View style={[styles.tokenLogoMini, { backgroundColor: `${theme.primary}22` }]}>
        <Text style={styles.tokenLogoTextMini}>{item.ticker[0]}</Text>
      </View>
      <Text style={styles.trendingTicker}>{item.ticker}</Text>
      <View style={styles.trendingBottom}>
        <Text style={styles.trendingPrice}>{item.price}</Text>
        <Text style={[styles.trendingChange, { color: item.positive ? '#4CAF50' : '#FF3B30' }]}>
          {item.change}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTokenRow = ({ item }: { item: typeof allTokens[0] }) => (
    <Animated.View entering={FadeIn.duration(400)}>
      <TouchableOpacity 
        style={styles.tokenRow} 
        onPress={() => router.push(`/token/${item.id}`)}
      >
        <View style={styles.rowLeft}>
          <View style={[styles.tokenLogo, { backgroundColor: `${theme.primary}22` }]}>
            <Text style={styles.tokenLogoText}>{item.ticker[0]}</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.tokenName}>{item.name}</Text>
            <Text style={styles.tokenTicker}>{item.ticker}</Text>
          </View>
        </View>

        <Sparkline data={item.spark} positive={item.positive} color={theme.primary} />

        <View style={styles.rowRight}>
          <Text style={styles.rowPrice}>{item.price}</Text>
          <Text style={[styles.rowChange, { color: item.positive ? '#4CAF50' : '#FF3B30' }]}>
            {item.change}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image 
              source={require('@/assets/logo/logo.png')} 
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.headerTitle}>Molfi AI</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.subHeader}>
          <Text style={styles.headerTitleMain}>Discover</Text>
          <Text style={styles.headerSubtitle}>Markets & Assets</Text>
        </View>

        <View style={styles.searchSection}>
          <Animated.View style={[styles.searchBar, inputAnimatedStyle]}>
            <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.3)" />
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Search tokens, protocols..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={onFocus}
              onBlur={onBlur}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>

        {!searchQuery && (
          <View style={styles.categoryWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map(cat => (
                <TouchableOpacity 
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  style={[
                    styles.categoryChip,
                    activeCategory === cat ? { 
                      backgroundColor: `${theme.primary}26`, 
                      borderColor: `${theme.primary}4D` 
                    } : styles.categoryChipInactive
                  ]}
                >
                  <Text style={[
                    styles.categoryText,
                    activeCategory === cat ? { color: theme.primary } : { color: 'rgba(255,255,255,0.35)' }
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <FlatList
          data={filteredTokens}
          keyExtractor={item => item.id}
          renderItem={renderTokenRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent, 
            { paddingBottom: 100 + insets.bottom }
          ]}
          ListHeaderComponent={
            !searchQuery ? (
              <View style={styles.trendingSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Trending Now</Text>
                  <TouchableOpacity>
                    <Text style={[styles.viewAll, { color: theme.primary }]}>View All</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  horizontal
                  data={allTokens.slice(0, 4)}
                  renderItem={renderTrendingCard}
                  keyExtractor={item => `trending-${item.id}`}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.trendingScroll}
                />
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>All Assets</Text>
                  <TouchableOpacity style={styles.sortButton}>
                    <Text style={styles.sortText}>Price ↓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>No assets found</Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 20,
    color: '#fff',
  },
  subHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitleMain: {
    fontFamily: 'Syne_700Bold',
    fontSize: 28,
    color: '#fff',
  },
  headerSubtitle: {
    fontFamily: 'KHTeka',
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBar: {
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'KHTeka',
    color: '#fff',
    fontSize: 15,
  },
  categoryWrapper: {
    marginBottom: 20,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipInactive: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'transparent',
  },
  categoryText: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
  },
  trendingSection: {
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  viewAll: {
    fontFamily: 'KHTeka',
    fontSize: 12,
  },
  trendingScroll: {
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  trendingCard: {
    width: 140,
    height: 90,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 12,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  tokenLogoMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenLogoTextMini: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Syne_700Bold',
  },
  trendingTicker: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 13,
    color: '#fff',
    position: 'absolute',
    top: 12,
    left: 52,
  },
  trendingBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  trendingPrice: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  trendingChange: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 10,
  },
  listContent: {
    paddingTop: 10,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '40%',
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenLogoText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Syne_700Bold',
  },
  nameContainer: {
    marginLeft: 12,
  },
  tokenName: {
    fontFamily: 'Syne_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  tokenTicker: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  sparklineContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowRight: {
    alignItems: 'flex-end',
    width: '25%',
  },
  rowPrice: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 14,
    color: '#fff',
  },
  rowChange: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
    marginTop: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontFamily: 'KHTeka',
    fontSize: 16,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 16,
  },
});

const interpolateColor = (val: number, input: number[], output: string[]) => {
  'worklet';
  // Simplified manual interpolation since we can't easily import interpolateColor for hex/rgba in a string template without a proper color library in a worklet
  // But Reanimated provides interpolateColor, so we use the one from reanimated.
  return output[val > 0.5 ? 1 : 0]; // Fallback to simple switch if helper fails
};
