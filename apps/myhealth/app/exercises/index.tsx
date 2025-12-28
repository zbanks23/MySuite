import React, { useEffect, useState } from 'react';
import { FlatList, TouchableOpacity, View, ActivityIndicator, TextInput, Alert, Text } from 'react-native'; 
import { useRouter } from 'expo-router';

import { useUITheme, RaisedButton } from '@mysuite/ui';
import { useAuth } from '@mysuite/auth';
import { fetchExercises } from '../../hooks/workouts/useWorkoutManager';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';

import { ScreenHeader } from '../../components/ui/ScreenHeader';

export default function ExercisesScreen() {
  const router = useRouter();
  const theme = useUITheme();

  const { user } = useAuth();
  const [exercises, setExercises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { addExercise, hasActiveSession } = useActiveWorkout();

  const handleAddExercise = (exercise: any) => {
      if (!hasActiveSession) {
          Alert.alert("No Active Workout", "Please start a workout first.");
          return;
      }
      addExercise(exercise.name, "3", "10", exercise.properties);
      Alert.alert('Added', `${exercise.name} added to current workout.`);
  };

  useEffect(() => {
    async function load() {
        if (!user) {
            setLoading(false);
            return;
        }
        const { data } = await fetchExercises(user);
        setExercises(data || []);
        setLoading(false);
    }
    load();
  }, [user]);

  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader
        title="Exercises"
        withBackButton={true}
        rightAction={
            <RaisedButton 
                onPress={() => router.push('/exercises/create')}
                borderRadius={20}
                className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center mr-2"
            >
                <IconSymbol 
                    name="plus" 
                    size={20} 
                    color={theme.primary} 
                />
            </RaisedButton>
        }
      />
      
      <View className="px-4 py-3 border-b border-light-darker dark:border-highlight-dark">
        <View className="flex-row items-center bg-light dark:bg-dark rounded-lg px-2.5 h-10 border border-light-darker dark:border-highlight-dark">
            <IconSymbol name="magnifyingglass" size={20} color={theme.textMuted || '#888'} />
             <TextInput
                className="flex-1 ml-2 text-base h-full text-light dark:text-dark"
                placeholder="Search exercises..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                     <IconSymbol name="xmark.circle.fill" size={20} color={theme.textMuted || '#888'} />
                </TouchableOpacity>
            )}
        </View>
      </View>
      
      {loading ? (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
      <FlatList
        data={exercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            className="flex-row items-center justify-between p-4 border-b border-light-darker dark:border-highlight-dark"
            onPress={() => {
                router.push({
                    pathname: '/exercises/details',
                    params: { exercise: JSON.stringify(item) }
                });
            }}
          >
            <View>
                <Text className="text-base leading-6 font-semibold text-light dark:text-dark">{item.name}</Text>
                <Text className="text-xs text-light-muted dark:text-dark-muted">
                    {item.category} • {item.properties?.join(', ') || item.rawType}
                </Text> 
            </View>
            <TouchableOpacity onPress={(e) => {
                e.stopPropagation(); // Prevent navigation
                handleAddExercise(item);
            }}>
                <IconSymbol name="plus.circle" size={24} color={theme.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
            <View className="p-5 items-center">
                <Text className="text-base leading-6 text-light-muted dark:text-dark-muted">No exercises found.</Text>
            </View>
        }
        showsVerticalScrollIndicator={false}
      />
      )}
    </View>
  );
}
