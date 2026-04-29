import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const INACTIVE_COLOR = 'rgba(255, 255, 255, 0.35)';

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  activeName: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
}

function TabIcon({ name, activeName, focused, color }: TabIconProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.2 : 1, {
      damping: 12,
      stiffness: 150,
    });
    opacity.value = withTiming(focused ? 1 : 0, {
      duration: 250,
    });
  }, [focused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedPillStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: withSpring(focused ? 1 : 0.8) }],
  }));

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={[styles.activePill, { backgroundColor: `${color}26` }, animatedPillStyle]} />
      <Animated.View style={animatedIconStyle}>
        <Ionicons 
          name={focused ? activeName : name} 
          size={24} 
          color={color} 
        />
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          position: 'absolute',
          bottom: 24 + insets.bottom / 2,
          marginHorizontal: 16,
          height: 64,
          borderRadius: 32,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          paddingBottom: 0,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.07)',
          overflow: 'hidden',
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              name="home-outline" 
              activeName="home" 
              focused={focused} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              name="pie-chart-outline" 
              activeName="pie-chart" 
              focused={focused} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              name="search-outline" 
              activeName="search" 
              focused={focused} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              name="hardware-chip-outline" 
              activeName="hardware-chip" 
              focused={focused} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused, color }) => (
            <TabIcon 
              name="person-outline" 
              activeName="person" 
              focused={focused} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePill: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});
