import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, SlideInRight, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAccount as useAppKitAccount } from '@reown/appkit-react-native';
import { useBalance, useEnsName } from 'wagmi';
import { API_URL } from '@/constants/Config';




import { getActivities, formatTime, Activity } from '@/utils/activity';

const { width } = Dimensions.get('window');

function ActionButton({ label, icon, onPress, theme }: { label: string; icon: any; onPress: () => void; theme: any }) {
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

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { address } = useAppKitAccount();
  const { data: balance, isLoading: isBalanceLoading, refetch: refetchBalance } = useBalance({ address: address as `0x${string}` });
  const { data: ensName } = useEnsName({ address: address as `0x${string}`, chainId: 1 });
  
  const [agents, setAgents] = useState([]);
  const [notifications, setNotifications] = useState<Activity[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
    if (address) {
      fetchAgents();
    }
  }, [address]);

  const loadActivities = async () => {
    const data = await getActivities();
    setNotifications(data);
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
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
              <Text style={styles.gmText}>GM,</Text>
              <Text style={styles.usernameText}>
                {ensName || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Explorer')}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')}>
             <View style={[styles.avatarCircle, { borderColor: 'rgba(255,255,255,0.1)' }]}>
               <Image 
                 source={{ uri: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${address || '0x0'}` }} 
                 style={styles.avatar}
               />
             </View>
          </TouchableOpacity>
        </View>

        {/* Hero Balance Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroLabel}>Total Balance</Text>
          {isBalanceLoading ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 10 }} />
          ) : (
            <Text style={styles.heroBalance}>
              {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '$0.00'}
            </Text>
          )}
          <View style={[styles.badge, { backgroundColor: 'rgba(0,200,150,0.1)' }]}>
            <Text style={[styles.badgeText, { color: '#00C896' }]}>+5.24% today</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <ActionButton icon="swap-horizontal" label="Swap" onPress={() => router.push('/swap')} theme={theme} />
          <ActionButton icon="arrow-up" label="Send" onPress={() => router.push('/send')} theme={theme} />
          <ActionButton icon="repeat" label="Bridge" onPress={() => router.push('/bridge')} theme={theme} />
          <ActionButton icon="grid" label="More" onPress={() => {}} theme={theme} />
        </View>



        {/* Active Agents */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Agents</Text>
          <TouchableOpacity onPress={() => router.push('/agents')}>
            <Text style={[styles.viewAll, { color: theme.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.agentsScroll}>
          {agents.length > 0 ? agents.map((agent: any, index) => (
            <Animated.View key={agent._id} entering={SlideInRight.delay(index * 100)}>
              <TouchableOpacity style={styles.agentCard} onPress={() => router.push(`/agent/${agent._id}`)}>
                <View style={[styles.agentAvatar, { backgroundColor: agent.avatarColor || theme.primary }]}>
                  <Text style={styles.agentAvatarText}>{agent.name[0]}</Text>
                </View>
                <Text style={styles.agentName} numberOfLines={1}>{agent.name}</Text>
                <Text style={styles.agentStatus}>Active</Text>
              </TouchableOpacity>
            </Animated.View>
          )) : (
            <TouchableOpacity style={styles.createAgentCard} onPress={() => router.push('/agents')}>
              <Ionicons name="add" size={24} color="rgba(255,255,255,0.2)" />
              <Text style={styles.createAgentText}>New Agent</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        <View style={styles.notificationsContainer}>
          {notifications.map((notif, index) => (
            <Animated.View key={notif.id} entering={FadeInDown.delay(index * 100)} style={styles.notificationItem}>
              <View style={styles.notifIcon}>
                <Ionicons 
                  name={notif.type === 'swap' ? 'swap-horizontal' : notif.type === 'task' ? 'list' : 'stats-chart'} 
                  size={18} 
                  color="rgba(255,255,255,0.6)" 
                />
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>{notif.title}</Text>
                <Text style={styles.notifTime}>{formatTime(notif.timestamp)}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Chat Floating CTA */}
        <TouchableOpacity 
          style={[styles.chatFab, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/chat')}
        >
          <Ionicons name="chatbubble" size={24} color="#FFF" />
          <Text style={styles.chatFabText}>Chat with Molfi</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  gmText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  usernameText: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 18,
    color: '#fff',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 36,
    height: 36,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 32,
    marginBottom: 24,
  },
  heroLabel: {
    fontFamily: 'Manrope-Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  heroBalance: {
    fontFamily: 'Inter-Bold',
    fontSize: 42,
    color: '#fff',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 32,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#fff',
  },
  viewAll: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
  },
  agentsScroll: {
    gap: 12,
    paddingRight: 20,
    marginBottom: 32,
  },
  agentCard: {
    width: 110,
    height: 130,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  agentAvatarText: {
    color: '#FFF',
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 18,
  },
  agentName: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 13,
    color: '#fff',
    marginBottom: 4,
  },
  agentStatus: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#00C896',
  },
  createAgentCard: {
    width: 110,
    height: 130,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createAgentText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
  notificationsContainer: {
    marginBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#fff',
    marginBottom: 2,
  },
  notifTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
  },
  chatFab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
    alignSelf: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  chatFabText: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 14,
    color: '#FFF',
  },
});

