import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
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

interface AgentItemProps {
  name: string;
  created: string;
  value: string;
  change: string;
}

function AgentItem({ name, created, value, change }: AgentItemProps) {
  return (
    <TouchableOpacity style={styles.agentCard}>
      <View style={styles.agentInfo}>
        <Text style={styles.agentName}>{name}</Text>
        <Text style={styles.agentCreated}>{created}</Text>
      </View>
      <View style={styles.agentStats}>
        <Text style={styles.agentValue}>{value}</Text>
        <Text style={styles.agentChange}>{change}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AgentsScreen() {
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
          <Text style={styles.headerTitle}>Agents</Text>
        </View>
        
        <TouchableOpacity style={styles.cartButton}>
          <Ionicons name="cart-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Featured Card */}
        <View style={[styles.featuredCard, { backgroundColor: theme.primary }]}>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>Deploy autonomous capital intelligence</Text>
            
            <TouchableOpacity style={styles.newAgentButton}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.newAgentText}>New agent</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.robotIllustration}>
            <Ionicons name="hardware-chip" size={120} color="rgba(0,0,0,0.1)" />
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity style={[styles.filterPill, styles.filterPillActive]}>
            <Text style={styles.filterTextActive}>Created by me</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterPill}>
            <Text style={styles.filterText}>Public Agents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterPill}>
            <Text style={styles.filterText}>Published</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Agent List */}
        <View style={styles.agentList}>
          <AgentItem 
            name="Agent #3" 
            created="Created 2weeks ago" 
            value="$102.34" 
            change="+2.45%" 
          />
          <AgentItem 
            name="Alpha Strategy" 
            created="Created 3 days ago" 
            value="$452.10" 
            change="+5.12%" 
          />
          <AgentItem 
            name="Liquid Bot" 
            created="Created 1 month ago" 
            value="$1,204.00" 
            change="-1.20%" 
          />
        </View>
      </ScrollView>
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
    gap: 12,
  },
  logo: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 24,
    color: '#fff',
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1d1d1d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  featuredCard: {
    width: '100%',
    height: 200,
    borderRadius: 32,
    padding: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 30,
  },
  featuredContent: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
  },
  featuredTitle: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 24,
    color: '#fff',
    lineHeight: 32,
    marginBottom: 20,
  },
  newAgentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 8,
  },
  newAgentText: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  robotIllustration: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.5,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#111',
  },
  filterPillActive: {
    backgroundColor: '#1d1d1d',
  },
  filterText: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 14,
    color: '#6C6C6C',
  },
  filterTextActive: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  agentList: {
    gap: 12,
  },
  agentCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontFamily: 'Syne_700Bold',
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
  },
  agentCreated: {
    fontFamily: 'Syne_400Regular',
    fontSize: 14,
    color: '#6C6C6C',
  },
  agentStats: {
    alignItems: 'flex-end',
  },
  agentValue: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 18,
    color: '#fff',
    marginBottom: 4,
  },
  agentChange: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 14,
    color: '#4CAF50',
  },
});
