import React, { useRef } from 'react';
import { View, TouchableOpacity, ViewProps, TouchableOpacityProps, useWindowDimensions } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { 
    useAnimatedStyle, 
    useAnimatedReaction, 
    runOnJS, 
    interpolate, 
    Extrapolation, 
    SharedValue,
    useSharedValue
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from './icon-symbol';

interface CardProps extends ViewProps {
  onPress?: () => void;
  activeOpacity?: number;
  onDelete?: () => void;
  onEdit?: () => void;
}

// Actions component that monitors drag distance
const CardSwipeAction = ({ 
    dragX, 
    onDelete,
    onEdit,
    onSetReadyToDelete
}: { 
    dragX: SharedValue<number>; 
    onDelete: () => void;
    onEdit?: () => void;
    onSetReadyToDelete: (ready: boolean) => void;
}) => {
    const { width } = useWindowDimensions();
    const hasTriggered = useSharedValue(false);
    // Trigger when card is swiped past 45% of screen width
    const TRIGGER_THRESHOLD = -width * 0.45;
    
    const BUTTON_HEIGHT = 40; 
    const GAP = 10; // Between buttons
    const MARGIN = 20; // Right edge margin (Card has no margin now)
    const CARD_GAP = 10; // Padding from the card
    
    // Layout width for buttons + all spacing
    // If edit exists: (BUTTON_HEIGHT * 2) + GAP + MARGIN + CARD_GAP
    // If no edit: BUTTON_HEIGHT + MARGIN + CARD_GAP + extra padding for single button look?
    const hasEdit = !!onEdit;
    const LAYOUT_WIDTH = hasEdit 
        ? (BUTTON_HEIGHT * 2) + GAP + MARGIN + CARD_GAP 
        : BUTTON_HEIGHT + MARGIN + CARD_GAP + 20; // extra space if just one button

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
    const deleteStyle = useAnimatedStyle(() => {
        const drag = dragX.value;
        const absDrag = Math.abs(drag);
        
        let w = BUTTON_HEIGHT;
        let borderRadius = BUTTON_HEIGHT / 2;
        
        // If drag is deeper than the layout width + a buffer, start expanding
        const EXPANSION_START = LAYOUT_WIDTH + 10;
        
        if (absDrag > EXPANSION_START) {
            if (drag < TRIGGER_THRESHOLD + 20) {
                 w = Math.max(absDrag - MARGIN, BUTTON_HEIGHT);
            }
        }

        const scale = interpolate(
            drag,
            [-50, 0], // Quick pop in
            [1, 0], 
            Extrapolation.CLAMP
        ); // delete appears fast

        // Fade in
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
            borderRadius: borderRadius, 
            transform: [{ scale }],
            opacity,
            zIndex: isDeleting ? 10 : 0, 
        };
    });

    // Edit Button Animation
    const editStyle = useAnimatedStyle(() => {
        if (!hasEdit) return { opacity: 0 };

        const drag = dragX.value;
        
         const scale = interpolate(
            drag,
            [-110, -50], 
            [1, 0], 
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            drag,
            [-110, -60],
            [1, 0],
            Extrapolation.CLAMP
        );
        
        const isDeleting = drag < TRIGGER_THRESHOLD;

        return {
            transform: [{ scale }],
            opacity: isDeleting ? 0 : opacity,
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

    const deleteTextStyle = useAnimatedStyle(() => {
         const scale = interpolate(
            dragX.value,
            [-50, 0],
            [1, 0], 
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            dragX.value,
            [-50, -20],
            [1, 0],
            Extrapolation.CLAMP
        );
        return {
            opacity,
            transform: [{ scale }]
        };
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
                            className="bg-primary dark:bg-primary_dark"
                        >
                            <IconSymbol name="pencil" size={18} color="white" />
                        </TouchableOpacity>
                        <Animated.Text className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold mt-1">
                            Edit
                        </Animated.Text>
                    </Animated.View>
                 </View>
             )}

             {/* Delete Button Wrapper */}
            <View style={{ marginRight: MARGIN, alignItems: 'center' }}>
                <Animated.View 
                    className="bg-red-500 justify-center items-center" 
                    style={[deleteStyle, { position: 'absolute', right: 0 }]} 
                >
                     <View style={{ width: BUTTON_HEIGHT, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                        <TouchableOpacity onPress={onDelete} activeOpacity={0.8}>
                            <Animated.View style={[deleteIconStyle]}>
                                <IconSymbol name="trash.fill" size={16} color="white" />
                            </Animated.View>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
                
                {/* Placeholder for layout */}
                 <View style={{ width: BUTTON_HEIGHT, height: BUTTON_HEIGHT }} pointerEvents="none" />
                 
                <Animated.Text 
                    className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold mt-1"
                    style={[deleteTextStyle]} 
                >
                    Trash
                </Animated.Text>
            </View>
        </View>
    );
};

export function Card({ children, style, className, onPress, activeOpacity = 0.9, onDelete, onEdit, ...props }: CardProps) {
  // Base styling from RoutineCard
  const baseClassName = `bg-surface dark:bg-surface_dark rounded-xl p-3 w-full mb-1 border border-black/5 dark:border-white/10 shadow-sm ${className || ''}`;

  // Track if we are deep enough to delete
  const shouldDelete = useRef(false);
  const swipeableRef = useRef<any>(null);

  const setReadyToDelete = (ready: boolean) => {
      shouldDelete.current = ready;
  };

  const Content = (
    onPress ? (
        <TouchableOpacity 
          style={style} 
          className={baseClassName} 
          onPress={onPress} 
          activeOpacity={activeOpacity}
          {...(props as TouchableOpacityProps)}
        >
          {children}
        </TouchableOpacity>
      ) : (
        <View style={style} className={baseClassName} {...props}>
          {children}
        </View>
      )
  );

  if (onDelete) {
      return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={(progress, dragX) => (
                <CardSwipeAction 
                    dragX={dragX}
                    onDelete={() => {
                        swipeableRef.current?.close();
                        onDelete();
                    }}
                    onEdit={onEdit}
                    onSetReadyToDelete={setReadyToDelete}
                />
            )}
            overshootRight={true} // Allow overshooting
            friction={2}
            rightThreshold={40}
            onSwipeableWillOpen={() => {
                // Trigger delete ONLY if we dragged past the deep threshold
                if (shouldDelete.current) {
                    swipeableRef.current?.close();
                    onDelete();
                }
            }}
            containerStyle={{ overflow: 'visible' }}
        >
            {Content}
        </Swipeable>
      );
  }

  return Content;
}
