import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function ResearchAI() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Research AI Insight</Text>
        <View style={styles.liveBadge}>
          <View style={styles.dot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
      <Text style={styles.insightText}>
        "Solana network activity is up 14% in the last 4h. Sentiment on $SOL is turning extremely bullish following the latest Jupiter aggregator update. High probability of breakout at $155."
      </Text>
      <View style={styles.footer}>
        <Text style={styles.timestamp}>Just now • AI Agent Alpha</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(177, 87, 251, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'KHTekaMedium',
    fontSize: 16,
    color: '#b157fb',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  insightText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#ECEDEE',
    lineHeight: 20,
  },
  footer: {
    marginTop: 12,
  },
  timestamp: {
    fontSize: 12,
    color: '#A0A0A0',
  },
});

