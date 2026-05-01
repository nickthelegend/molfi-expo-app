import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');

interface AreaChartProps {
  data: any[];
  config?: any;
}

export function AreaChart({ data, config }: AreaChartProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  // Map input data to GiftedLineChart format for Area Chart
  const chartData = data.map(item => ({
    value: item.y,
    label: item.x,
    dataPointText: item.label || item.y.toString(),
  }));

  return (
    <View style={{ marginLeft: -20 }}>
      <GiftedLineChart
        areaChart
        data={chartData}
        LinearGradient={LinearGradient}
        height={config?.height || 240}
        width={width - 40}
        initialSpacing={20}
        spacing={width / (data.length || 1) - 10}
        color={theme.primary}
        thickness={3}
        startFillColor={theme.primary}
        endFillColor={theme.primary}
        startOpacity={0.3}
        endOpacity={0.01}
        
        // Grid & Rules (Low Intensity)
        hideRules={!config?.showGrid}
        rulesColor="rgba(255,255,255,0.05)"
        rulesType="solid"
        
        // Axes
        yAxisColor="transparent"
        xAxisColor="rgba(255,255,255,0.05)"
        hideYAxisText={!config?.showYLabels}
        yAxisTextStyle={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Inter-Medium' }}
        xAxisLabelTextStyle={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: 'Inter-Medium' }}
        
        // Interactivity
        pointerConfig={{
          pointerStripHeight: 160,
          pointerStripColor: 'rgba(255,255,255,0.1)',
          pointerStripWidth: 2,
          pointerColor: theme.primary,
          radius: 6,
          pointerLabelComponent: (items: any) => {
            return (
              <View style={{
                backgroundColor: '#1A1A1A',
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Inter-Regular', marginBottom: 4 }}>
                  {items[0].label}
                </Text>
                <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Inter-Medium', fontWeight: 'bold' }}>
                  ${items[0].value.toLocaleString()}
                </Text>
              </View>
            );
          },
        }}
        
        curved
        animateOnDataChange={config?.animated}
        animationDuration={config?.duration || 1500}
      />
    </View>
  );
}

