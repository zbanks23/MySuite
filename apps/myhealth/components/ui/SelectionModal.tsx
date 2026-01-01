import React from 'react';
import { View, Modal, TouchableOpacity, FlatList, Text } from 'react-native';
import { useUITheme, IconSymbol } from '@mysuite/ui';
interface SelectionModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    items: any[];
    onSelect: (item: any) => void;
    isSelected: (item: any) => boolean;
    multiSelect?: boolean;
}

export const SelectionModal = ({
    visible,
    onClose,
    title,
    items,
    onSelect,
    isSelected,
    multiSelect = false
}: SelectionModalProps) => {
    const theme = useUITheme();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-light dark:bg-dark">
                <View className="flex-row items-center justify-between p-4 border-b border-light dark:border-white/10 pt-4 android:pt-10">
                    <TouchableOpacity onPress={onClose} className="p-2">
                        <Text className="text-base leading-[30px] text-[#0a7ea4]">Done</Text>
                    </TouchableOpacity>
                    <Text className="text-xl font-bold">{title}</Text>
                    <View style={{ width: 50 }} />
                </View>
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.value || item.id}
                    renderItem={({ item }) => {
                        const selected = isSelected(item);
                        return (
                            <TouchableOpacity 
                                className={`flex-row items-center justify-between p-4 border-b border-light dark:border-white/5 ${selected ? 'bg-primary/10 dark:bg-primary/20' : ''}`}
                                onPress={() => {
                                    onSelect(item);
                                    if (!multiSelect) onClose();
                                }}
                            >
                                <Text className="text-base leading-6 font-semibold">{item.label || item.name}</Text>
                                {selected && <IconSymbol name="checkmark" size={20} color={theme.primary} />}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </Modal>
    );
};
