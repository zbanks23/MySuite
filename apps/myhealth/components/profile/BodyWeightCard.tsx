import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';
import { BodyWeightChart } from './BodyWeightChart';
import { SegmentedControl, SegmentedControlOption } from '../ui/SegmentedControl';

// Defined locally to avoid circular dependencies if any
type DateRange = 'Day' | 'Week' | 'Month' | 'All';

const RANGE_OPTIONS: SegmentedControlOption<DateRange>[] = [
  { label: 'Day', value: 'Day' },
  { label: 'Week', value: 'Week' },
  { label: 'Month', value: 'Month' },
  { label: 'All', value: 'All' },
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
  const [hoveredWeight, setHoveredWeight] = React.useState<number | null>(null);

  React.useEffect(() => {
    setHoveredWeight(null);
  }, [selectedRange]);

  const displayWeight = hoveredWeight ?? weight;

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
                    <View className="flex-row items-baseline">
                        <Text className="text-3xl font-bold mr-1 text-gray-900 dark:text-white">{displayWeight}</Text>
                        <Text className="text-gray-500 text-sm">lbs</Text>
                        {hoveredWeight && (
                            <View className="ml-2 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40">
                                <Text className="text-[10px] font-bold text-blue-600 dark:text-blue-400">SELECTED</Text>
                            </View>
                        )}
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
                    maxPoints={selectedRange === 'Day' ? 17 : selectedRange === 'Week' ? 13 : selectedRange === 'Month' ? 13 : undefined}
                    selectedRange={selectedRange}
                    onPointSelect={(val) => setHoveredWeight(val)}
                />
            </View>
        ) : (
            <Text className="text-gray-400 text-sm italic">No weight recorded</Text>
        )}
      </View>
    </View>
  );
}
