import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface KeeperHubCardProps {
  payload: any;
}

export const KeeperHubCard: React.FC<KeeperHubCardProps> = ({ payload }) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const [status, setStatus] = useState<'idle' | 'executing' | 'done'>('idle');

  const intentPayload = payload.intentPayload || payload;
  const config = intentPayload.plan.steps[0].params;

  const handleExecute = async () => {
    setStatus('executing');
    await new Promise(r => setTimeout(r, 2000));
    setStatus('done');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: 'rgba(173,70,255,0.2)' }]}>
      <View style={styles.header}>
        <View style={styles.protocolBadge}>
          <Ionicons name="layers-outline" size={12} color={theme.primary} />
          <Text style={[styles.protocolText, { color: theme.primary }]}>KEEPERHUB</Text>
        </View>
        <Text style={[styles.pluginText, { color: theme.textMuted }]}>{config.plugin.toUpperCase()}</Text>
      </View>

      <Text style={[styles.actionTitle, { color: theme.text }]}>{config.action.toUpperCase()}</Text>
      
      <View style={styles.paramsGrid}>
        {Object.entries(config.params).map(([key, val]: [string, any]) => (
          <View key={key} style={[styles.paramItem, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
            <Text style={[styles.paramLabel, { color: theme.textMuted }]}>{key.toUpperCase()}</Text>
            <Text style={[styles.paramValue, { color: theme.text }]} numberOfLines={1}>{String(val)}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.reasoningBox, { backgroundColor: 'rgba(173,70,255,0.05)' }]}>
        <Text style={[styles.reasoningText, { color: theme.textMuted }]}>{intentPayload.reasoning}</Text>
      </View>

      {status === 'done' ? (
        <View style={[styles.successBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.successText}>PROTOCOL ACTION SUCCESS</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleExecute}
          disabled={status === 'executing'}
        >
          {status === 'executing' ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={18} color="#000" />
              <Text style={styles.buttonText}>EXECUTE INTENT</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  protocolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(173,70,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  protocolText: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 10,
    letterSpacing: 1,
  },
  pluginText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 10,
  },
  actionTitle: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 22,
    marginBottom: 16,
  },
  paramsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  paramItem: {
    flex: 1,
    minWidth: '45%',
    padding: 10,
    borderRadius: 12,
  },
  paramLabel: {
    fontFamily: 'Manrope-Bold',
    fontSize: 8,
    marginBottom: 2,
  },
  paramValue: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
  },
  reasoningBox: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 20,
  },
  reasoningText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  button: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 14,
    color: '#000',
  },
  successBox: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  successText: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 12,
    color: '#10B981',
  }
});
