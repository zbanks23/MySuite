import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { IconSymbol } from '../ui/icon-symbol';
import { SetSwipeAction } from './SetSwipeAction';

export const getExerciseFields = (properties?: string[]) => {
    const props = properties || [];
    const lowerProps = props.map(p => p.toLowerCase());
    return { 
        showBodyweight: lowerProps.includes('bodyweight'),
        showWeight: lowerProps.includes('weighted'),
        showReps: lowerProps.includes('reps'),
        showDuration: lowerProps.includes('duration'),
        showDistance: lowerProps.includes('distance')
    };
};

interface SetRowProps {
    index: number;
    exercise: any;
    onCompleteSet: (input: { weight?: string, reps?: string, duration?: string, distance?: string }) => void;
    onUncompleteSet?: (index: number) => void;
    onUpdateSetTarget?: (index: number, key: 'weight' | 'reps' | 'duration' | 'distance', value: string) => void;
    onUpdateLog?: (index: number, key: 'weight' | 'reps' | 'duration' | 'distance', value: string) => void;
    onDeleteSet: (index: number) => void;
    theme: any;
    latestBodyWeight?: number | null;
}

export const SetRow = ({ index, exercise, onCompleteSet, onUncompleteSet, onUpdateSetTarget, onUpdateLog, onDeleteSet, theme, latestBodyWeight }: SetRowProps) => {
    const shouldDelete = useRef(false);
    const swipeableRef = useRef<any>(null);
    const log = exercise.logs?.[index];
    const isCompleted = !!log;
    const isEvenSet = (index + 1) % 2 === 0;

    const { showBodyweight, showWeight, showReps, showDuration, showDistance } = getExerciseFields(exercise.properties);

    const getValue = (field: 'weight' | 'reps' | 'duration' | 'distance') => {
        const target = exercise.setTargets?.[index]?.[field];
        if (target === undefined || target === null) return '';
        return target.toString();
    };

    const getLogValue = (field: 'weight' | 'reps' | 'duration' | 'distance') => {
        const val = log?.[field];
        if (val === undefined || val === null) return '';
        return val.toString();
    };

    const cardOffset = useSharedValue(0);
    const rowWidth = useSharedValue(0);

    const animatedRowStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: cardOffset.value }]
        };
    });



    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={(_, dragX) => (
                <SetSwipeAction 
                    dragX={dragX} 
                    onDelete={() => {
                        swipeableRef.current?.close();
                        onDeleteSet(index);
                    }}
                    onSetReadyToDelete={(ready) => shouldDelete.current = ready}
                    cardOffset={cardOffset}
                    rowWidth={rowWidth}
                />
            )}
            onSwipeableWillOpen={() => {
                if (shouldDelete.current) {
                    swipeableRef.current?.close();
                    onDeleteSet(index); 
                }
            }}
            rightThreshold={40}
            overshootRight={true}
            friction={2}
            containerStyle={{ overflow: 'visible' }}
        >
             <Animated.View 
                className={`flex-row items-center mb-2 h-11 px-1 ${isEvenSet ? 'bg-light dark:bg-dark rounded-lg' : ''}`}
                style={animatedRowStyle}
                onLayout={(e) => {
                    rowWidth.value = e.nativeEvent.layout.width;
                }}
             >
                 {/* Set Number */}
                 <View className="w-[30px] items-center justify-center">
                     <Text className="text-xs font-bold text-light dark:text-dark">{index + 1}</Text>
                 </View>

                 <Text className="flex-1 text-center text-xs text-light-muted dark:text-dark-muted">-</Text>

                 {isCompleted ? (
                      <>
                        {showBodyweight && (
                            <View className="w-[60px] items-center justify-center mx-1">
                                <Text className="text-sm font-bold text-light-muted dark:text-dark-muted">
                                    {latestBodyWeight ? `${latestBodyWeight}` : 'BW'}
                                </Text>
                            </View>
                        )}
                        {showWeight && (
                             <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getLogValue('weight')}
                                onChangeText={(t: string) => onUpdateLog?.(index, 'weight', t)}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                        {showReps && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getLogValue('reps')}
                                onChangeText={(t: string) => onUpdateLog?.(index, 'reps', t)}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                        {showDuration && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getLogValue('duration')}
                                onChangeText={(t: string) => onUpdateLog?.(index, 'duration', t)}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                         {showDistance && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getLogValue('distance')}
                                onChangeText={(t: string) => onUpdateLog?.(index, 'distance', t)}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                        <TouchableOpacity 
                            className="w-7 h-7 rounded-lg bg-primary dark:bg-primary-dark items-center justify-center ml-1"
                            onPress={() => onUncompleteSet?.(index)}
                        >
                             <IconSymbol name="checkmark" size={16} color="#fff" />
                        </TouchableOpacity>
                      </>
                 ) : (
                      <>
                        {showBodyweight && (
                            <View className="w-[60px] items-center justify-center mx-1">
                                <Text className="text-sm font-bold text-light-muted dark:text-dark-muted">
                                    {latestBodyWeight ? `${latestBodyWeight}` : 'BW'}
                                </Text>
                            </View>
                        )}
                        {showWeight && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getValue('weight')}
                                onChangeText={(t: string) => onUpdateSetTarget?.(index, 'weight', t)}
                                placeholder={getValue('weight') || "-"} 
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                        {showReps && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getValue('reps')} 
                                onChangeText={(t: string) => onUpdateSetTarget?.(index, 'reps', t)}
                                placeholder={getValue('reps') || (exercise.reps || 0).toString()}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                        {showDuration && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getValue('duration')} 
                                onChangeText={(t: string) => onUpdateSetTarget?.(index, 'duration', t)}
                                placeholder={getValue('duration') || "-"}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                        {showDistance && (
                            <TextInput 
                                className="w-[60px] bg-transparent text-center text-sm font-bold text-light dark:text-dark mx-1 p-0 -mt-[6px]"
                                value={getValue('distance')} 
                                onChangeText={(t: string) => onUpdateSetTarget?.(index, 'distance', t)}
                                placeholder={getValue('distance') || "-"}
                                keyboardType="numeric" 
                                placeholderTextColor={theme.placeholder || '#888'}
                                textAlignVertical="center"
                            />
                        )}
                        <TouchableOpacity 
                            className={`w-7 h-7 rounded-lg items-center justify-center ml-1 border-2 border-primary dark:border-primary-dark`}
                            onPress={() => onCompleteSet({ 
                                weight: showWeight ? getValue('weight') : undefined,
                                reps: showReps ? (getValue('reps') || (exercise.reps || 0).toString()) : undefined,
                                duration: showDuration ? getValue('duration') : undefined,
                                distance: showDistance ? getValue('distance') : undefined,
                            })}
                        >
                            <IconSymbol name="checkmark" size={16} color={theme.primary} />
                        </TouchableOpacity>
                      </>
                 )}
                 
                 {/* Padding to balance the right side since delete button is gone */}

             </Animated.View>
        </Swipeable>
    );
};
