import React from 'react';
import { useRouter } from 'expo-router';
import { RaisedButton, useUITheme, IconSymbol } from '@mysuite/ui';

export function ProfileButton() {
    const router = useRouter();
    const theme = useUITheme();

    return (
        <RaisedButton 
            onPress={() => router.push('/profile')}
            borderRadius={20}
            className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
        >
            <IconSymbol 
                name="person.fill" 
                size={20} 
                color={theme.primary} 
            />
        </RaisedButton>
    );
}
