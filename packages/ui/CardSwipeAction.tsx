import * as React from 'react';
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
    useDerivedValue
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface CardSwipeActionProps { 
    dragX: SharedValue<number>; 
    sharedDragX: SharedValue<number>;
    onDelete: () => void;
    onEdit?: () => void;
    onSetReadyToDelete: (ready: boolean) => void;
}

export const CardSwipeAction = ({ 
    dragX, 
    sharedDragX,
    onDelete,
    onEdit,
    onSetReadyToDelete
}: CardSwipeActionProps) => {
    const { width } = useWindowDimensions();
    const hasTriggered = useSharedValue(false);
    // Trigger when card is swiped past 45% of screen width
    const TRIGGER_THRESHOLD = -width * 0.45;
    
    const BUTTON_HEIGHT = 40; 
    const GAP = 10; // Between buttons
    const MARGIN = 0; // Right edge margin (Card has no margin now)
    const CARD_GAP = 10; // Padding from the card
    
    // Layout width for buttons + all spacing
    // If edit exists: (BUTTON_HEIGHT * 2) + GAP + MARGIN + CARD_GAP
    // If no edit: BUTTON_HEIGHT + MARGIN + CARD_GAP + extra padding for single button look?
    const hasEdit = !!onEdit;
    const LAYOUT_WIDTH = hasEdit 
        ? (BUTTON_HEIGHT * 2) + GAP + MARGIN + CARD_GAP 
        : BUTTON_HEIGHT + MARGIN + CARD_GAP + 5; // Reduced gap for single button

    // Sync dragX to parent shared value
    useAnimatedReaction(
        () => dragX.value,
        (currentDrag) => {
            sharedDragX.value = currentDrag;
        }
    );

    // Monitor drag value to trigger haptic feedback on long swipe
    useAnimatedReaction(
        () => dragX.value,
        (currentDrag) => {
            if (currentDrag < TRIGGER_THRESHOLD && !hasTriggered.value) {
                hasTriggered.value = true;
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                // Mark parent as ready to delete
                runOnJS(onSetReadyToDelete)(true);
            } else if (currentDrag > TRIGGER_THRESHOLD + 40 && hasTriggered.value) {
                hasTriggered.value = false;
                // Unmark if user swipes back
                runOnJS(onSetReadyToDelete)(false);
            }
        }
    );

    // Delete Button (Red Blob) Animation
    const snapProgress = useDerivedValue(() => {
        const isDeleting = dragX.value < TRIGGER_THRESHOLD;
        return withTiming(isDeleting ? 1 : 0, { duration: 200 });
    });

    const deleteStyle = useAnimatedStyle(() => {
        const drag = dragX.value;
        const absDrag = Math.abs(drag);
        
        // 1. Calculate Linear State (Dragging)
        // Default relative width
        let linearW = BUTTON_HEIGHT;
        
        // If we overshoot, grow linearly
        if (absDrag > LAYOUT_WIDTH) {
             linearW = BUTTON_HEIGHT + (absDrag - LAYOUT_WIDTH);
        }
        
        // 2. Calculate Snapped State (Full Screen)
        // Fit exactly to screen width (anchored right, so left edge is at 0)
        const snappedW = width - 35;
        
        // 3. Interpolate
        const progress = snapProgress.value;
        
        const w = interpolate(progress, [0, 1], [linearW, snappedW]);
        const right = interpolate(progress, [0, 1], [0, -MARGIN]);
        // Keep consistent border radius even when expanded
        const borderRadius = BUTTON_HEIGHT / 2;

        const scale = interpolate(
            drag,
            [-50, 0], 
            [1, 0], 
            Extrapolation.CLAMP
        );
        
        const opacity = interpolate(
            drag,
            [-50, -10],
            [1, 0],
            Extrapolation.CLAMP
        );
        
        const isDeleting = drag < TRIGGER_THRESHOLD;

        return {
            width: w,
            height: BUTTON_HEIGHT,
            right: right,
            borderRadius: borderRadius,
            transform: [{ scale: isDeleting ? 1 : scale }],
            opacity,
            zIndex: isDeleting ? 100 : 0, // High z-index to cover everything
        };
    });

    const deleteIconStyle = useAnimatedStyle(() => {
         const scale = interpolate(
            dragX.value,
            [-50, 0],
            [1, 0.5],
            Extrapolation.CLAMP
        );
        return { transform: [{ scale }] };
    });

    const deleteLabelStyle = useAnimatedStyle(() => {
        const drag = dragX.value;
        const absDrag = Math.abs(drag);
        
        let linearTranslateX = 0;
        let snappedTranslateX = 0;
        
        // 1. Linear Centering
        if (absDrag > LAYOUT_WIDTH) {
             // The blob grows leftwards from the right edge (+20).
             // Center of blob = +20 - width/2
             // We want label at Center of blob.
             // Width = 40 + (absDrag - LAYOUT_WIDTH)
             // Target = 20 - (40 + absDrag - LAYOUT_WIDTH)/2 = -(absDrag - LAYOUT_WIDTH)/2
             linearTranslateX = -(absDrag - LAYOUT_WIDTH) / 2;
        }
        
        // 2. Snapped Centering
        // Snapped width = width - 35
        // Target = 20 - (width - 35)/2
        snappedTranslateX = 20 - (width - 35) / 2;

        const translateX = interpolate(snapProgress.value, [0, 1], [linearTranslateX, snappedTranslateX]);

        return {
            transform: [{ translateX }],
        };
    });

    // Edit Button Animation
    const editStyle = useAnimatedStyle(() => {
        if (!hasEdit) return { opacity: 0 };

        const drag = dragX.value;
        const absDrag = Math.abs(drag);
        
        let translateX = 0;
        // Slide the edit button left as we expand, keeping it roughly relative to the card's movement
        // or ensuring it gets out of the way of the massive red blob
        // If deleting, slide WAY left to disappear
        if (drag < TRIGGER_THRESHOLD) {
            translateX = -width;
        } 
        else if (absDrag > LAYOUT_WIDTH) {
             // Move left by the excess drag amount to appear "attached" to the card side
             translateX = -(absDrag - LAYOUT_WIDTH);
        }
        
         const scale = interpolate(
            drag,
            [-LAYOUT_WIDTH, -50], 
            [1, 0], 
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            drag,
            [-LAYOUT_WIDTH, -60],
            [1, 0],
            Extrapolation.CLAMP
        );
        
        const isDeleting = drag < TRIGGER_THRESHOLD;

        return {
            transform: [{ translateX }, { scale }],
            opacity: isDeleting ? 0 : opacity,
        } as any;
    });
    

    return (
        <View style={{ width: LAYOUT_WIDTH, height: '100%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
             
             {/* Gap from Card */}
             <View style={{ width: CARD_GAP }} />

             {/* Edit Button Wrapper */}
             {hasEdit && (
                 <View style={{ marginRight: GAP, alignItems: 'center', justifyContent: 'center' }}>
                    <Animated.View style={[editStyle]} className="justify-center items-center">
                        <TouchableOpacity 
                            onPress={onEdit} 
                            activeOpacity={0.8}
                            style={{ 
                                width: BUTTON_HEIGHT, 
                                height: BUTTON_HEIGHT, 
                                borderRadius: BUTTON_HEIGHT/2, 
                                backgroundColor: '#2563eb', // blue-600
                                justifyContent: 'center', 
                                alignItems: 'center',
                            }}
                            className="bg-primary dark:bg-primary-dark"
                        >
                            <MaterialIcons name="edit" size={18} color="white" />
                        </TouchableOpacity>
                        <Animated.Text className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold mt-1">
                            Edit
                        </Animated.Text>
                    </Animated.View>
                 </View>
             )}

             {/* Delete Button Wrapper */}
            <View style={{ marginRight: MARGIN, alignItems: 'center', justifyContent: 'center' }}>
                {/* 
                    Top part: The Button Anchor. 
                    We use a relative container of 40x40 to match the Edit button's circle slot.
                    The Expanding Red Blob is absolute positioned inside this anchor so it grows from right-to-left 
                    without breaking the layout or alignment.
                */}
                <View style={{ width: BUTTON_HEIGHT, height: BUTTON_HEIGHT, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                     <Animated.View 
                        className="bg-red-500 overflow-hidden" 
                        style={[deleteStyle, { position: 'absolute' }]} 
                    >
                        <TouchableOpacity onPress={onDelete} activeOpacity={0.8} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Animated.View style={[deleteIconStyle]}>
                                <MaterialIcons name="delete" size={16} color="white" />
                            </Animated.View>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
                
                {/* Bottom part: The Label. visible in static state, hidden in expansion */}
                <Animated.Text 
                    className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold mt-1"
                    style={[deleteLabelStyle]}
                >
                    Trash
                </Animated.Text>
            </View>
        </View>
    );
};
