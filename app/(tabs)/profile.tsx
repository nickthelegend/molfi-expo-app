import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAccount as useAppKitAccount, useAppKit } from '@reown/appkit-react-native';
import { useDisconnect, useEnsName } from 'wagmi';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { address, isConnected } = useAppKitAccount();
  const { data: ensName } = useEnsName({ address: address as `0x${string}`, chainId: 1 });
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${address || 'molfi'}`;

  const handleOpenWallet = () => {
    open();
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect",
      "Are you sure you want to disconnect your wallet?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Disconnect", 
          style: "destructive", 
          onPress: () => {
            disconnect();
            router.replace('/connect-wallet');
          } 
        }
      ]
    );
  };

  const handleFeatureNotReady = (title: string) => {
    Alert.alert("Coming Soon", `${title} is under development and will be available in the next update.`);
  };

  const handleSupport = (type: string) => {
    if (type === 'About') {
      Alert.alert("Molfi AI v1.0.4", "Molfi is the world's first AI-native crypto trading ecosystem, empowering users with autonomous agents and institutional-grade tools.");
    } else {
      Linking.openURL('https://molfi.app/support');
    }
  };

  const renderSettingItem = (
    icon: keyof typeof Ionicons.glyphMap, 
    title: string, 
    subtitle?: string, 
    onPress?: () => void
  ) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress || (() => handleFeatureNotReady(title))}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={22} color="rgba(255,255,255,0.7)" />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Branding */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image 
            source={require('@/assets/logo/logo.png')} 
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.headerTitle}>Molfi AI</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handleOpenWallet} style={styles.avatarContainer}>
            <Image 
              source={{ uri: avatarUrl }} 
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={[styles.editBadge, { backgroundColor: theme.primary }]}>
              <Ionicons name="wallet" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.displayName, isConnected && !ensName && { fontFamily: 'DMMono_400Regular', fontSize: 20 }]}>
            {isConnected ? (ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`) : 'Not Connected'}
          </Text>
          <TouchableOpacity onPress={handleOpenWallet} style={styles.walletPill}>
            <Text style={styles.walletPillText}>Manage Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Group */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupLabel}>Security & Account</Text>
          {renderSettingItem('shield-checkmark-outline', 'Security Center', 'Biometrics & Recovery')}
          {renderSettingItem('notifications-outline', 'Notifications', 'Trade alerts & News')}
          {renderSettingItem('eye-outline', 'Privacy', 'Manage visibility')}
        </View>

        <View style={styles.settingsGroup}>
          <Text style={styles.groupLabel}>Preferences</Text>
          {renderSettingItem('moon-outline', 'Appearance', 'Dark Mode')}
          {renderSettingItem('globe-outline', 'Language', 'English (US)')}
          {renderSettingItem('card-outline', 'Currency', 'USD ($)')}
        </View>

        <View style={styles.settingsGroup}>
          <Text style={styles.groupLabel}>Support</Text>
          {renderSettingItem('help-circle-outline', 'Help Center')}
          {renderSettingItem('chatbubble-ellipses-outline', 'Contact Support')}
          {renderSettingItem('information-circle-outline', 'About Molfi', undefined, () => handleSupport('About'))}
        </View>

        <TouchableOpacity 
          onPress={handleDisconnect}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Disconnect Wallet</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Molfi v1.0.4 (Beta)</Text>
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
    fontSize: 20,
    color: '#fff',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0A0A0A',
  },
  displayName: {
    fontFamily: 'Syne_700Bold',
    fontSize: 24,
    color: '#fff',
    marginBottom: 8,
  },
  walletPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  walletPillText: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 14,
    color: '#A0A0A0',
  },
  settingsGroup: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  groupLabel: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontFamily: 'Syne_600SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  settingSubtitle: {
    fontFamily: 'KHTeka',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  logoutButton: {
    marginTop: 40,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 16,
    color: '#FF3B30',
  },
  versionText: {
    fontFamily: 'KHTeka',
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
    textAlign: 'center',
    marginTop: 24,
  },
});
