import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Text, SafeAreaView } from 'react-native';
import { AppLayout } from '@/components/layout/AppLayout';
import { PortfolioCard } from '@/components/home/PortfolioCard';
import { TabSwitcher } from '@/components/home/TabSwitcher';
import { TimelineItem, TimelineData } from '@/components/home/TimelineItem';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';

const timelineData: TimelineData[] = [
  { id: '1', ticker: 'TSLAx', pnl: '+$102.34', time: '2mins ago', status: 'Trade not closed', color: '#E31937' },
  { id: '2', ticker: 'GOOGLx', pnl: '-$12.47', time: '21hrs ago', pct: '-2.45%', color: '#4285F4' },
  { id: '3', ticker: 'Solana', pnl: '+$5,003.4', time: '2 days', status: 'Transfer', color: '#9945FF' },
  { id: '4', ticker: 'NVDAx', pnl: '-$88.04', time: '2 weeks ago', pct: '+2.45%', color: '#76B900' },
  { id: '5', ticker: 'AAPL', pnl: '+$412.10', time: '3 weeks ago', color: '#A2AAAD' },
];

export default function Home() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const [activeTab, setActiveTab] = useState<'Assets' | 'Timeline'>('Timeline');
  const router = useRouter();

  const handleNavigate = (route: string) => {
    // Basic navigation logic for the sidebar
    console.log('Navigating to:', route);
  };

  return (
    <AppLayout activeRoute="Home" onNavigate={handleNavigate}>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={activeTab === 'Timeline' ? timelineData : []}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              <PortfolioCard />
              <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
              {activeTab === 'Assets' && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No assets found in this agent.</Text>
                </View>
              )}
            </>
          }
          renderItem={({ item, index }) => (
            <TimelineItem item={item} index={index} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Syne_400Regular',
    color: '#6C6C6C',
    fontSize: 14,
  },
});
