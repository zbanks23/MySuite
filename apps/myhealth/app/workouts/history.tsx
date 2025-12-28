import React, { useState } from 'react';
import { Text, View, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { useWorkoutManager } from '../../hooks/workouts/useWorkoutManager';
import { WorkoutDetailsModal } from '../../components/workouts/WorkoutDetailsModal';
import { ActionCard } from '@mysuite/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

const WorkoutHistoryItem = ({ item, onDelete, onPress }: { item: any, onDelete: () => void, onPress: () => void }) => {
    return (
        <ActionCard
            onPress={onPress}
            onDelete={onDelete}
            activeOpacity={0.7}
            className="mb-3"
        >
            <View className="flex-row justify-between mb-2">
            <Text className="text-lg font-semibold text-light dark:text-dark">{item.workoutName || 'Untitled Workout'}</Text>
            <Text className="text-sm text-gray-500">
                {new Date(item.workoutTime).toLocaleDateString()}
            </Text>
            </View>
            <View className="flex-row items-center">
            {item.notes && <Text className="text-sm text-gray-500" numberOfLines={1}>{item.notes}</Text>}
            </View>
            <View className="mt-2 items-end">
                <Text className="text-xs text-primary dark:text-primary-dark">Tap for details</Text>
            </View>
        </ActionCard>
    );
};

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const { workoutHistory, deleteWorkoutLog } = useWorkoutManager();
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScreenHeader 
        title="Workout History" 
        rightAction={
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Text className="text-primary dark:text-primary-dark text-base font-semibold">Close</Text>
            </TouchableOpacity>
        }
      />

      <FlatList
        data={workoutHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
            <WorkoutHistoryItem 
                item={item} 
                onDelete={() => deleteWorkoutLog(item.id, { skipConfirmation: true })}
                onPress={() => setSelectedLogId(item.id)}
            />
        )}
        ListEmptyComponent={
          <View className="p-8 items-center">
            <Text className="text-gray-500 text-base text-center">
              There are currently no past workouts, start and finish a workout first.
            </Text>
          </View>
        }
      />

      <WorkoutDetailsModal 
        visible={!!selectedLogId} 
        onClose={() => setSelectedLogId(null)} 
        workoutLogId={selectedLogId} 
      />
    </View>
  );
}
