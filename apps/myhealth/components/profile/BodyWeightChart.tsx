import React from 'react';
import { View, Dimensions, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

type DateRange = 'Day' | 'Week' | 'Month' | 'All';

interface BodyWeightChartProps {
  data: { value: number; label: string; date: string; spineIndex?: number }[];
  color?: string;
  textColor?: string;
  maxPoints?: number;
  selectedRange?: DateRange;
  onPointSelect?: (value: number | null) => void;
}

export function BodyWeightChart({ data, color = '#3b82f6', textColor = '#9ca3af', maxPoints, selectedRange, onPointSelect }: BodyWeightChartProps) {
  
  if (!data || data.length === 0) {
    return null;
  }

  // Ensure chronological order
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const screenWidth = Dimensions.get('window').width;
  const paddingHorizontal = 75; // Card mx-4 (32) + p-4 (32) + buffer
  const yAxisLabelWidth = 20;
  const chartWidth = screenWidth - paddingHorizontal;
  const DRAWING_PADDING = 10;
  const availableDrawingWidth = chartWidth - yAxisLabelWidth - DRAWING_PADDING;

  let spacing = 40;
  let initialSpacing = DRAWING_PADDING;
  let computedWidth = chartWidth;

  if (maxPoints || (sortedData.length > 1 && sortedData.length <= 32)) {
    const pointsCount = maxPoints || sortedData.length;
    const unitSpacing = availableDrawingWidth / (pointsCount - 1);
    
    spacing = unitSpacing;
    initialSpacing = (sortedData[0].spineIndex ?? (maxPoints ? 0 : 0)) * unitSpacing + (maxPoints ? 0 : DRAWING_PADDING);
    
    // In fixed timeline mode, initialSpacing starts from 0 (relative to drawing area)
    if (maxPoints) initialSpacing = (sortedData[0].spineIndex ?? 0) * unitSpacing;

    sortedData.forEach((item, i) => {
      const currentIdx = item.spineIndex ?? i;
      const nextIdx = sortedData[i + 1]?.spineIndex ?? (currentIdx + 1);
      (item as any).spacing = (nextIdx - currentIdx) * unitSpacing;
    });
  } else {
    // Large dataset ('All' range)
    const contentWidth = (sortedData.length - 1) * spacing;
    const calculatedInitialSpacing = availableDrawingWidth - contentWidth;
    initialSpacing = Math.max(DRAWING_PADDING, calculatedInitialSpacing);
    computedWidth = Math.max(chartWidth, contentWidth + initialSpacing + DRAWING_PADDING);
  }

  // Generate Fixed Labels if in Fixed Mode
  const fixedLabels: string[] = [];
  if (maxPoints && selectedRange && selectedRange !== 'All') {
    const now = new Date();
    const config = {
      Day: { count: 17, unit: 'date' as const },
      Week: { count: 13, unit: 'week' as const },
      Month: { count: 13, unit: 'month' as const },
    };
    
    const { count, unit } = config[selectedRange as keyof typeof config];
    [0, 0.25, 0.5, 0.75, 1].forEach(percent => {
      const d = new Date(now);
      const unitsAgo = Math.round((count - 1) * (1 - percent));
      if (unit === 'date') d.setDate(d.getDate() - unitsAgo);
      else if (unit === 'week') d.setDate(d.getDate() - unitsAgo * 7);
      else if (unit === 'month') d.setMonth(d.getMonth() - unitsAgo);
      
      fixedLabels.push(d.toLocaleDateString(undefined, unit === 'month' ? { month: 'short' } : { month: 'short', day: 'numeric' }));
    });
  }

  // Calculate Y-Axis bounds centered on average
  const values = sortedData.map(d => d.value);
  const minData = Math.min(...values);
  const maxData = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  
  const targetSections = 4;
  let stepValue = 10;
  let minAxis = 0;

  // Search for the smallest stepValue (10, 20, 30...) that fits the data centered on avg
  for (let s = 10; s <= 1000; s += 10) {
    const range = s * targetSections;
    const start = Math.max(0, Math.floor((avg - range / 2) / 10) * 10);
    if (minData >= start && maxData <= start + range) {
      stepValue = s;
      minAxis = start;
      break;
    }
  }

  const yAxisLabelTexts = Array.from({ length: targetSections + 1 }, (_, i) => (minAxis + i * stepValue).toString());

  // Format for gifted-charts - SUBTRACT minAxis to ensure perfect alignment with 0-height
  const chartData = sortedData.map(item => ({
    value: item.value - minAxis + 1.5, // Small manual shift up to meet grid line
    label: item.label,
    realValue: item.value,
    dataPointText: '', 
    spacing: (item as any).spacing, // Pass calculated spacing
  }));

  return (
    <View style={{ paddingTop: 10, paddingBottom: 16 }}>
      {/* Grid Overlay for Fixed Timeline */}
      {maxPoints && (
          <View 
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 10,
              left: 0,
              width: chartWidth - yAxisLabelWidth,
              height: 151,
              borderWidth: 1,
              borderColor: textColor,
              opacity: 0.08,
            }}
          >
             {/* Cross-hair Style Grid */}
             {[0.25, 0.5, 0.75].map(p => (
               <React.Fragment key={p}>
                 <View style={{ position: 'absolute', left: `${p * 100}%`, top: 0, bottom: 0, width: 1, backgroundColor: textColor }} />
                 <View style={{ position: 'absolute', top: `${p * 100}%`, left: 0, right: 0, height: 1, backgroundColor: textColor }} />
               </React.Fragment>
             ))}
          </View>
      )}
      <LineChart
        data={chartData}
        color={color}
        thickness={3}
        startFillColor={color}
        endFillColor={color}
        startOpacity={0.2}
        endOpacity={0.0}
        areaChart
        yAxisThickness={0}
        xAxisThickness={0}
        xAxisLabelTextStyle={{ color: maxPoints ? 'transparent' : textColor, fontSize: 10, width: 40 }}
        yAxisTextStyle={{ 
          color: textColor, 
          fontSize: 10,
          transform: [{ translateY: -6 }] // Center numbers on grid lines
        }}
        yAxisLabelContainerStyle={{ justifyContent: 'center' }}
        {...({ containerToDataUpperPadding: 0 } as any)} // Force-remove internal top offset
        hideRules
        hideDataPoints={false}
        dataPointsColor={color}
        dataPointsRadius={6}
        width={computedWidth}
        height={150}
        spacing={spacing}
        initialSpacing={initialSpacing}
        endSpacing={0}
        curved
        scrollToEnd={!maxPoints}
        disableScroll={!!maxPoints}
        yAxisLabelWidth={yAxisLabelWidth}
        yAxisSide={1}
        maxValue={stepValue * targetSections}
        noOfSections={targetSections}
        yAxisOffset={0}
        yAxisLabelTexts={yAxisLabelTexts}
        formatYLabel={(label: string) => JSON.stringify(label)}
        focusEnabled
        showStripOnFocus
        pointerConfig={{
          pointerStripUptoDataPoint: true,
          pointerStripColor: textColor,
          pointerStripWidth: 1,
          strokeDashArray: [2, 4],
          pointerColor: color,
          radius: 5,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerVibrateOnPress: true,
          pointerOnPress: true,
          persistPointer: true,
          onPointerChange: (items: any) => {
            if (items && items.length > 0) {
              onPointSelect?.(items[0].realValue);
            } else {
              onPointSelect?.(null);
            }
          },
        }}
      />
      {/* Custom X-Axis Labels for Fixed Timeline */}
      {maxPoints && fixedLabels.length > 0 && (
          <View 
            style={{ 
                width: chartWidth - yAxisLabelWidth, // Drawing area width
                marginLeft: 0, // Starts at left edge
                paddingLeft: 0, 
                paddingRight: 0 
            }} 
            className="flex-row justify-between -mt-1"
          >
              {fixedLabels.map((label, idx) => (
                  <View key={idx} style={{ width: 40, alignItems: idx === 0 ? 'flex-start' : idx === 4 ? 'flex-end' : 'center' }}>
                    <Text className="text-[10px]" style={{ color: textColor }}>{label}</Text>
                  </View>
              ))}
          </View>
      )}
    </View>
  );
}
