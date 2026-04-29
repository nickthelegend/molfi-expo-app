import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';

export interface TimelineData {
  id: string;
  ticker: string;
  pnl: string;
  time: string;
  status?: string;
  color: string;
  pct?: string;
}

interface TimelineItemProps {
  item: TimelineData;
  index: number;
}

export function TimelineItem({ item, index }: TimelineItemProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const isPositive = item.pnl.startsWith('+');

  return (
    <TouchableOpacity onPress={() => router.push(`/token/${item.id}`)} activeOpacity={0.7}>
      <Animated.View 
        style={[
          styles.container, 
          { 
            backgroundColor: '#1d1d1d', 
            opacity: fadeAnim 
          }
        ]}
      >

      <View style={[styles.icon, { backgroundColor: item.color }]}>
        <Text style={styles.iconText}>{item.ticker[0]}</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.ticker}>{item.ticker}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.pnl, { color: isPositive ? '#4CAF50' : '#FF3B30' }]}>
          {item.pnl}
        </Text>
        {item.status && (
          <View style={[
            styles.statusBadge, 
            { backgroundColor: item.status === 'Transfer' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(255, 255, 255, 0.05)' }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: item.status === 'Transfer' ? '#2196F3' : '#A0A0A0' }
            ]}>
              {item.status}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#fff',
    fontFamily: 'Syne_700Bold',
    fontSize: 20,
  },
  middle: {
    flex: 1,
    marginLeft: 16,
  },
  ticker: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  time: {
    fontFamily: 'Syne_400Regular',
    fontSize: 12,
    color: '#6C6C6C',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  pnl: {
    fontFamily: 'DMMono_400Regular',
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontFamily: 'Syne_400Regular',
    fontSize: 10,
    fontWeight: '600',
  },
});
