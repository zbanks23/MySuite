import React from 'react';
import Animated, { 
    useAnimatedStyle, 
    withSpring,
    SharedValue
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from "/ui";

export type RadialMenuItemType = {
  id: string;
  icon: string;
  label: string;
  onPress?: () => void;
  angle?: number; // Explicit angle
};

export function RadialMenuItem({
    item,
    index,
    angle,
    menuRadius,
    isOpen,
    selectedItemIndex,
    theme,
}: {
    item: RadialMenuItemType,
    index: number,
    angle: number,
    menuRadius: number,
    isOpen: SharedValue<number>,
    selectedItemIndex: SharedValue<number>,
    theme: any
}) {
    const angleRad = (angle - 90) * (Math.PI / 180); 

    const containerStyle = useAnimatedStyle(() => {
        const progress = isOpen.value; 
        const translateX = progress * menuRadius * Math.cos(angleRad);
        const translateY = progress * menuRadius * Math.sin(angleRad);

        return {
            transform: [
                { translateX },
                { translateY },
            ],
            opacity: 1, 
            zIndex: 2000, 
        };
    });

    const circleStyle = useAnimatedStyle(() => {
        const isSelected = selectedItemIndex.value === index;
        const scale = withSpring(isSelected ? 1.3 : 1);
        return {
            transform: [{ scale }]
        };
    });

    const animatedLabelStyle = useAnimatedStyle(() => {
        const isSelected = selectedItemIndex.value === index;
        return {
            opacity: withSpring(isSelected ? 1 : 0),
        };
    });

    const strongGradientStyle = useAnimatedStyle(() => {
        const isSelected = selectedItemIndex.value === index;
        return {
            opacity: withSpring(isSelected ? 1 : 0),
        };
    });

    const shadowStyle = {
      shadowColor: '#000',
      shadowOffset: { width: 6, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 8,
    };

    return (
        <Animated.View style={containerStyle} className="absolute w-[52px] h-[52px] items-center justify-center">
            <Animated.View 
                style={[
                    shadowStyle, 
                    circleStyle,
                    { 
                        backgroundColor: theme.bgLight, 
                        width: 52, 
                        height: 52, 
                        borderRadius: 26,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden' // Clip gradients
                    }
                ]}
            >
                 {/* Base Gradient */}
                 <LinearGradient
                    colors={theme.dark ? ['hsla(0, 0%, 100%, 0.25)', 'hsla(0, 0%, 0%, 0.3)'] : ['hsla(0, 0%, 98%, 0.9)', 'hsla(0, 0%, 80%, 0.05)']}
                    locations={[0.3, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    }}
                />

                {/* Strong Gradient for Selected State */}
                <Animated.View style={[
                    {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    },
                    strongGradientStyle
                ]}>
                    <LinearGradient
                        colors={theme.dark ? ['hsla(0, 0%, 100%, 0.25)', 'hsla(0, 0%, 0%, 0.3)'] : ['hsla(0, 0%, 98%, 0.9)', 'hsla(0, 0%, 80%, 0.05)']}
                        locations={[0.5, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ flex: 1 }}
                    />
                </Animated.View>

                <IconSymbol name={item.icon as any} size={28} color={theme.text} />
            </Animated.View>
             <Animated.Text style={[{ color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 }, animatedLabelStyle]} className="absolute -top-7 text-xs font-semibold w-20 text-center">
                {item.label}
             </Animated.Text>
        </Animated.View>
    );
}
