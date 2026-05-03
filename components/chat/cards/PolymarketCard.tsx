import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface PolymarketCardProps {
  payload: any;
}

export const PolymarketCard: React.FC<PolymarketCardProps> = ({ payload }) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const markets = payload.intentPayload?.markets || payload.markets || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="trending-up" size={12} color={theme.primary} />
          <Text style={[styles.badgeText, { color: theme.primary }]}>ALPHA DETECTED</Text>
        </View>
        <Text style={[styles.sourceText, { color: theme.textMuted }]}>POLYMARKET</Text>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>Trending Markets</Text>

      <View style={styles.marketList}>
        {markets.map((m: any, idx: number) => (
          <TouchableOpacity key={m.id || idx} style={[styles.marketItem, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }]}>
            <Text style={[styles.marketQuestion, { color: theme.text }]} numberOfLines={2}>
              {m.question}
            </Text>
            <View style={styles.marketFooter}>
              <View style={styles.researchRow}>
                <Ionicons name="search" size={10} color={theme.textMuted} />
                <Text style={[styles.researchText, { color: theme.textMuted }]}>SWARM RESEARCH AVAILABLE</Text>
              </View>
              <Ionicons name="sparkles" size={14} color={theme.primary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.footerText, { color: theme.textMuted }]}>
        Tap a market in the chat to start research
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(173,70,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 10,
    letterSpacing: 1,
  },
  sourceText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
  },
  title: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 20,
    marginBottom: 16,
  },
  marketList: {
    gap: 8,
    marginBottom: 16,
  },
  marketItem: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  marketQuestion: {
    fontFamily: 'Manrope-Bold',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  marketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  researchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  researchText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  footerText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  }
});
