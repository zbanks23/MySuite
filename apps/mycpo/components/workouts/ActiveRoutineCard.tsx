import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useUITheme } from '@mycsuite/ui';
import { IconSymbol } from '../../components/ui/icon-symbol';

interface ActiveRoutineCardProps {
  activeRoutineObj: {
    id: string;
    name: string;
    sequence: any[];
  };
  timelineDays: any[];
  dayIndex: number; // Current day index in the full sequence
  isDayCompleted: boolean;
  onClearRoutine: () => void;
  onStartWorkout: (exercises: any[]) => void;
  onMarkComplete: () => void;
}

export function ActiveRoutineCard({
  activeRoutineObj,
  timelineDays,
  dayIndex,
  isDayCompleted,
  onClearRoutine,
  onStartWorkout,
  onMarkComplete,
}: ActiveRoutineCardProps) {
  const theme = useUITheme();
  const styles = makeStyles(theme);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // In collapsed state, we only show the first day (Today)
  const daysToShow = isCollapsed ? timelineDays.slice(0, 1) : timelineDays;

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, {flex: 1, marginRight: 8}]} numberOfLines={1}>Active Routine - {activeRoutineObj.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
             <TouchableOpacity 
                onPress={() => setIsCollapsed(!isCollapsed)} 
                style={{padding: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20}}
            >
                <IconSymbol 
                    name={isCollapsed ? "chevron.down" : "chevron.up"} 
                    size={20} 
                    color={theme.primary} 
                />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClearRoutine}>
                <Text style={{ color: theme.icon, fontSize: 12 }}>Exit</Text>
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.activeRoutineCard}>
        {timelineDays.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.primary, marginBottom: 8 }}>
              Routine Completed!
            </Text>
            <Text style={{ color: theme.icon, textAlign: 'center' }}>
              You have finished all days in this routine.
            </Text>
            <TouchableOpacity onPress={onClearRoutine} style={[styles.controlButton, { marginTop: 16 }]}>
              <Text style={styles.controlText}>Close Routine</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingVertical: 8 }}>
            {daysToShow.map((item: any, index: number) => {
              // Note: timelineDays[0] is always "Today" relative to the current view
              const isToday = index === 0; 
              
              // Visual fix: if collapsed, we shouldn't show the connecting line at the bottom
              const isLastInView = index === daysToShow.length - 1;
              const globalDayNum = dayIndex + index + 1;
              const isCompletedToday = isToday && isDayCompleted;

              // Colors
              const dotColor = isCompletedToday
                ? '#4CAF50' // Success Green
                : isToday
                ? theme.primary
                : theme.surface;

              return (
                <View key={index} style={{ flexDirection: 'row' }}>
                  {/* Timeline Column */}
                  <View style={{ width: 30, alignItems: 'center' }}>
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: dotColor,
                        borderWidth: isToday && !isCompletedToday ? 0 : 2,
                        borderColor: isToday
                          ? dotColor
                          : theme.options?.borderColor || 'rgba(150,150,150,0.3)',
                        zIndex: 2,
                        marginTop: 4,
                      }}
                    />
                   
                   {/* Vertical Line */}
                    {!isLastInView && (
                         <View
                         style={{
                             width: 2,
                             flex: 1,
                             backgroundColor: theme.surface,
                             marginVertical: -2,
                             zIndex: 1,
                         }}
                         />
                    )}
                    
                    {/* End Indicator if this is the last day of routine and we are showing it */}
                    {isLastInView && !isCollapsed &&
                      globalDayNum === activeRoutineObj.sequence.length && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.surface,
                            marginTop: -4,
                            zIndex: 2,
                          }}
                        />
                      )}
                  </View>

                  {/* Content Column */}
                  <View style={{ flex: 1, paddingBottom: isLastInView ? 0 : 24, paddingLeft: 8 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: isToday ? '700' : '500',
                          fontSize: isToday ? 18 : 16,
                          color: isCompletedToday
                            ? theme.icon
                            : isToday
                            ? theme.text
                            : theme.icon,
                          textDecorationLine: isCompletedToday ? 'line-through' : 'none',
                          flex: 1,
                          marginRight: 8,
                        }}
                      >
                        {item.type === 'rest'
                          ? 'Rest Day'
                          : item.name || 'Unknown Workout'}
                      </Text>
                      {isToday && !isCompletedToday && (
                        <View
                          style={{
                            backgroundColor: theme.surface,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text style={{ fontSize: 10, color: theme.icon, fontWeight: '700' }}>
                            TODAY
                          </Text>
                        </View>
                      )}
                      {isCompletedToday && (
                        <View
                          style={{
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                          }}
                        >
                          <Text style={{ fontSize: 10, color: '#4CAF50', fontWeight: '700' }}>
                            DONE
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Actions for Today */}
                    {isToday && !isCompletedToday && (
                      <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                        <TouchableOpacity
                          style={[
                            styles.controlButtonPrimary,
                            { flex: 1, alignItems: 'center', justifyContent: 'center' },
                          ]}
                          onPress={() => {
                            if (item?.type === 'workout' && item.workout) {
                              onStartWorkout(item.workout.exercises || []);
                            } else {
                              Alert.alert('Rest Day', 'Enjoy your rest!', [
                                { text: 'Mark Complete', onPress: () => onMarkComplete() },
                              ]);
                            }
                          }}
                        >
                          <Text style={styles.controlTextPrimary}>
                            {item?.type === 'rest' ? 'Mark Complete' : 'Start Workout'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.controlButton,
                            { paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
                          ]}
                          onPress={() => onMarkComplete()}
                        >
                          <Text style={styles.controlText}>Skip</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      color: theme.text,
    },
    activeRoutineCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.options?.borderColor || 'rgba(150,150,150,0.1)',
    },
    controlButton: {
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.surface,
      backgroundColor: theme.background,
    },
    controlButtonPrimary: {
      padding: 10,
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    controlText: {
      color: theme.text,
    },
    controlTextPrimary: {
      color: '#fff',
      fontWeight: '600',
    },
  });
