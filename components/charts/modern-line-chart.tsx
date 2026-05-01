import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width } = Dimensions.get('window');

interface ModernLineChartProps {
  data: any[];
  height?: number;
  color?: string;
  hideYAxis?: boolean;
}

export function ModernLineChart({ data, height = 240, color, hideYAxis = false }: ModernLineChartProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const primaryColor = color || theme.primary;

  const chartData = data.map(item => ({
    value: typeof item.y === 'number' ? item.y : parseFloat(item.y || 0),
    label: item.x || '',
    dataPointText: item.label || (item.y ? item.y.toLocaleString() : ''),
  }));

  if (!chartData.length) return null;

  return (
    <View style={{ marginLeft: -20 }}>
      <GiftedLineChart
        areaChart
        curved
        data={chartData}
        height={height}
        width={width - 40}
        initialSpacing={30}
        spacing={ (width - 100) / (data.length > 1 ? data.length - 1 : 1) }
        color={primaryColor}
        thickness={3}
        startFillColor={primaryColor}
        endFillColor={primaryColor}
        startOpacity={0.25}
        endOpacity={0.01}
        gradientColor={primaryColor}
        noOfSections={4}
        yAxisColor="transparent"
        xAxisColor="transparent"
        rulesColor="rgba(255,255,255,0.03)"
        rulesType="solid"
        hideYAxisText={hideYAxis}
        yAxisTextStyle={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontFamily: 'Inter-Medium' }}
        xAxisLabelTextStyle={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, fontFamily: 'Inter-Medium' }}
        hideDataPoints={false}
        dataPointsColor={primaryColor}
        dataPointsRadius={4}
        focusedDataPointColor="#fff"
        focusedDataPointRadius={6}
        showVerticalLines={false}
        pointerConfig={{
          pointerStripHeight: height,
          pointerStripColor: 'rgba(255,255,255,0.1)',
          pointerStripWidth: 2,
          pointerColor: primaryColor,
          radius: 6,
          pointerLabelComponent: (items: any) => {
            return (
              <View style={{
                backgroundColor: '#121212',
                padding: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                minWidth: 110,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 12,
                elevation: 10,
                marginLeft: -55, // Center the tooltip
              }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Inter-Medium', marginBottom: 2 }}>
                  {items[0].label || 'Value'}
                </Text>
                <Text style={{ color: '#FFF', fontSize: 16, fontFamily: 'Manrope-ExtraBold' }}>
                  {items[0].value.toLocaleString()}
                </Text>
              </View>
            );
          },
        }}
      />
    </View>
  );
}
