import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';


interface RoutineCardProps {
  routine: {
    id: string;
    name: string;
    sequence: any[];
    createdAt: string;
  };
  onPress: () => void;
  onLongPress?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function RoutineCard({ routine, onPress, onLongPress, onDelete, onEdit }: RoutineCardProps) {
  const workoutCount = routine.sequence.filter((s) => s.type === 'workout').length;
  const totalDays = routine.sequence.length;

  return (
    <TouchableOpacity
      className="bg-surface dark:bg-surface_dark rounded-xl p-3 w-full mb-2.5 border border-black/5 dark:border-white/10 justify-between min-h-[90px] shadow-sm"
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View className="mb-1 flex-row justify-between items-center">
        <Text className="text-base font-bold text-apptext dark:text-apptext_dark flex-1" numberOfLines={1}>
          {routine.name}
        </Text>
        <View className="flex-row gap-1">
            {onEdit && (
                <TouchableOpacity 
                    onPress={(e) => { 
                        onEdit(); 
                    }} 
                    className="p-1 mr-1"
                >
                    <Text className="text-primary dark:text-primary_dark text-sm font-semibold">Edit</Text>
                </TouchableOpacity>
            )}
            {onDelete && (
                 <TouchableOpacity 
                    onPress={(e) => { 
                        onDelete(); 
                    }} 
                    className="p-1"
                >
                    <Text className="text-gray-500 text-lg">×</Text>
                </TouchableOpacity>
            )}
        </View>
      </View>
      
      <View className="flex-1">
        <Text className="text-xs text-gray-500 mb-0.5">
          {totalDays} Days • {workoutCount} Workouts
        </Text>
        {/* Preview of first few days could go here if we had space */}
      </View>

      <View className="mt-2 flex-row justify-end">
        <Text className="text-primary dark:text-primary_dark font-semibold text-sm">Set Active</Text>
      </View>
    </TouchableOpacity>
  );
}
