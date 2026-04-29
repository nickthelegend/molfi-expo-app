import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

function ActionButton({ icon, label, onPress }: ActionButtonProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <TouchableOpacity style={styles.actionButtonContainer} onPress={onPress}>
      <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
        <Ionicons name={icon} size={20} color="#fff" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function PortfolioCard() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.card, 
        { 
          backgroundColor: '#1d1d1d', // card color
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.agentLabel}>My Stocks Agent</Text>
        <TouchableOpacity>
          <Text style={[styles.editText, { color: theme.primary }]}>edit</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.portfolioValue}>$11,567.94</Text>

      <View style={styles.pnlRow}>
        <Text style={styles.pnlAmount}>+$257.32</Text>
        <View style={styles.percentageBadge}>
          <Text style={styles.percentageText}>+0.89%</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <ActionButton icon="add" label="Fund" onPress={() => {}} />
        <ActionButton icon="arrow-up" label="Withdraw" onPress={() => {}} />
        <ActionButton icon="trash-outline" label="Destroy" onPress={() => {}} />
        <ActionButton icon="share-social-outline" label="Publish" onPress={() => {}} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  agentLabel: {
    fontFamily: 'Syne_400Regular',
    fontSize: 12,
    color: '#A0A0A0',
  },
  editText: {
    fontFamily: 'Syne_400Regular',
    fontSize: 12,
  },
  portfolioValue: {
    fontFamily: 'Syne_700Bold',
    fontSize: 32,
    color: '#fff',
    marginBottom: 8,
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 12,
  },
  pnlAmount: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 16,
    color: '#4CAF50',
  },
  percentageBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  percentageText: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 12,
    color: '#4CAF50',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  actionButtonContainer: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontFamily: 'Syne_400Regular',
    fontSize: 12,
    color: '#A0A0A0',
  },
});
