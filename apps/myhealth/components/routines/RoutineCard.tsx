import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { RaisedCard } from '../../../../packages/ui/RaisedCard';


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
    <RaisedCard onDelete={onDelete} onEdit={onEdit}>
      <View className="flex-row justify-between items-center mb-0">
        <TouchableOpacity 
            className="flex-1 mr-2"
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <Text className="text-lg font-bold text-light dark:text-dark mb-1" numberOfLines={1}>
            {routine.name}
            </Text>
            <Text className="text-sm text-light-muted dark:text-dark-muted">
            {totalDays} Days • {workoutCount} Workouts
            </Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
            <TouchableOpacity 
                onPress={onPress}
                className="bg-primary dark:bg-primary-dark px-4 py-2 rounded-lg"
            >
                <Text className="text-white font-semibold">Set Active</Text>
            </TouchableOpacity>
        </View>
      </View>
    </RaisedCard>
  );
}
