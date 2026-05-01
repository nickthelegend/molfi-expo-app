import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export function AIResearchBox() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(177, 87, 251, 0.15)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBg}
      />
      
      <View style={styles.header}>
        <View style={styles.agentBadge}>
          <Ionicons name="sparkles" size={12} color="#fff" />
          <Text style={styles.agentBadgeText}>Agent Active</Text>
        </View>
        <Text style={[styles.title, { color: '#fff' }]}>Deep Research</Text>
      </View>

      <Text style={styles.prompt}>
        With my recent performance should I buy or hodl this token?
      </Text>
      
      <View style={styles.inputWrapper}>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={24} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>
        
        <View style={styles.inputPlaceholder}>
          <Text style={styles.placeholderText}>Ask Molfi AI...</Text>
        </View>

        <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="arrow-up" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 24,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    position: 'relative',
  },
  gradientBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    marginBottom: 12,
  },
  agentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(177, 87, 251, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  agentBadgeText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
    color: '#b157fb',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 22,
  },
  prompt: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  addButton: {
    padding: 8,
  },
  inputPlaceholder: {
    flex: 1,
    paddingHorizontal: 8,
  },
  placeholderText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255,255,255,0.2)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#b157fb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

