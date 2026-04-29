import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width: windowWidth } = Dimensions.get('window');

export function TokenChart() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const data = [
    { value: 15, date: '1d' },
    { value: 30, date: '2d' },
    { value: 26, date: '3d' },
    { value: 40, date: '4d' },
    { value: 45, date: '5d' },
    { value: 30, date: '6d' },
    { value: 35, date: '7d' },
    { value: 50, date: '8d' },
  ];

  return (
    <View style={styles.container}>
      <LineChart
        data={data}
        width={windowWidth - 32}
        height={200}
        color={theme.primary}
        thickness={3}
        startFillColor={theme.primary}
        endFillColor="transparent"
        startOpacity={0.2}
        endOpacity={0}
        initialSpacing={0}
        noOfSections={4}
        yAxisColor="transparent"
        xAxisColor="transparent"
        yAxisTextStyle={{ color: '#6C6C6C', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: '#6C6C6C', fontSize: 10 }}
        hideDataPoints
        curved
        areaChart
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
