import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width: windowWidth } = Dimensions.get('window');
const SIDEBAR_WIDTH = 64;
const SWITCHER_WIDTH = windowWidth - SIDEBAR_WIDTH - 32; // 16 padding on each side

interface TabSwitcherProps {
  activeTab: 'Assets' | 'Timeline';
  onTabChange: (tab: 'Assets' | 'Timeline') => void;
}

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const tabX = useRef(new Animated.Value(activeTab === 'Assets' ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(tabX, {
      toValue: activeTab === 'Assets' ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  const translateX = tabX.interpolate({
    inputRange: [0, 1],
    outputRange: [4, (SWITCHER_WIDTH / 2)],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.switcher, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
        <Animated.View 
          style={[
            styles.indicator, 
            { 
              backgroundColor: theme.primary,
              transform: [{ translateX }]
            }
          ]} 
        />
        <TouchableOpacity 
          style={styles.tab} 
          onPress={() => onTabChange('Assets')}
          activeOpacity={1}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'Assets' ? '#fff' : '#A0A0A0' }
          ]}>Assets</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tab} 
          onPress={() => onTabChange('Timeline')}
          activeOpacity={1}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'Timeline' ? '#fff' : '#A0A0A0' }
          ]}>Timeline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  switcher: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    padding: 4,
    alignItems: 'center',
    width: SWITCHER_WIDTH,
  },
  indicator: {
    position: 'absolute',
    width: (SWITCHER_WIDTH / 2) - 4,
    height: 40,
    borderRadius: 20,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
  },
});

