import React, { useState, useEffect } from "react";
import { View, Modal, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useUITheme } from "@mysuite/ui";

interface ProfileEditModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (username: string, fullName: string) => void;
    initialUsername: string;
    initialFullName: string;
    loading?: boolean;
}

export function ProfileEditModal({
    visible,
    onClose,
    onSave,
    initialUsername,
    initialFullName,
    loading = false
}: ProfileEditModalProps) {
    const theme = useUITheme();
    const [username, setUsername] = useState(initialUsername);
    const [fullName, setFullName] = useState(initialFullName);

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setUsername(initialUsername);
            setFullName(initialFullName);
        }
    }, [visible, initialUsername, initialFullName]);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 justify-center items-center bg-black/50"
            >
                <View className="bg-light dark:bg-dark-elem w-[90%] rounded-2xl p-6 shadow-xl">
                    <Text className="text-xl font-bold mb-6 text-light dark:text-dark text-center">Edit Profile</Text>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-500 mb-2">Username</Text>
                        <TextInput
                            className="p-3 border border-light dark:border-white/10 rounded-lg text-base text-light dark:text-dark bg-white dark:bg-black/20"
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Username"
                            placeholderTextColor={theme.icon || "#9ca3af"}
                            autoCapitalize="none"
                        />
                    </View>

                    <View className="mb-6">
                        <Text className="text-sm text-gray-500 mb-2">Full Name</Text>
                        <TextInput
                            className="p-3 border border-light dark:border-white/10 rounded-lg text-base text-light dark:text-dark bg-white dark:bg-black/20"
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Full Name"
                            placeholderTextColor={theme.icon || "#9ca3af"}
                        />
                    </View>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            className="flex-1 p-3 items-center rounded-lg bg-gray-200 dark:bg-white/10"
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text className="text-base font-semibold text-gray-700 dark:text-white">Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 p-3 items-center rounded-lg bg-primary"
                            onPress={() => onSave(username, fullName)}
                            disabled={loading}
                        >
                            <Text className="text-base font-semibold text-white">
                                {loading ? "Saving..." : "Save"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
