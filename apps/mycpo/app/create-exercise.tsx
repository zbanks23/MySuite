import React, { useState } from 'react';
import { TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../components/ui/ThemedView';
import { ThemedText } from '../components/ui/ThemedText';
import { useUITheme } from '@mycsuite/ui';
import { useWorkoutManager } from '../hooks/useWorkoutManager';

export default function CreateExerciseScreen() {
  const router = useRouter();
  const theme = useUITheme();
  const { createCustomExercise } = useWorkoutManager();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
        Alert.alert('Error', 'Please enter an exercise name');
        return;
    }

    setIsSubmitting(true);
    try {
        const { error } = await createCustomExercise(name, category);
        if (error) {
            Alert.alert('Error', 'Failed to create exercise');
            console.error(error);
        } else {
            // Success
            router.back();
        }
    } catch (e) {
        Alert.alert('Error', 'An unexpected error occurred');
        console.error(e);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <ThemedView className="flex-1">
      <View className="flex-row items-center justify-between p-4 border-b border-surface dark:border-white/10 pt-4 android:pt-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ThemedText type="link">Cancel</ThemedText>
        </TouchableOpacity>
        <ThemedText type="subtitle">New Exercise</ThemedText>
        <TouchableOpacity onPress={handleCreate} disabled={isSubmitting} className="p-2">
            <ThemedText type="link" style={{ fontWeight: 'bold', opacity: isSubmitting ? 0.5 : 1 }}>Save</ThemedText>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 p-6"
      >
        <View className="mb-6">
            <ThemedText type="defaultSemiBold" className="mb-2">Name</ThemedText>
            <TextInput 
                className="bg-surface dark:bg-surface_dark text-apptext dark:text-apptext_dark p-4 rounded-xl text-base border border-transparent dark:border-white/10"
                placeholder="e.g. Bench Press" 
                placeholderTextColor={theme.icon}
                value={name}
                onChangeText={setName}
                autoFocus
            />
        </View>

        <View className="mb-6">
            <ThemedText type="defaultSemiBold" className="mb-2">Category</ThemedText>
            {/* Simple text input for now, could be a picker */}
            <TextInput 
                className="bg-surface dark:bg-surface_dark text-apptext dark:text-apptext_dark p-4 rounded-xl text-base border border-transparent dark:border-white/10"
                placeholder="e.g. Chest, Legs, etc." 
                placeholderTextColor={theme.icon}
                value={category}
                onChangeText={setCategory}
            />
        </View>

      </KeyboardAvoidingView>
    </ThemedView>
  );
}
