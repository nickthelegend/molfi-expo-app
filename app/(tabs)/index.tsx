import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { useAccount as useAppKitAccount } from '@reown/appkit-react-native';
import { useBalance } from 'wagmi';
import { API_URL } from '@/constants/Config';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { address } = useAppKitAccount();
  const { data: balance, isLoading: isBalanceLoading, refetch: refetchBalance } = useBalance({ address: address as `0x${string}` });
  
  const [agents, setAgents] = useState([]);
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Agent "Aura" executed a swap', time: '2m ago', type: 'swap' },
    { id: '2', title: 'New trading task started', time: '15m ago', type: 'task' },
    { id: '3', title: 'Portfolio grew by 2.4% today', time: '1h ago', type: 'stats' },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (address) {
      fetchAgents();
    }
  }, [address]);

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_URL}/agents?walletAddress=${address}`);
      const data = await res.json();
      if (data.success) {
        setAgents(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch agents:", e);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchBalance(), fetchAgents()]);
    setIsRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Image 
              source={require('@/assets/logo/logo.png')} 
              style={styles.logo}
              contentFit="contain"
            />
            <View>
              <Text style={[styles.greeting, { color: theme.textMuted }]}>Good Morning</Text>
              <Text style={[styles.userName, { color: theme.text }]}>
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Explorer'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')}>
             <View style={[styles.avatarCircle, { borderColor: theme.border }]}>
               <Image 
                 source={`https://api.dicebear.com/7.x/identicon/svg?seed=${address || 'molfi'}`} 
                 style={styles.avatar}
               />
             </View>
          </TouchableOpacity>
        </View>

        {/* Portfolio Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.portfolioCardContainer}>
          <LinearGradient
            colors={[theme.primary, '#8A5CF5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.portfolioCard}
          >
            <View style={styles.portfolioInfo}>
              <Text style={styles.portfolioLabel}>Total Balance</Text>
              {isBalanceLoading ? (
                <ActivityIndicator color="#FFF" style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
              ) : (
                <Text style={styles.portfolioValue}>
                  {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '$0.00'}
                </Text>
              )}
              <View style={styles.portfolioChange}>
                <Ionicons name="trending-up" size={14} color="#FFF" />
                <Text style={styles.changeText}>+5.2% (24h)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.chartButton}>
              <Ionicons name="stats-chart" size={20} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <ActionItem icon="swap-horizontal" label="Swap" onPress={() => router.push('/chat')} theme={theme} />
          <ActionItem icon="arrow-up" label="Send" onPress={() => router.push('/chat')} theme={theme} />
          <ActionItem icon="repeat" label="Bridge" onPress={() => router.push('/chat')} theme={theme} />
          <ActionItem icon="grid" label="More" onPress={() => {}} theme={theme} />
        </View>

        {/* Active Agents */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Active Agents</Text>
          <TouchableOpacity onPress={() => router.push('/agents')}>
            <Text style={[styles.viewAll, { color: theme.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.agentsScroll}>
          {agents.length > 0 ? agents.map((agent: any, index) => (
            <Animated.View key={agent._id} entering={SlideInRight.delay(200 + index * 100)}>
              <TouchableOpacity style={[styles.agentCard, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.push(`/agent/${agent._id}`)}>
                <View style={[styles.agentAvatar, { backgroundColor: agent.avatarColor || theme.primary }]}>
                  <Text style={styles.agentAvatarText}>{agent.name[0]}</Text>
                </View>
                <Text style={[styles.agentName, { color: theme.text }]} numberOfLines={1}>{agent.name}</Text>
                <Text style={[styles.agentStatus, { color: '#00C896' }]}>Active</Text>
              </TouchableOpacity>
            </Animated.View>
          )) : (
            <TouchableOpacity style={[styles.createAgentCard, { backgroundColor: theme.card, borderColor: theme.border, borderStyle: 'dashed' }]} onPress={() => router.push('/agents')}>
              <Ionicons name="add" size={24} color={theme.textMuted} />
              <Text style={[styles.createAgentText, { color: theme.textMuted }]}>New Agent</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Recent Notifications */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
        </View>
        <View style={styles.notificationsContainer}>
          {notifications.map((notif, index) => (
            <Animated.View key={notif.id} entering={FadeInDown.delay(400 + index * 100)} style={[styles.notificationItem, { borderBottomColor: theme.border }]}>
              <View style={[styles.notifIcon, { backgroundColor: theme.surface }]}>
                <Ionicons 
                  name={notif.type === 'swap' ? 'swap-horizontal' : notif.type === 'task' ? 'list' : 'stats-chart'} 
                  size={18} 
                  color={theme.primary} 
                />
              </View>
              <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, { color: theme.text }]}>{notif.title}</Text>
                <Text style={[styles.notifTime, { color: theme.textMuted }]}>{notif.time}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Chat CTA */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.chatCtaContainer}>
          <TouchableOpacity 
            style={[styles.chatCta, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}
            onPress={() => router.push('/chat')}
          >
            <View style={[styles.chatCtaIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="chatbubble" size={24} color="#FFF" />
            </View>
            <View style={styles.chatCtaText}>
              <Text style={[styles.chatCtaTitle, { color: theme.text }]}>Chat with Molfi</Text>
              <Text style={[styles.chatCtaDesc, { color: theme.textMuted }]}>AI Assistant for all your on-chain needs</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

function ActionItem({ icon, label, onPress, theme }: { icon: any; label: string; onPress: () => void; theme: any }) {
  return (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name={icon} size={22} color={theme.text} />
      </View>
      <Text style={[styles.actionLabel, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
  },
  greeting: {
    fontFamily: 'Syne_400Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontFamily: 'Syne_700Bold',
    fontSize: 22,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
  },
  portfolioCardContainer: {
    marginBottom: 30,
  },
  portfolioCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portfolioInfo: {
    flex: 1,
  },
  portfolioLabel: {
    fontFamily: 'Syne_400Regular',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 8,
  },
  portfolioValue: {
    fontFamily: 'DMMono_500Medium',
    color: '#FFF',
    fontSize: 28,
    marginBottom: 12,
  },
  portfolioChange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  changeText: {
    fontFamily: 'KHTeka',
    color: '#FFF',
    fontSize: 12,
  },
  chartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 35,
  },
  actionItem: {
    alignItems: 'center',
    width: (width - 40) / 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontFamily: 'Syne_500Medium',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 18,
  },
  viewAll: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 14,
  },
  agentsScroll: {
    gap: 12,
    paddingRight: 20,
    marginBottom: 30,
  },
  agentCard: {
    width: 100,
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  agentAvatarText: {
    color: '#FFF',
    fontFamily: 'Syne_700Bold',
    fontSize: 18,
  },
  agentName: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 13,
    marginBottom: 4,
  },
  agentStatus: {
    fontFamily: 'KHTeka',
    fontSize: 10,
  },
  createAgentCard: {
    width: 100,
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createAgentText: {
    fontFamily: 'Syne_500Medium',
    fontSize: 11,
  },
  notificationsContainer: {
    marginBottom: 30,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontFamily: 'Syne_500Medium',
    fontSize: 14,
    marginBottom: 2,
  },
  notifTime: {
    fontFamily: 'KHTeka',
    fontSize: 12,
  },
  chatCtaContainer: {
    marginTop: 10,
  },
  chatCta: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatCtaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  chatCtaText: {
    flex: 1,
  },
  chatCtaTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 16,
    marginBottom: 2,
  },
  chatCtaDesc: {
    fontFamily: 'Syne_400Regular',
    fontSize: 12,
  },
});
