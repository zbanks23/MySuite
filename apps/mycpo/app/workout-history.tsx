import React, { useState } from 'react';
import { Text, View, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWorkoutManager } from '../hooks/useWorkoutManager';
import { WorkoutDetailsModal } from '../components/workouts/WorkoutDetailsModal';

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const { workoutHistory } = useWorkoutManager();
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background_dark">
      <Stack.Screen options={{ title: 'History', headerBackTitle: 'Back' }} />
      
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-surface dark:border-white/10">
        <Text className="text-2xl font-bold text-apptext dark:text-apptext_dark">Workout History</Text>
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Text className="text-primary dark:text-primary_dark text-base font-semibold">Close</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={workoutHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            className="bg-surface dark:bg-surface_dark rounded-xl p-4 mb-3 border border-surface dark:border-white/10 shadow-sm"
            onPress={() => setSelectedLogId(item.id)}
            activeOpacity={0.7}
          >
            <View className="flex-row justify-between mb-2">
              <Text className="text-lg font-semibold text-apptext dark:text-apptext_dark">{item.workoutName || 'Untitled Workout'}</Text>
              <Text className="text-sm text-gray-500">
                {new Date(item.workoutTime).toLocaleDateString()}
              </Text>
            </View>
            <View className="flex-row items-center">
              {/* Note: Duration/Exercises count not currently in flattened log view, can be added later */}
              <Text className="text-sm text-gray-500 mr-2">{new Date(item.workoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
              {item.notes && <Text className="text-sm text-gray-500" numberOfLines={1}>• {item.notes}</Text>}
            </View>
            <View className="mt-2 items-end">
                <Text className="text-xs text-primary dark:text-primary_dark">Tap for details</Text>
            </View>
          </TouchableOpacity>
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
    </SafeAreaView>
  );
}
