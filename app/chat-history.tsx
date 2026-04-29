import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import { Colors } from '@/constants/Colors';
import { API_URL } from '@/constants/Config';
import { useAccount as useAppKitAccount } from '@reown/appkit-react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

type Session = {
  _id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
};

import { useColorScheme } from '@/hooks/useColorScheme';

export default function ChatHistoryScreen() {
  const { address } = useAppKitAccount();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const [sessions, setSessions] = useState<Session[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/chat/sessions?walletAddress=${address}`);
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [address]);

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_URL}/chat/sessions/${id}`, { method: 'DELETE' });
      setSessions(prev => prev.filter(s => s._id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Chat History</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="search" size={18} color={theme.textMuted} />
        <TextInput 
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search sessions..."
          placeholderTextColor={theme.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredSessions}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.sessionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => router.push(`/(tabs)/chat?sessionId=${item._id}`)}
          >
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.sessionMeta, { color: theme.textMuted }]}>
                {item.messageCount} messages · {format(new Date(item.updatedAt), 'MMM d, h:mm a')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color={theme.error} />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No chat history found</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Syne-Bold',
    fontSize: 20,
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: Colors.text,
    fontFamily: 'Syne-Medium',
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    color: Colors.text,
    fontFamily: 'Syne-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  sessionMeta: {
    color: Colors.textMuted,
    fontFamily: 'Syne-Regular',
    fontSize: 12,
  },
  deleteBtn: {
    padding: 8,
    marginRight: 8,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontFamily: 'Syne-Regular',
  }
});
