import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TokenChart } from '@/components/token/TokenChart';
import { StatPill } from '@/components/token/StatPill';
import { AIResearchBox } from '@/components/token/AIResearchBox';
import { useRouter } from 'expo-router';

export default function TokenDetail() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="bar-chart-outline" size={20} color="#A0A0A0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="expand-outline" size={20} color="#A0A0A0" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <TokenChart />

        <View style={styles.tokenInfoSection}>
          <View style={styles.tokenNameRow}>
            <View style={[styles.tokenIcon, { backgroundColor: '#E31937' }]}>
              <Text style={styles.tokenIconText}>T</Text>
            </View>
            <View style={styles.tokenNameContainer}>
              <View style={styles.titleWithBadge}>
                <Text style={styles.tokenName}>Tesla Token</Text>
                <Ionicons name="bookmark" size={18} color={theme.primary} style={styles.bookmark} />
              </View>
              <Text style={styles.tokenTicker}>$TSLAx</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>$0.00001312</Text>
              <Text style={styles.priceChange}>+1.130%</Text>
            </View>
          </View>

          <View style={styles.verifiedRow}>
            <View style={[styles.verifiedBadge, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
              <Ionicons name="checkmark-circle" size={14} color="#2196F3" />
              <Text style={styles.verifiedText}>Verified Crypto Asset</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatPill label="Mcap" value="$1.02B" />
            <StatPill label="Liq" value="$371.5K" />
            <StatPill label="Vol" value="Up 42%" />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="globe-outline" size={20} color="#A0A0A0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="paper-plane-outline" size={20} color="#A0A0A0" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-twitter" size={20} color="#A0A0A0" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.getButton, { backgroundColor: theme.primary }]}>
              <Text style={styles.getButtonText}>Get</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Tesla Token ($TSLAx) is a synthetic asset designed to track the performance of Tesla Inc. 
            utilizing high-frequency AI trading agents on the 0G network.
          </Text>
        </View>

        <AIResearchBox />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerIconButton: {
    padding: 4,
  },
  tokenInfoSection: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  tokenNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenIconText: {
    color: '#fff',
    fontFamily: 'Syne_700Bold',
    fontSize: 24,
  },
  tokenNameContainer: {
    flex: 1,
    marginLeft: 16,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenName: {
    fontFamily: 'Syne_700Bold',
    fontSize: 20,
    color: '#fff',
  },
  bookmark: {
    marginLeft: 8,
  },
  tokenTicker: {
    fontFamily: 'Syne_400Regular',
    fontSize: 14,
    color: '#6C6C6C',
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 16,
    color: '#fff',
  },
  priceChange: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  verifiedRow: {
    marginTop: 16,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  verifiedText: {
    fontFamily: 'Syne_400Regular',
    fontSize: 12,
    color: '#2196F3',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  getButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getButtonText: {
    fontFamily: 'Syne_700Bold',
    color: '#fff',
    fontSize: 16,
  },
  description: {
    fontFamily: 'Syne_400Regular',
    fontSize: 13,
    color: '#A0A0A0',
    lineHeight: 18,
    marginTop: 24,
  },
});
