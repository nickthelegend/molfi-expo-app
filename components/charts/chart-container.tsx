import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ChartContainerProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ChartContainer({ title, description, children }: ChartContainerProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        {description && (
          <Text style={[styles.description, { color: theme.textMuted }]}>{description}</Text>
        )}
      </View>
      <View style={styles.chartArea}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginVertical: 10,
    overflow: 'hidden',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Manrope-ExtraBold',
    fontSize: 18,
    marginBottom: 4,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  chartArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

