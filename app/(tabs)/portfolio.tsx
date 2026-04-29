import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  FlatList,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccount, useBalance } from 'wagmi';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const mockHoldings = [
  { id: '1', name: 'Solana', ticker: 'SOL', amount: '0.45', value: '$102.34', change: '+2.45%', positive: true },
  { id: '2', name: 'Ethereum', ticker: 'ETH', amount: '0.12', value: '$398.10', change: '-1.20%', positive: false },
  { id: '3', name: 'Bitcoin', ticker: 'BTC', amount: '0.003', value: '$210.44', change: '+0.87%', positive: true },
  { id: '4', name: '0G Token', ticker: '0G', amount: '1200', value: '$84.00', change: '+5.60%', positive: true },
  { id: '5', name: 'Polygon', ticker: 'MATIC', amount: '540', value: '$54.00', change: '-0.34%', positive: false },
];

interface ActionButtonProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

function ActionButton({ label, icon, onPress }: ActionButtonProps) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.94);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    onPress?.();
  };

  return (
    <View style={styles.actionItem}>
      <TouchableOpacity 
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.actionCircle, animatedStyle]}>
          <Ionicons name={icon} size={24} color="rgba(255,255,255,0.7)" />
        </Animated.View>
      </TouchableOpacity>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

export default function PortfolioScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address,
  });

  const [activeTab, setActiveTab] = useState('Tokens');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data fetch
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const formatAddress = (addr?: string) => {
    if (!addr) return '@molfi_user';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const renderTokenRow = ({ item }: { item: typeof mockHoldings[0] }) => (
    <TouchableOpacity 
      style={styles.tokenCard} 
      onPress={() => router.push(`/token/${item.id}`)}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.tokenLogoPlaceholder, { backgroundColor: `${theme.primary}22` }]}>
          <Text style={styles.logoText}>{item.ticker[0]}</Text>
        </View>
        <View style={styles.tokenInfo}>
          <Text style={styles.tokenName}>{item.name}</Text>
          <Text style={styles.tokenAmount}>{item.amount} {item.ticker}</Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.tokenValue}>{item.value}</Text>
        <Text style={[styles.tokenChange, { color: item.positive ? '#00C896' : '#FF3B30' }]}>
          {item.change}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
      >
        {/* Header Row */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image 
              source={require('@/assets/logo/logo.png')} 
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.headerTitle}>Molfi AI</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.username}>{formatAddress(address)}</Text>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroLabel}>Total Portfolio Value</Text>
          {isBalanceLoading || isLoading ? (
            <Skeleton width={200} height={48} style={{ marginVertical: 8 }} />
          ) : (
            <Text style={styles.heroBalance}>
              ${balance ? (parseFloat(balance.formatted) * 3318).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '12,560.21'}
            </Text>
          )}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>+21.8% ↗</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <ActionButton label="Receive" icon="arrow-down-outline" />
          <ActionButton label="Swap" icon="swap-horizontal-outline" />
          <ActionButton label="Gateway" icon="wallet-outline" />
          <ActionButton label="Send" icon="arrow-up-outline" />
        </View>

        {/* Upsell Banner */}
        <TouchableOpacity 
          style={styles.upsellBanner}
          onPress={() => router.push('/(tabs)/')}
        >
          <View style={[styles.upsellIconCircle, { backgroundColor: `${theme.primary}1F` }]}>
            <Ionicons name="flash-outline" size={22} color={theme.primary} />
          </View>
          <View style={styles.upsellContent}>
            <Text style={styles.upsellTitle}>3x your research speed</Text>
            <Text style={styles.upsellSubtitle}>with even more depth & insights</Text>
          </View>
          <View style={[styles.accentLine, { backgroundColor: theme.primary }]} />
        </TouchableOpacity>

        {/* Asset Tabs */}
        <View style={styles.tabSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
            {['Tokens', 'Collectibles', 'Perps', 'Predictions'].map(tab => (
              <TouchableOpacity 
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Asset List */}
        <View style={styles.assetList}>
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <View key={i} style={styles.tokenCard}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width="30%" height={12} />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Skeleton width={60} height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width={40} height={12} />
                </View>
              </View>
            ))
          ) : (
            mockHoldings.map(item => (
              <React.Fragment key={item.id}>
                {renderTokenRow({ item })}
              </React.Fragment>
            ))
          )}
        </View>
      </ScrollView>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontFamily: 'KHTeka',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroLabel: {
    fontFamily: 'Syne_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  heroBalance: {
    fontFamily: 'Syne_700Bold',
    fontSize: 48,
    color: '#fff',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(0,200,150,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
    color: '#00C896',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontFamily: 'KHTeka',
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  upsellBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 20,
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  upsellIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upsellContent: {
    marginLeft: 16,
    flex: 1,
  },
  upsellTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  upsellSubtitle: {
    fontFamily: 'KHTeka',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 16,
    width: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  tabSection: {
    marginTop: 32,
  },
  tabScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabChipActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabText: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
  },
  tabTextActive: {
    color: '#fff',
  },
  assetList: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  tokenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tokenLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontFamily: 'Syne_700Bold',
    fontSize: 18,
  },
  tokenInfo: {
    marginLeft: 12,
  },
  tokenName: {
    fontFamily: 'Syne_700Bold',
    fontSize: 14,
    color: '#fff',
  },
  tokenAmount: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  tokenValue: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 15,
    color: '#fff',
  },
  tokenChange: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
    marginTop: 4,
  },
});
