import React from 'react';
import { View, TouchableOpacity, useWindowDimensions } from 'react-native';
import Animated, { 
    useAnimatedStyle, 
    useAnimatedReaction, 
    runOnJS, 
    interpolate, 
    Extrapolation, 
    SharedValue,
    useSharedValue,
    withTiming,
    Easing
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '../ui/icon-symbol';

// Actions component that monitors drag distance (Adapted for Set Rows)
export const SetSwipeAction = ({ 
    dragX, 
    onDelete,
    onSetReadyToDelete,
    cardOffset,
    rowWidth
}: { 
    dragX: SharedValue<number>; 
    onDelete: () => void;
    onSetReadyToDelete: (ready: boolean) => void;
    cardOffset: SharedValue<number>;
    rowWidth: SharedValue<number>;
}) => {
    const { width } = useWindowDimensions();
    const hasTriggered = useSharedValue(false);
    const TRIGGER_THRESHOLD = -width * 0.45; // 45% swipe to delete
    
    // Monitor drag value to trigger haptic feedback
    useAnimatedReaction(
        () => dragX.value,
        (currentDrag) => {
            if (currentDrag < TRIGGER_THRESHOLD && !hasTriggered.value) {
                hasTriggered.value = true;
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                runOnJS(onSetReadyToDelete)(true);
                cardOffset.value = withTiming(-width, { duration: 200, easing: Easing.linear });
            } else if (currentDrag > TRIGGER_THRESHOLD + 20 && hasTriggered.value) {
                hasTriggered.value = false;
                runOnJS(onSetReadyToDelete)(false);
                cardOffset.value = withTiming(0, { duration: 200, easing: Easing.linear });
            }
        }
    );

    const iconStyle = useAnimatedStyle(() => {
        const scale = interpolate(dragX.value, [-60, -20], [1, 0.5], Extrapolation.CLAMP);
        return {
            transform: [{ scale }]
        };
    });

    return (
        <View className="justify-center items-end mb-2 h-11" style={{ width: 80 }}>
             <Animated.View 
                className="bg-error"
                style={[
                    { 
                        position: 'absolute', 
                        right: 0, 
                        height: '100%', 
                        borderRadius: 8, // Rounded corners for the delete action
                        justifyContent: 'center',
                        alignItems: 'center'
                    }, 
                    useAnimatedStyle(() => {
                        const maxW = rowWidth.value > 0 ? rowWidth.value : width;
                        const targetW = -(dragX.value + cardOffset.value);
                        return {
                            width: Math.max(0, Math.min(maxW, targetW)),
                            opacity: interpolate(dragX.value, [-20, 0], [1, 0])
                        };
                    })
                ]} 
            >
                <TouchableOpacity onPress={onDelete} className="flex-1 justify-center items-center w-full">
                     <Animated.View style={iconStyle}>
                          <IconSymbol name="trash.fill" size={20} color="white" />
                     </Animated.View>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};
