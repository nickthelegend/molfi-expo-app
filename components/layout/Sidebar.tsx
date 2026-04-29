import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit-react-native';

interface SidebarItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}

function SidebarItem({ icon, active, onPress }: SidebarItemProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={styles.itemContainer}
    >
      {active && (
        <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />
      )}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons 
          name={icon} 
          size={24} 
          color={active ? theme.primary : '#6C6C6C'} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

interface SidebarProps {
  activeRoute: string;
  onNavigate: (route: string) => void;
}

export function Sidebar({ activeRoute, onNavigate }: SidebarProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { address } = useAccount();
  const { open } = useAppKit();

  const avatarUrl = address 
    ? `https://api.dicebear.com/7.x/pixel-art/svg?seed=${address}`
    : `https://api.dicebear.com/7.x/pixel-art/svg?seed=molfi`;

  return (
    <View style={[
      styles.sidebar, 
      { 
        backgroundColor: '#1d1d1d', // card color
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        borderRightColor: 'rgba(255, 255, 255, 0.05)',
      }
    ]}>
      <TouchableOpacity style={styles.logoContainer} onPress={() => onNavigate('Home')}>
        <Image 
          source={require('@/assets/logo/logo.png')} 
          style={styles.logoImage}
          contentFit="contain"
        />
      </TouchableOpacity>

      <View style={styles.navItems}>
        <SidebarItem 
          icon="chatbubble-ellipses-outline" 
          active={activeRoute === 'Chat'} 
          onPress={() => onNavigate('Chat')} 
        />
        <SidebarItem 
          icon="add-circle-outline" 
          active={activeRoute === 'New'} 
          onPress={() => onNavigate('New')} 
        />
        <SidebarItem 
          icon="time-outline" 
          active={activeRoute === 'History'} 
          onPress={() => onNavigate('History')} 
        />
        <SidebarItem 
          icon="hardware-chip-outline" 
          active={activeRoute === 'Agents'} 
          onPress={() => onNavigate('Agents')} 
        />
        <SidebarItem 
          icon="wallet-outline" 
          active={activeRoute === 'Wallet'} 
          onPress={() => onNavigate('Wallet')} 
        />
        <SidebarItem 
          icon="trending-up-outline" 
          active={activeRoute === 'Markets'} 
          onPress={() => onNavigate('Markets')} 
        />
        <SidebarItem 
          icon="diamond-outline" 
          active={activeRoute === 'Premium'} 
          onPress={() => onNavigate('Premium')} 
        />
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.avatarContainer} onPress={() => open()}>
          <Image 
            source={{ uri: avatarUrl }} 
            style={styles.avatarImage}
            contentFit="cover"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  sidebar: {
    width: 64,
    height: '100%',
    borderRightWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  logoContainer: {
    height: 48,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  navItems: {
    gap: 20,
  },
  itemContainer: {
    width: 64,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    width: 3,
    height: 24,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  bottomContainer: {
    marginBottom: 10,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
