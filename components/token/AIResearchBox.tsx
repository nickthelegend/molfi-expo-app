import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

export function AIResearchBox() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: '#1d1d1d' }]}>
      <Text style={[styles.title, { color: theme.primary }]}>Deep Research</Text>
      <Text style={styles.prompt}>
        With my recent performance should I buy or hodl this token?
      </Text>
      
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#A0A0A0" />
        </TouchableOpacity>
        
        <View style={styles.inputPlaceholder}>
          <Text style={styles.placeholderText}>Ask Molfi AI...</Text>
        </View>

        <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.primary }]}>
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(177, 87, 251, 0.2)',
  },
  title: {
    fontFamily: 'Syne_700Bold',
    fontSize: 18,
    marginBottom: 8,
  },
  prompt: {
    fontFamily: 'Syne_400Regular',
    fontSize: 14,
    color: '#ECEDEE',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 8,
  },
  addButton: {
    padding: 4,
  },
  inputPlaceholder: {
    flex: 1,
    paddingHorizontal: 12,
  },
  placeholderText: {
    fontFamily: 'Syne_400Regular',
    fontSize: 14,
    color: '#6C6C6C',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
