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
}

export function BodyWeightChart({ data, color = '#3b82f6', textColor = '#9ca3af', maxPoints, selectedRange }: BodyWeightChartProps) {
  
  if (!data || data.length === 0) {
    return null;
  }

  // Ensure chronological order
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const screenWidth = Dimensions.get('window').width;
  // Card has mx-4 (32) and p-4 (32) = 64 total reduction.
  // Chart has -ml-4 (-16) negative margin.
  // Let's try 50 to maximize space on the right.
  const paddingHorizontal = 75; 
  const chartWidth = screenWidth - paddingHorizontal;
  
  let spacing = 40;
  let initialSpacing = 0;
  let computedWidth = chartWidth;
  const yAxisLabelWidth = 20; // Reduced from 30 to close gap

  // If maxPoints is provided (Fixed Timeline mode), calculate exact positioning
  if (maxPoints) {
      // The drawing area is reduced by the Y Axis Width
      // AND we want 10px padding on left (after Y axis) and 10px on right
      const availableDrawingWidth = chartWidth - yAxisLabelWidth - 10; 
      const unitSpacing = availableDrawingWidth / (maxPoints - 1);
      
      // Calculate initial offset based on the first point's spine position
      const firstIndex = sortedData[0].spineIndex ?? 0;
      initialSpacing = (firstIndex * unitSpacing);
      
      // Calculate spacing for each point to bridge gaps
      sortedData.forEach((item, i) => {
          if (i < sortedData.length - 1) {
              const currentIdx = item.spineIndex ?? 0;
              const nextIdx = sortedData[i + 1].spineIndex ?? 0;
              const gap = nextIdx - currentIdx;
              // Set spacing on this item to reach the next item
              (item as any).spacing = gap * unitSpacing;
          } else {
              (item as any).spacing = unitSpacing; 
          }
      });
      
      spacing = unitSpacing;
      computedWidth = chartWidth;

  } else {
      // Logic for 'All' or variable ranges
      const numPoints = sortedData.length;
      if (numPoints > 1 && numPoints <= 32) {
          const availableDrawingWidth = chartWidth - yAxisLabelWidth - 10;
          spacing = availableDrawingWidth / (numPoints - 1);
          initialSpacing = 10;
          computedWidth = chartWidth;
      } else {
          // Dynamic right alignment for large sets
          const contentWidth = numPoints > 1 ? (numPoints - 1) * spacing : 0;
          const calculatedInitialSpacing = chartWidth - yAxisLabelWidth - 10 - contentWidth;
          initialSpacing = Math.max(10, calculatedInitialSpacing);
          computedWidth = Math.max(chartWidth, contentWidth + initialSpacing + 10);
      }
  }

  // Generate Fixed Labels if in Fixed Mode
  const fixedLabels: string[] = [];
  if (maxPoints && selectedRange && selectedRange !== 'All') {
      const now = new Date();
      // Generate 5 labels: 0%, 25%, 50%, 75%, 100%
      const indices = [0, 0.25, 0.5, 0.75, 1];
      
      indices.forEach(percent => {
          const d = new Date(now);
          if (selectedRange === 'Day') {
             // range 17 days (16 intervals)
             const daysAgo = Math.round((17 - 1) * (1 - percent));
             d.setDate(d.getDate() - daysAgo);
             fixedLabels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
          } else if (selectedRange === 'Week') {
             // range 13 weeks (12 intervals)
             const weeksAgo = Math.round((13 - 1) * (1 - percent));
             d.setDate(d.getDate() - (weeksAgo * 7));
             fixedLabels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
          } else if (selectedRange === 'Month') {
             // range 13 months (12 intervals)
             const monthsAgo = Math.round((13 - 1) * (1 - percent));
             d.setMonth(d.getMonth() - monthsAgo);
             fixedLabels.push(d.toLocaleDateString(undefined, { month: 'short' }));
          }
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
    // Try to center: start at avg - range/2, floor to 10
    const idealStart = Math.floor((avg - range / 2) / 10) * 10;
    const start = Math.max(0, idealStart); // Don't go below 0 for weight
    const end = start + range;
    
    if (minData >= start && maxData <= end) {
      stepValue = s;
      minAxis = start;
      break;
    }
  }

  const noOfSections = targetSections;
  const yAxisLabelTexts = [];
  for (let i = 0; i <= targetSections; i++) {
    yAxisLabelTexts.push((minAxis + i * stepValue).toString());
  }

  // Format for gifted-charts - SUBTRACT minAxis to ensure perfect alignment with 0-height
  const chartData = sortedData.map(item => ({
    value: item.value - minAxis + 1.5, // Small manual shift up to meet grid line
    label: item.label,
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
              top: 10, // Matches paddingTop
              left: 0,
              width: chartWidth - yAxisLabelWidth,
              height: 151, // +1 for border alignment
              borderWidth: 1,
              borderColor: textColor,
              opacity: 0.08, // Faint
            }}
          >
             {/* Vertical Lines */}
             <View style={{ position: 'absolute', left: '25%', top: 0, bottom: 0, width: 1, backgroundColor: textColor }} />
             <View style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: textColor }} />
             <View style={{ position: 'absolute', left: '75%', top: 0, bottom: 0, width: 1, backgroundColor: textColor }} />
             
             {/* Horizontal Lines */}
             <View style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: 1, backgroundColor: textColor }} />
             <View style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: textColor }} />
             <View style={{ position: 'absolute', top: '75%', left: 0, right: 0, height: 1, backgroundColor: textColor }} />
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
        dataPointsRadius={4}
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
        noOfSections={noOfSections}
        yAxisOffset={0}
        yAxisLabelTexts={yAxisLabelTexts}
        formatYLabel={(label: string) => JSON.stringify(label)}
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
