import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';
import { BodyWeightChart } from './BodyWeightChart';
import { SegmentedControl, SegmentedControlOption } from '../ui/SegmentedControl';
import { RaisedCard } from '../../../../packages/ui/RaisedCard';

// Defined locally to avoid circular dependencies if any
type DateRange = 'Week' | 'Month' | '6Month' | 'Year';

const RANGE_OPTIONS: SegmentedControlOption<DateRange>[] = [
  { label: 'Week', value: 'Week' },
  { label: 'Month', value: 'Month' },
  { label: '6M', value: '6Month' },
  { label: 'Year', value: 'Year' },
];

interface BodyWeightCardProps {
  weight: number | null;
  history: { value: number; label: string; date: string; spineIndex?: number }[];
  onLogWeight: () => void;
  selectedRange: DateRange;
  onRangeChange: (range: DateRange) => void;
  primaryColor?: string;
  textColor?: string;
}

export function BodyWeightCard({ 
  weight, 
  history, 
  onLogWeight,
  selectedRange,
  onRangeChange,
  primaryColor,
  textColor,
}: BodyWeightCardProps) {
  const [selectedPoint, setSelectedPoint] = React.useState<{ value: number; date: string } | null>(null);

  React.useEffect(() => {
    setSelectedPoint(null);
  }, [selectedRange]);

  const displayWeight = selectedPoint ? selectedPoint.value : weight;

  const getSelectionLabel = () => {
    if (!selectedPoint) return 'Latest Weight';
    
    const d = new Date(selectedPoint.date);
    const date = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    
    if (selectedRange === 'Week' || selectedRange === 'Month') {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    if (selectedRange === '6Month') {
      const end = new Date(date);
      end.setDate(date.getDate() + 6);
      return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
    
    if (selectedRange === 'Year') {
      return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <RaisedCard className="p-4 mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                 <IconSymbol name="scalemass.fill" size={18} color={primaryColor || '#3b82f6'} />
            </View>
            <Text className="font-semibold text-base text-light dark:text-dark">Body Weight</Text>
        </View>
        <Pressable 
            onPress={onLogWeight}
            style={{ backgroundColor: primaryColor }}
            className="rounded-full p-1.5"
        >
          <IconSymbol name="plus" size={16} color="white" />
        </Pressable>
      </View>
      
      <View className="mt-2">
        {displayWeight ? (
            <View>
                <View className="flex-row justify-between items-end mb-4">
                    <View>
                        <View className="flex-row items-baseline">
                            <Text className="text-3xl font-bold mr-1 text-light dark:text-dark">{displayWeight}</Text>
                            <Text className="text-light-muted dark:text-dark-muted text-sm">lbs</Text>
                        </View>
                        <Text className="text-[11px] font-medium text-light-muted dark:text-dark-muted mt-0.5">
                            {getSelectionLabel()}
                        </Text>
                    </View>
                    
                    <SegmentedControl
                        options={RANGE_OPTIONS}
                        value={selectedRange}
                        onChange={onRangeChange}
                    />
                </View>
                <BodyWeightChart 
                    data={history} 
                    color={primaryColor}
                    textColor={textColor}
                    maxPoints={
                        selectedRange === 'Week' ? 7 : 
                        selectedRange === 'Month' ? 31 : 
                        selectedRange === '6Month' ? 26 : 
                        12
                    }
                    selectedRange={selectedRange}
                    onPointSelect={(point) => setSelectedPoint(point)}
                />
            </View>
        ) : (
            <Text className="text-gray-400 text-sm italic">No weight recorded</Text>
        )}
      </View>
    </RaisedCard>
  );
}
