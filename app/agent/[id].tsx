import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { API_URL } from '@/constants/Config';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDistanceToNow } from 'date-fns';

export default function AgentDetailScreen() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const router = useRouter();

  const [agent, setAgent] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentRes, tradesRes] = await Promise.all([
          fetch(`${API_URL}/agents/${id}`),
          fetch(`${API_URL}/agents/${id}/trades`)
        ]);
        const agentJson = await agentRes.json();
        const tradesJson = await tradesRes.json();
        if (agentJson.success) setAgent(agentJson.data);
        if (tradesJson.success) setTrades(tradesJson.data);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (isLoading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Skeleton width={100} height={24} />
      </View>
      <View style={{ padding: 20 }}>
        <Skeleton height={200} borderRadius={24} />
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: agent?.name || 'Agent Detail', headerStyle: { backgroundColor: '#0A0A0A' }, headerTintColor: '#fff' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: agent?.avatarColor || theme.primary }]}>
            <Text style={styles.avatarText}>{agent?.name[0]}</Text>
          </View>
          <Text style={styles.name}>{agent?.name}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{agent?.status}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>AUM</Text>
            <Text style={styles.statValue}>${agent?.aum.toLocaleString()}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>PnL</Text>
            <Text style={[styles.statValue, { color: agent?.totalPnL >= 0 ? '#00C896' : '#FF3B30' }]}>
              {agent?.totalPnL >= 0 ? '+' : ''}{agent?.totalPnLPct}%
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Trade History</Text>
        {trades.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No trades executed yet.</Text>
          </View>
        ) : (
          trades.map((trade, i) => (
            <View key={i} style={styles.tradeCard}>
              <View style={styles.tradeHeader}>
                <Text style={styles.tradeType}>{trade.type} {trade.pair}</Text>
                <Text style={styles.tradeTime}>{formatDistanceToNow(new Date(trade.timestamp))} ago</Text>
              </View>
              <View style={styles.tradeDetails}>
                <Text style={styles.tradeAmount}>{trade.amount} {trade.pair.split('/')[0]}</Text>
                <Text style={[styles.tradePnL, { color: trade.pnl >= 0 ? '#00C896' : '#FF3B30' }]}>
                  {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { padding: 20 },
  content: { padding: 20 },
  hero: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 80, height: 80, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { color: '#fff', fontFamily: 'Manrope-ExtraBold', fontSize: 32 },
  name: { fontFamily: 'Manrope-Bold', fontSize: 24, color: '#fff', marginBottom: 8 },
  statusBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontFamily: 'Manrope-SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statLabel: { fontFamily: 'Manrope-SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 8 },
  statValue: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#fff' },
  sectionTitle: { fontFamily: 'Manrope-Bold', fontSize: 18, color: '#fff', marginBottom: 16 },
  tradeCard: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 16, marginBottom: 12 },
  tradeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tradeType: { fontFamily: 'Manrope-SemiBold', fontSize: 14, color: '#fff' },
  tradeTime: { fontFamily: 'Inter-Regular', fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  tradeDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  tradeAmount: { fontFamily: 'Inter-Regular', fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  tradePnL: { fontFamily: 'Inter-Bold', fontSize: 14 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: 'rgba(255,255,255,0.2)' }
});
