import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');

export default function ChatScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image 
            source={require('@/assets/logo/logo.png')} 
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.logoText}>Molfi AI</Text>
        </View>
        
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="create-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="time-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="hardware-chip-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingTitle}>GM,</Text>
          <Text style={styles.greetingSubtitle}>How are we pumping that bag today?</Text>
        </View>

        {/* Suggestion Cards */}
        <View style={styles.cardGrid}>
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardIconHeader}>
              <Ionicons name="flame-outline" size={18} color="#fff" />
              <Text style={styles.cardTitle}>Hot tokens</Text>
            </View>
            <Text style={styles.cardDesc}>Trending and most hyped assets right now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card}>
            <View style={styles.cardIconHeader}>
              <Ionicons name="stats-chart-outline" size={18} color="#fff" />
              <Text style={styles.cardTitle}>My Performance</Text>
            </View>
            <Text style={styles.cardDesc}>Track your growth and portfolio over a week</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput 
            placeholder="Ask anything, / for quick prompts" 
            placeholderTextColor="#6C6C6C"
            style={styles.input}
          />
          
          <View style={styles.inputActions}>
            <TouchableOpacity style={styles.plusButton}>
              <Ionicons name="add" size={24} color="#6C6C6C" />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.micButton, { backgroundColor: theme.primary }]}>
              <Ionicons name="mic" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 20,
    color: '#fff',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1d1d1d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  greetingContainer: {
    marginBottom: 60,
  },
  greetingTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 48,
    color: '#fff',
  },
  greetingSubtitle: {
    fontFamily: 'Syne_400Regular',
    fontSize: 32,
    color: '#A0A0A0',
    lineHeight: 40,
  },
  cardGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  card: {
    flex: 1,
    backgroundColor: '#1d1d1d',
    borderRadius: 20,
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
  },
  cardIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  cardDesc: {
    fontFamily: 'Syne_400Regular',
    fontSize: 13,
    color: '#6C6C6C',
    lineHeight: 18,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingBottom: 110, // Avoid overlapping with tabs
  },
  inputWrapper: {
    backgroundColor: '#111111',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 100,
    alignItems: 'flex-end',
    paddingBottom: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Syne_400Regular',
    fontSize: 16,
    color: '#fff',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 8,
  },
  plusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1d1d1d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
