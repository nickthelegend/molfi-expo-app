import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  RefreshControl,
  Share,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccount as useAppKitAccount } from '@reown/appkit-react-native';
import { useBalance, useReadContracts, useEnsName } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'expo-router';
import { API_URL } from '@/constants/Config';
import { BottomSheet } from '@/components/ui/BottomSheet';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';

const { width } = Dimensions.get('window');

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
};

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

  return (
    <View style={styles.actionItem}>
      <TouchableOpacity 
        activeOpacity={1}
        onPressIn={() => (scale.value = withSpring(0.9))}
        onPressOut={() => (scale.value = withSpring(1))}
        onPress={onPress}
      >
        <Animated.View style={[styles.actionCircle, animatedStyle]}>
          <Ionicons name={icon} size={24} color="rgba(255,255,255,0.7)" />
        </Animated.View>
      </TouchableOpacity>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

function AgentWalletRow({ agent, theme }: { agent: any, theme: any }) {
  const { data: balance } = useBalance({ address: agent.agentWalletAddress as `0x${string}` });
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.agentWalletCard}
      onPress={() => router.push(`/agent/${agent._id}`)}
    >
      <View style={styles.agentHeader}>
        <View style={[styles.agentAvatar, { backgroundColor: agent.avatarColor || theme.primary }]}>
          <Text style={styles.agentAvatarText}>{agent.name[0]}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentAddr}>{agent.agentWalletAddress.slice(0,10)}...{agent.agentWalletAddress.slice(-4)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
      </View>
      <View style={styles.agentSummary}>
        <Text style={styles.aumLabel}>On-chain: <Text style={styles.aumValue}>{balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0.0000 ETH'}</Text></Text>
        <Text style={[styles.pnlText, { color: agent.totalPnL >= 0 ? '#00C896' : '#FF3B30' }]}>
          {agent.totalPnL >= 0 ? '+' : ''}{agent.totalPnLPct}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PortfolioScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { address, isConnected } = useAppKitAccount();
  const { data: nativeBalance, isLoading: isNativeLoading, refetch: refetchBalance } = useBalance({ address: address as `0x${string}` });
  const { data: ensName } = useEnsName({ address: address as `0x${string}`, chainId: 1 });

  const [activeTab, setActiveTab] = useState('Assets');
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [agentWallets, setAgentWallets] = useState<any[]>([]);
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [receiveVisible, setReceiveVisible] = useState(false);

  // Tab indicator animation
  const tabOffset = useSharedValue(0);
  const tabIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(tabOffset.value) }],
  }));

  const fetchPortfolio = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`${API_URL}/portfolio?walletAddress=${address}`);
      const json = await res.json();
      if (json.success) setPortfolioData(json.data);

      const agentsRes = await fetch(`${API_URL}/agents?walletAddress=${address}`);
      const agentsJson = await agentsRes.json();
      if (agentsJson.success) setAgentWallets(agentsJson.data);
    } catch (error) {
      console.error('Portfolio fetch error:', error);
    }
  }, [address]);

  const fetchPrices = useCallback(async () => {
    if (!portfolioData?.assets) return;
    try {
      const ids = portfolioData.assets.map((a: any) => `ethereum:${a.address}`).join(',');
      const res = await fetch(`https://coins.llama.fi/prices/current/${ids}`);
      const json = await res.json();
      const prices: Record<string, number> = {};
      Object.keys(json.coins).forEach(key => {
        prices[key.split(':')[1].toLowerCase()] = json.coins[key].price;
      });
      setTokenPrices(prices);
    } catch (error) {
      console.error('Price fetch error:', error);
    }
  }, [portfolioData]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchPortfolio(), refetchBalance()]);
    setIsLoading(false);
  }, [fetchPortfolio, refetchBalance]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (portfolioData) fetchPrices();
  }, [portfolioData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleTabPress = (tab: string, index: number) => {
    setActiveTab(tab);
    tabOffset.value = index * ((width - 40) / 3);
  };

  const copyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      // Toast would go here
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('@/assets/logo/logo.png')} style={styles.logo} contentFit="contain" />
            <Text style={styles.headerTitle}>Molfi AI</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.username}>{ensName || (address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Disconnected')}</Text>
          </View>
        </View>

        {/* Portfolio Card */}
        <View style={styles.heroSection}>
          <Text style={styles.heroLabel}>Total Portfolio Value</Text>
          {isLoading ? (
            <Skeleton width={240} height={56} style={{ marginVertical: 8 }} />
          ) : (
            <Text style={styles.heroBalance}>
              {formatCurrency(portfolioData?.totalValue || 0)}
            </Text>
          )}
          {!isLoading && portfolioData && (
            <View style={[styles.badge, { backgroundColor: portfolioData.dailyPnL >= 0 ? 'rgba(0,200,150,0.15)' : 'rgba(255,59,48,0.15)' }]}>
              <Text style={[styles.badgeText, { color: portfolioData.dailyPnL >= 0 ? '#00C896' : '#FF3B30' }]}>
                {portfolioData.dailyPnL >= 0 ? '+' : ''}{formatCurrency(portfolioData.dailyPnL)} ({portfolioData.dailyPnLPct.toFixed(2)}%)
              </Text>
            </View>
          )}
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <ActionButton label="Fund" icon="add-circle-outline" onPress={() => {}} />
          <ActionButton label="Withdraw" icon="arrow-up-outline" onPress={() => {}} />
          <ActionButton label="Receive" icon="arrow-down-outline" onPress={() => setReceiveVisible(true)} />
          <ActionButton label="Publish" icon="globe-outline" onPress={() => {}} />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcherContainer}>
          <View style={styles.tabSwitcher}>
            <Animated.View style={[styles.activeIndicator, tabIndicatorStyle, { width: (width - 40) / 3 }]} />
            {['Assets', 'Timeline', 'Agents'].map((tab, i) => (
              <TouchableOpacity key={tab} style={styles.tabBtn} onPress={() => handleTabPress(tab, i)}>
                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>
          {activeTab === 'Assets' && (
            <>
              {/* Personal Assets */}
              <Text style={styles.sectionTitle}>Personal Assets</Text>
              <View style={styles.assetCard}>
                <View style={styles.tokenRow}>
                  <View style={[styles.tokenIcon, { backgroundColor: `${theme.primary}22` }]}>
                    <Text style={styles.tokenIconText}>E</Text>
                  </View>
                  <View style={styles.tokenInfo}>
                    <Text style={styles.tokenSymbol}>ETH</Text>
                    <Text style={styles.tokenAmount}>{nativeBalance ? parseFloat(nativeBalance.formatted).toFixed(4) : '0.0000'} tokens</Text>
                  </View>
                  <View style={styles.tokenValues}>
                    <Text style={styles.tokenValueUsd}>{formatCurrency(nativeBalance ? parseFloat(nativeBalance.formatted) * (tokenPrices['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'] || 0) : 0)}</Text>
                  </View>
                </View>
                {portfolioData?.assets.map((asset: any) => (
                  <View key={asset.address} style={styles.tokenRow}>
                    <View style={[styles.tokenIcon, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                      <Text style={styles.tokenIconText}>{asset.symbol[0]}</Text>
                    </View>
                    <View style={styles.tokenInfo}>
                      <Text style={styles.tokenSymbol}>{asset.symbol}</Text>
                      <Text style={styles.tokenAmount}>{parseFloat(asset.amount).toFixed(2)} tokens</Text>
                    </View>
                    <View style={styles.tokenValues}>
                      <Text style={styles.tokenValueUsd}>{formatCurrency(parseFloat(asset.amount) * (tokenPrices[asset.address.toLowerCase()] || 0))}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Agent Wallets */}
              <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Agent Wallets</Text>
              {agentWallets.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="hardware-chip-outline" size={32} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.emptyText}>No active agent wallets</Text>
                  <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                agentWallets.map(agent => (
                  <AgentWalletRow key={agent._id} agent={agent} theme={theme} />
                ))
              )}
            </>
          )}

          {activeTab === 'Timeline' && (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={32} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>Activity timeline coming soon</Text>
            </View>
          )}
          
          {activeTab === 'Agents' && (
            <View>
              <Text style={styles.sectionTitle}>Agent Operations</Text>
              <View style={styles.emptyCard}>
                <Ionicons name="apps-outline" size={32} color="rgba(255,255,255,0.2)" />
                <Text style={styles.emptyText}>Agent management is active.</Text>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 32 }]}>AI Research Reports</Text>
              {portfolioData?.researchReports?.length > 0 ? (
                <View style={styles.reportList}>
                  {portfolioData.researchReports.map((report: any, idx: number) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={styles.reportItem}
                      onPress={() => Linking.openURL(report.url)}
                    >
                      <View style={styles.reportIcon}>
                        <Ionicons name="document-text" size={20} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reportTitle} numberOfLines={1}>{report.title}</Text>
                        <Text style={styles.reportDate}>{new Date(report.date).toLocaleDateString()}</Text>
                      </View>
                      <Ionicons name="open-outline" size={16} color="rgba(255,255,255,0.3)" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <Ionicons name="search-outline" size={32} color="rgba(255,255,255,0.2)" />
                  <Text style={styles.emptyText}>No research reports generated yet.</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Receive Bottom Sheet */}
      <BottomSheet isVisible={receiveVisible} onClose={() => setReceiveVisible(false)} snapPoints={['60%']}>
        <View style={styles.receiveSheet}>
          <Text style={styles.sheetTitle}>Receive Assets</Text>
          <View style={styles.qrContainer}>
            <QRCode value={address || ''} size={200} backgroundColor="transparent" color="#fff" />
          </View>
          <TouchableOpacity style={styles.addressBox} onPress={copyAddress}>
            <Text style={styles.addressText}>{address}</Text>
            <Ionicons name="copy-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
          <Text style={styles.qrDesc}>Scan this address to send ETH or ERC20 tokens to your Molfi wallet.</Text>
          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.primary }]} onPress={() => setReceiveVisible(false)}>
            <Text style={styles.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 32, height: 32 },
  headerTitle: { fontFamily: 'Manrope-Bold', fontSize: 20, color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  username: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  heroSection: { alignItems: 'center', paddingVertical: 32 },
  heroLabel: { fontFamily: 'Manrope-Medium', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 8 },
  heroBalance: { fontFamily: 'Inter-Bold', fontSize: 48, color: '#fff', marginBottom: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontFamily: 'Inter-Medium', fontSize: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 16 },
  actionItem: { alignItems: 'center', gap: 8 },
  actionCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontFamily: 'Inter-Regular', fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  tabSwitcherContainer: { paddingHorizontal: 20, marginTop: 40 },
  tabSwitcher: { height: 48, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 24, flexDirection: 'row', padding: 4, position: 'relative' },
  activeIndicator: { position: 'absolute', top: 4, bottom: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  tabBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBtnText: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  tabBtnTextActive: { color: '#fff' },
  contentArea: { paddingHorizontal: 20, marginTop: 32 },
  sectionTitle: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff', marginBottom: 16 },
  assetCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 16, gap: 16 },
  tokenRow: { flexDirection: 'row', alignItems: 'center' },
  tokenIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  tokenIconText: { color: '#fff', fontFamily: 'Manrope-Bold', fontSize: 18 },
  tokenInfo: { flex: 1, marginLeft: 12 },
  tokenSymbol: { fontFamily: 'Manrope-Bold', fontSize: 15, color: '#fff' },
  tokenAmount: { fontFamily: 'Inter-Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  tokenValues: { alignItems: 'flex-end' },
  tokenValueUsd: { fontFamily: 'Inter-Bold', fontSize: 15, color: '#fff' },
  emptyCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24, padding: 40, alignItems: 'center', gap: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)' },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },
  agentWalletCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  agentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  agentAvatar: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  agentAvatarText: { color: '#fff', fontFamily: 'Manrope-Bold', fontSize: 18 },
  agentName: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },
  agentAddr: { fontFamily: 'Inter-Regular', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  agentSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  aumLabel: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  aumValue: { fontFamily: 'Inter-Bold', color: '#fff' },
  pnlText: { fontFamily: 'Inter-Bold', fontSize: 14 },
  receiveSheet: { alignItems: 'center', gap: 24 },
  sheetTitle: { fontFamily: 'Manrope-Bold', fontSize: 20, color: '#fff' },
  qrContainer: { padding: 20, backgroundColor: '#fff', borderRadius: 24 },
  addressBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16, gap: 12, width: '100%' },
  addressText: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  qrDesc: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 20 },
  closeBtn: { width: '100%', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  closeBtnText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },
  retryBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  retryText: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: '#fff' },
  reportList: { gap: 12 },
  reportItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', padding: 16, borderRadius: 20, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  reportIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(173,70,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  reportTitle: { fontFamily: 'Manrope-Bold', fontSize: 14, color: '#fff' },
  reportDate: { fontFamily: 'Inter-Regular', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }
});



