import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Dimensions,
  FlatList,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAccount as useAppKitAccount } from '@reown/appkit-react-native';
import { useBalance, useEnsName } from 'wagmi';
import { API_URL } from '@/constants/Config';
import { Skeleton } from '@/components/ui/Skeleton';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Agent {
  _id: string;
  name: string;
  strategy: string;
  status: 'active' | 'paused' | 'stopped';
  createdAt: string;
  totalPnL: number;
  totalPnLPct: number;
  tradesCount: number;
  aum: number;
  avatarColor?: string;
  ensSubdomain?: string;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val);
};

export default function AgentsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { address } = useAppKitAccount();
  const { data: ensName } = useEnsName({ address: address as `0x${string}`, chainId: 1 });
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAgents = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`${API_URL}/agents?walletAddress=${address}`);
      const json = await res.json();
      if (json.success) {
        setAgents(json.data);
      }
    } catch (error) {
      console.error('Fetch agents error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [address]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const toggleStatus = async (agent: Agent) => {
    const newStatus = agent.status === 'active' ? 'paused' : 'active';
    try {
      // Optimistic update
      setAgents(prev => prev.map(a => a._id === agent._id ? { ...a, status: newStatus } : a));
      
      const res = await fetch(`${API_URL}/agents/${agent._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (!json.success) {
        // Rollback on error
        fetchAgents();
      }
    } catch (error) {
      fetchAgents();
    }
  };

  const destroyAgent = (id: string) => {
    Alert.alert(
      "Destroy Agent",
      "Are you sure? This will stop all trading and close positions.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Destroy", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/agents/${id}`, { method: 'DELETE' });
              const json = await res.json();
              if (json.success) {
                setAgents(prev => prev.filter(a => a._id !== id));
              }
            } catch (error) {
              console.error('Delete error:', error);
            }
          }
        }
      ]
    );
  };

  const renderAgentCard = ({ item }: { item: Agent }) => (
    <View style={styles.agentCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: item.avatarColor || theme.primary }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.agentName}>{item.name}</Text>
          {item.ensSubdomain ? (
            <View style={styles.ensTag}>
              <Ionicons name="at-circle-outline" size={12} color="#00FF94" />
              <Text style={styles.ensText}>{item.ensSubdomain}</Text>
            </View>
          ) : (
            <Text style={styles.noEnsText}>No ENS domain</Text>
          )}
          <Text style={styles.strategyText}>Strategy: {item.strategy}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: item.status === 'active' ? 'rgba(0,200,150,0.1)' : 'rgba(255,185,0,0.1)' }]}>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'active' ? '#00C896' : '#FFB900' }]} />
          <Text style={[styles.statusText, { color: item.status === 'active' ? '#00C896' : '#FFB900' }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>AUM</Text>
          <Text style={styles.statValue}>{formatCurrency(item.aum)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>PnL</Text>
          <Text style={[styles.statValue, { color: item.totalPnL >= 0 ? '#00C896' : '#FF3B30' }]}>
            {item.totalPnL >= 0 ? '+' : ''}{formatCurrency(item.totalPnL)} ({item.totalPnLPct}%)
          </Text>
        </View>
      </View>

      <View style={styles.footerInfo}>
        <Text style={styles.footerText}>Trades: {item.tradesCount}</Text>
        <Text style={styles.footerText}>Created: {formatDistanceToNow(new Date(item.createdAt))} ago</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => toggleStatus(item)}
        >
          <Ionicons name={item.status === 'active' ? "pause" : "play"} size={18} color="#fff" />
          <Text style={styles.actionBtnText}>{item.status === 'active' ? "Pause" : "Resume"}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => router.push(`/agent/${item._id}`)}
        >
          <Ionicons name="list" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>Trades</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.destroyBtn]}
          onPress={() => destroyAgent(item._id)}
        >
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Destroy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Molfi Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
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
               style={styles.headerAvatar}
             />
           </View>
        </TouchableOpacity>
      </View>

      <View style={styles.screenHeader}>
        <View>
          <Text style={styles.title}>Agents</Text>
          <Text style={styles.subtitle}>{agents.filter(a => a.status === 'active').length} active agents</Text>
        </View>
        <TouchableOpacity 
          style={[styles.createBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/agent/new')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.createBtnText}>New Agent</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.listContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton height={200} borderRadius={24} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={agents}
          renderItem={renderAgentCard}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={fetchAgents} tintColor={theme.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="sparkles-outline" size={48} color="rgba(255,255,255,0.1)" />
              </View>
              <Text style={styles.emptyTitle}>No Agents Yet</Text>
              <Text style={styles.emptySubtitle}>Create your first AI trading agent to start automating your strategy.</Text>
              <TouchableOpacity 
                style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/agent/new')}
              >
                <Text style={styles.emptyBtnText}>Create Agent</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingBottom: 20,
    backgroundColor: '#0A0A0A'
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 36, height: 36 },
  gmText: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 14 },
  usernameText: { fontFamily: 'Manrope-ExtraBold', fontSize: 15, color: '#fff' },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, overflow: 'hidden', padding: 2 },
  headerAvatar: { width: '100%', height: '100%', borderRadius: 20 },
  screenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  title: { fontFamily: 'Manrope-ExtraBold', fontSize: 28, color: '#fff' },
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  createBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, gap: 6 },
  createBtnText: { fontFamily: 'Manrope-Bold', fontSize: 14, color: '#fff' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  listContainer: { paddingHorizontal: 20 },
  skeletonCard: { marginBottom: 16 },
  agentCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontFamily: 'Manrope-Bold', fontSize: 20 },
  headerInfo: { flex: 1, marginLeft: 12 },
  agentName: { fontFamily: 'Manrope-Bold', fontSize: 17, color: '#fff' },
  ensTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,255,148,0.05)', 
    borderWidth: 1, 
    borderColor: '#00FF94', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6, 
    gap: 4,
    marginTop: 4
  },
  ensText: { 
    fontFamily: 'Manrope-Bold', 
    fontSize: 11, 
    color: '#00FF94' 
  },
  noEnsText: { 
    fontFamily: 'Inter-Regular', 
    fontSize: 10, 
    color: 'rgba(255,255,255,0.2)', 
    fontStyle: 'italic',
    marginTop: 4
  },
  strategyText: { fontFamily: 'Inter-Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: 'Manrope-SemiBold', fontSize: 11 },
  statsGrid: { flexDirection: 'row', marginBottom: 16 },
  statItem: { flex: 1 },
  statLabel: { fontFamily: 'Inter-Regular', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4 },
  statValue: { fontFamily: 'Inter-Bold', fontSize: 16, color: '#fff' },
  footerInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  footerText: { fontFamily: 'Inter-Regular', fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', height: 44, borderRadius: 12, gap: 8 },
  actionBtnText: { fontFamily: 'Manrope-SemiBold', fontSize: 13, color: '#fff' },
  destroyBtn: { backgroundColor: 'rgba(255,59,48,0.05)' },
  emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 20, color: '#fff', marginBottom: 12 },
  emptySubtitle: { fontFamily: 'Inter-Regular', fontSize: 15, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  emptyBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 28 },
  emptyBtnText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' }
});

