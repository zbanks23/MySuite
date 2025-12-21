import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScaleDecorator } from 'react-native-draggable-flatlist';
import { ThemedText } from '../ui/ThemedText';
import { IconSymbol } from '../ui/icon-symbol';
import { useUITheme } from '@mycsuite/ui';

interface RoutineDraftItemProps {
    item: any;
    drag: () => void;
    isActive: boolean;
    onRemove: () => void;
}

export const RoutineDraftItem = ({
    item,
    drag,
    isActive,
    onRemove
}: RoutineDraftItemProps) => {
    const theme = useUITheme();

    return (
        <ScaleDecorator activeScale={1.05}>
            <TouchableOpacity
                onLongPress={drag}
                disabled={isActive}
                activeOpacity={1}
                className={`bg-surface dark:bg-surface_dark rounded-xl mb-3 overflow-hidden border p-3 flex-row items-center justify-between ${isActive ? 'border-primary dark:border-primary_dark' : 'border-black/5 dark:border-white/10'}`}
            >
                <View className="flex-row items-center flex-1 mr-2">
                        <View>
                        <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm">
                            {item.type === 'rest' ? 'Rest Day' : 'Workout'}
                        </Text>
                    </View>
                </View>
                
                <View className="flex-row items-center">
                    <TouchableOpacity onPressIn={drag} className="p-2 mr-2"> 
                            <IconSymbol name="line.3.horizontal" size={20} color={theme.icon || '#888'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); onRemove(); }} className="p-2"> 
                        <IconSymbol name="trash.fill" size={18} color={theme.options?.destructiveColor || '#ff4444'} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </ScaleDecorator>
    );
};
