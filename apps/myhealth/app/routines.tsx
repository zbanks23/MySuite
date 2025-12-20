import React from 'react';
import { FlatList, TouchableOpacity, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '../components/ui/ThemedText';
import { ThemedView } from '../components/ui/ThemedView';
import { useUITheme } from '@mycsuite/ui';
import { useWorkoutManager } from '../hooks/useWorkoutManager';
import { useActiveWorkout } from '../providers/ActiveWorkoutProvider';
import { useFloatingButton } from '../providers/FloatingButtonContext';

export default function RoutinesScreen() {
  const router = useRouter();
  const theme = useUITheme();
  
  const { routines, deleteRoutine, startActiveRoutine } = useWorkoutManager();
  const { hasActiveSession, setExercises } = useActiveWorkout();

    // Hide floating buttons
    const { setIsHidden } = useFloatingButton();
    React.useEffect(() => {
        setIsHidden(true);
        return () => setIsHidden(false);
    }, [setIsHidden]);

  const handleSetRoutine = (id: string, name: string, sequence: any[]) => {
      if (hasActiveSession) {
          Alert.alert("Active Session", "Please finish or cancel your current workout before setting a new routine.");
          return;
      }
      
      startActiveRoutine(id);
      
      // Load day 1 if available
      if (sequence && sequence.length > 0) {
          const first = sequence[0];
          if (first.type === 'workout' && first.workout) {
              setExercises(first.workout.exercises || []);
          }
      }
      
      router.back();
  };

  const handleDelete = (id: string, name: string) => {
      Alert.alert(
          "Delete Routine",
          `Are you sure you want to delete '${name}'?`,
          [
              { text: "Cancel", style: "cancel" },
              { 
                  text: "Delete", 
                  style: "destructive", 
                  onPress: () => deleteRoutine(id) 
              }
          ]
      );
  };

  return (
    <ThemedView className="flex-1">
      <ThemedView className="flex-row items-center justify-between p-4 border-b border-surface dark:border-white/10">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
           <ThemedText type="link">Close</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle">My Routines</ThemedText>
        <View className="w-[50px]" /> 
      </ThemedView>
      
      {routines.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
              <ThemedText style={{color: theme.icon}}>No saved routines found.</ThemedText>
          </View>
      ) : (
          <FlatList
            data={routines}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between p-4 border-b border-surface dark:border-white/10">
                <View className="flex-1">
                    <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                    <ThemedText style={{color: theme.icon ?? '#888', fontSize: 12}}>
                        {new Date(item.createdAt).toLocaleDateString()} • {item.sequence?.length || 0} Days
                    </ThemedText> 
                </View>
                <View className="flex-row gap-2">
                    <TouchableOpacity 
                        onPress={() => handleSetRoutine(item.id, item.name, item.sequence)} 
                        className="py-1.5 px-3 rounded-md bg-primary dark:bg-primary_dark"
                    >
                        <ThemedText className="text-white text-sm font-semibold">Set Active</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => handleDelete(item.id, item.name)} 
                        className="py-1.5 px-3 rounded-md border border-surface dark:border-white/10"
                    >
                        <ThemedText className="text-sm">Delete</ThemedText>
                    </TouchableOpacity>
                </View>
              </View>
            )}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 120 }}
          />
      )}
    </ThemedView>
  );
}
