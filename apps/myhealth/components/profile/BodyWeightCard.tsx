import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ThemedView, ThemedText } from '@mycsuite/ui';
import { IconSymbol } from '../ui/icon-symbol';

interface BodyWeightCardProps {
  weight: number | null;
  onLogWeight: () => void;
}

export function BodyWeightCard({ weight, onLogWeight }: BodyWeightCardProps) {
  return (
    <ThemedView className="p-4 rounded-xl mb-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center mr-3">
                 <IconSymbol name="scalemass.fill" size={18} color="#3b82f6" />
            </View>
            <ThemedText className="font-semibold text-base">Body Weight</ThemedText>
        </View>
        <TouchableOpacity 
            onPress={onLogWeight}
            className="bg-blue-500 rounded-full p-1.5"
        >
          <IconSymbol name="plus" size={16} color="white" />
        </TouchableOpacity>
      </View>
      
      <View className="mt-2">
        {weight ? (
            <View className="flex-row items-baseline">
                <ThemedText className="text-3xl font-bold mr-1">{weight}</ThemedText>
                <Text className="text-gray-500 text-sm">lbs</Text>
            </View>
        ) : (
            <Text className="text-gray-400 text-sm italic">No weight recorded</Text>
        )}
      </View>
    </ThemedView>
  );
}
