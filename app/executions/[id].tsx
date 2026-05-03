import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { keeperHub } from '@/utils/keeperhub';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExecutionLogsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const [execution, setExecution] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchData = async () => {
      try {
        const [statusRes, logsRes] = await Promise.all([
          keeperHub.getExecutionStatus(id),
          keeperHub.getExecutionLogs(id)
        ]);
        
        setExecution(statusRes.data);
        setLogs(logsRes.data || []);
        
        if (statusRes.data?.status === 'completed' || statusRes.data?.status === 'failed') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Fetch execution details error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#00FF94';
      case 'failed': return '#FF3B30';
      case 'running': return theme.primary;
      default: return 'rgba(255,255,255,0.4)';
    }
  };

  if (isLoading && !execution) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Execution Console</Text>
          <Text style={styles.subtitle}>ID: {id.slice(0, 12)}...</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(execution?.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(execution?.status) }]}>
            {execution?.status?.toUpperCase()}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.terminal}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <View style={styles.logContainer}>
          {logs.length === 0 ? (
            <Text style={styles.emptyLog}>Waiting for logs...</Text>
          ) : (
            logs.map((log, index) => (
              <View key={index} style={styles.logLine}>
                <Text style={styles.timestamp}>[{new Date(log.createdAt).toLocaleTimeString()}]</Text>
                <Text style={[styles.level, { color: log.level === 'error' ? '#FF3B30' : '#888' }]}>
                  {log.level.toUpperCase()}
                </Text>
                <Text style={styles.message}>{log.message}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {execution?.status === 'running' && (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 10 }} />
          <Text style={styles.footerText}>Agent is thinking...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerInfo: { flex: 1, marginLeft: 8 },
  title: { fontFamily: 'Manrope-Bold', fontSize: 18, color: '#fff' },
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontFamily: 'Manrope-Bold', fontSize: 10, letterSpacing: 1 },
  terminal: { flex: 1, padding: 16 },
  logContainer: { paddingBottom: 40 },
  logLine: { flexDirection: 'row', marginBottom: 8, flexWrap: 'wrap' },
  timestamp: { fontFamily: 'SpaceMono-Regular', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginRight: 8 },
  level: { fontFamily: 'SpaceMono-Bold', fontSize: 11, marginRight: 8, width: 45 },
  message: { fontFamily: 'SpaceMono-Regular', fontSize: 13, color: '#fff', flex: 1 },
  emptyLog: { fontFamily: 'SpaceMono-Regular', fontSize: 13, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 40 },
  footer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)'
  },
  footerText: { fontFamily: 'Inter-Medium', fontSize: 14, color: 'rgba(255,255,255,0.6)' }
});
