import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUITheme as useTheme } from '@mycsuite/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { formatSeconds } from '../utils/formatting'; // Removed as duration is not yet in the log
import { useWorkoutManager } from '../hooks/useWorkoutManager';
import { WorkoutDetailsModal } from '../components/workouts/WorkoutDetailsModal';

export default function WorkoutHistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { workoutHistory } = useWorkoutManager();
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'History', headerBackTitle: 'Back' }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Workout History</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={workoutHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.historyItem} 
            onPress={() => setSelectedLogId(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.workoutName || 'Untitled Workout'}</Text>
              <Text style={styles.itemDate}>
                {new Date(item.workoutTime).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.itemDetails}>
              {/* Note: Duration/Exercises count not currently in flattened log view, can be added later */}
              <Text style={styles.detailText}>{new Date(item.workoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
              {item.notes && <Text style={styles.detailText} numberOfLines={1}>• {item.notes}</Text>}
            </View>
            <View style={styles.tapHintContainer}>
                <Text style={styles.tapHint}>Tap for details</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
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

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.surface,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    listContent: {
      padding: 16,
    },
    historyItem: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.surface, // Subtle border if needed
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    itemName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    itemDate: {
      fontSize: 14,
      color: theme.icon,
    },
    itemDetails: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailText: {
      fontSize: 14,
      color: theme.icon,
      marginRight: 8,
    },
    tapHintContainer: {
        marginTop: 8,
        alignItems: 'flex-end',
    },
    tapHint: {
        fontSize: 12,
        color: theme.primary,
    },
    emptyContainer: {
      padding: 32,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.icon,
      fontSize: 16,
    },
  });
