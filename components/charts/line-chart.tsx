import React from 'react';
import { View, Dimensions } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');

interface LineChartProps {
  data: any[];
  config?: any;
}

export function LineChart({ data, config }: LineChartProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  // Map input data to GiftedLineChart format
  const chartData = data.map(item => ({
    value: item.y,
    label: item.x,
    dataPointText: item.y.toString(),
  }));

  return (
    <View style={{ marginLeft: -20 }}>
      <GiftedLineChart
        data={chartData}
        height={config?.height || 200}
        width={width - 80}
        initialSpacing={20}
        color={theme.primary}
        thickness={3}
        hideRules={!config?.showGrid}
        hideYAxisText={!config?.showYLabels}
        yAxisColor={theme.border}
        xAxisColor={theme.border}
        yAxisTextStyle={{ color: theme.textMuted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: theme.textMuted, fontSize: 10 }}
        dataPointsColor={theme.primary}
        dataPointsRadius={4}
        focusedDataPointColor={theme.text}
        showStripOnFocus={config?.interactive}
        showTextOnFocus={config?.interactive}
        pointerConfig={config?.interactive ? {
          pointerStripHeight: 160,
          pointerStripColor: 'rgba(255,255,255,0.2)',
          pointerStripWidth: 2,
          pointerColor: theme.primary,
          radius: 6,
          pointerLabelComponent: (items: any) => {
            return (
              <View style={{
                backgroundColor: theme.surface,
                padding: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
              }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary, marginBottom: 4 }} />
                <View style={{ color: theme.text, fontWeight: 'bold' }}>
                  {items[0].value}
                </View>
              </View>
            );
          },
        } : undefined}
        curved={true}
        animateOnDataChange={config?.animated}
        animationDuration={config?.duration || 1000}
        areaChart={true}
        startFillColor={theme.primary}
        startOpacity={0.2}
        endFillColor={theme.primary}
        endOpacity={0.01}
      />
    </View>
  );
}
