import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAccount } from 'wagmi';
import { keeperHub } from '@/utils/keeperhub';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function WorkflowsScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { address } = useAccount();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [workflows, setWorkflows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await keeperHub.listWorkflows();
      if (res.data) {
        setWorkflows(res.data);
      }
    } catch (error) {
      console.error('Fetch workflows error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const deleteWorkflow = (id: string) => {
    Alert.alert(
      "Delete Workflow",
      "Are you sure you want to delete this automation?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await keeperHub.deleteWorkflow(id);
              setWorkflows(prev => prev.filter(w => w.id !== id));
            } catch (error) {
              Alert.alert("Error", "Failed to delete workflow");
            }
          }
        }
      ]
    );
  };

  const renderWorkflowItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Ionicons name="flash" size={24} color={theme.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.workflowName}>{item.name}</Text>
          <Text style={styles.workflowDescription} numberOfLines={1}>{item.description || 'No description'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.enabled ? 'rgba(0,255,148,0.1)' : 'rgba(255,255,255,0.05)' }]}>
          <Text style={[styles.statusText, { color: item.enabled ? '#00FF94' : 'rgba(255,255,255,0.4)' }]}>
            {item.enabled ? 'Active' : 'Paused'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>Last run: {item.lastRunAt ? new Date(item.lastRunAt).toLocaleDateString() : 'Never'}</Text>
        <TouchableOpacity onPress={() => deleteWorkflow(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.title}>Automations</Text>
          <Text style={styles.subtitle}>Powered by KeeperHub</Text>
        </View>
        <TouchableOpacity 
          style={[styles.createBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/workflows/new')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={workflows}
        renderItem={renderWorkflowItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={fetchWorkflows} tintColor={theme.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="infinite-outline" size={64} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyTitle}>No Automations</Text>
            <Text style={styles.emptySubtitle}>Create your first automated workflow to monitor and manage your on-chain activity.</Text>
            <TouchableOpacity 
              style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/workflows/new')}
            >
              <Text style={styles.emptyBtnText}>Create Automation</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  title: { fontFamily: 'Manrope-ExtraBold', fontSize: 28, color: '#fff' },
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  createBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flex: 1, marginLeft: 12 },
  workflowName: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' },
  workflowDescription: { fontFamily: 'Inter-Regular', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontFamily: 'Manrope-SemiBold', fontSize: 11 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  footerText: { fontFamily: 'Inter-Regular', fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  emptyState: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: 'Manrope-ExtraBold', fontSize: 20, color: '#fff', marginTop: 16, marginBottom: 12 },
  emptySubtitle: { fontFamily: 'Inter-Regular', fontSize: 15, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  emptyBtn: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 28 },
  emptyBtnText: { fontFamily: 'Manrope-Bold', fontSize: 16, color: '#fff' }
});
