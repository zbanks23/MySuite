import React from 'react';
import { View, Text } from 'react-native';
import { ActionCard, RaisedButton, IconSymbol, useUITheme } from "@mysuite/ui";
import { SavedWorkout } from '../../types';

interface SavedWorkoutItemProps {
    item: SavedWorkout;
    onEdit: () => void;
    onStart: () => void;
    onDelete: () => void;
    swipeGroupId?: string;
    activeSwipeId?: string | null;
    onSwipeStart?: (id: string) => void;
}

export const SavedWorkoutItem = ({ 
    item, 
    onEdit, 
    onStart,
    onDelete,
    swipeGroupId,
    activeSwipeId,
    onSwipeStart
}: SavedWorkoutItemProps) => {
    const theme = useUITheme();
    return (
        <ActionCard 
            activeOpacity={1}
            className="p-0 mb-0"
            onDelete={onDelete}
            onEdit={onEdit}
            swipeGroupId={swipeGroupId}
            activeSwipeId={activeSwipeId}
            onSwipeStart={onSwipeStart}
        >
            <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1 mr-2">
                        <Text className="font-semibold text-light dark:text-dark text-lg mb-0.5" numberOfLines={1}>{item.name}</Text>
                </View>
                
                <View className="flex-row items-center">
                    <RaisedButton 
                        onPress={onStart}
                        borderRadius={20}
                        className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
                    >
                        <IconSymbol 
                            name="play.fill" 
                            size={24} 
                            color={theme.primary} 
                        />
                    </RaisedButton>
                </View>
            </View>
        </ActionCard>
    );
};
