import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';
import { BodyWeightChart } from './BodyWeightChart';
import { SegmentedControl, SegmentedControlOption } from '../ui/SegmentedControl';

// Defined locally to avoid circular dependencies if any
type DateRange = 'Day' | 'Week' | 'Month' | 'Year';

const RANGE_OPTIONS: SegmentedControlOption<DateRange>[] = [
  { label: 'Day', value: 'Day' },
  { label: 'Week', value: 'Week' },
  { label: 'Month', value: 'Month' },
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
    
    if (selectedRange === 'Day') {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    if (selectedRange === 'Week') {
      const end = new Date(date);
      end.setDate(date.getDate() + 6);
      return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    }
    
    if (selectedRange === 'Month') {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }

    if (selectedRange === 'Year') {
      return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View className="p-4 rounded-xl mb-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center mr-3">
                 <IconSymbol name="scalemass.fill" size={18} color="#3b82f6" />
            </View>
            <Text className="font-semibold text-base text-gray-900 dark:text-white">Body Weight</Text>
        </View>
        <Pressable 
            onPress={onLogWeight}
            className="bg-blue-500 rounded-full p-1.5"
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
                            <Text className="text-3xl font-bold mr-1 text-gray-900 dark:text-white">{displayWeight}</Text>
                            <Text className="text-gray-500 text-sm">lbs</Text>
                        </View>
                        <Text className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
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
                    maxPoints={selectedRange === 'Day' ? 17 : selectedRange === 'Week' ? 13 : selectedRange === 'Month' ? 33 : 13} // Year is also 13 (months)
                    selectedRange={selectedRange}
                    onPointSelect={(point) => setSelectedPoint(point)}
                />
            </View>
        ) : (
            <Text className="text-gray-400 text-sm italic">No weight recorded</Text>
        )}
      </View>
    </View>
  );
}
