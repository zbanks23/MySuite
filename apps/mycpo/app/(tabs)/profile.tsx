import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth, supabase } from '@mycsuite/auth';
import { SharedButton, useUITheme } from '@mycsuite/ui';
import { ThemedView } from '../../components/ui/ThemedView';
import { useRouter } from 'expo-router';
import { IconSymbol } from '../../components/ui/icon-symbol';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const theme = useUITheme();
  
  useEffect(() => {
    if (user) {
      // Fetch existing profile data when the component mounts
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) console.log('Error fetching profile:', error);
          if (data) {
            setUsername(data.username);
            setFullName(data.full_name);
          }
        });
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // The protected routing in _layout.tsx will handle the redirect
  };
  
  return (
    <ThemedView className="flex-1 p-4">
      <View className="flex-row justify-between items-center mb-6 mt-10">
        <Text className="text-3xl font-bold text-apptext dark:text-apptext_dark">Profile</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <IconSymbol name="gearshape.fill" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
      
      <View className="mb-6">
        <View className="mb-4">
            <Text className="text-sm mb-1 text-gray-500">Username</Text>
            <Text className="text-lg font-medium text-apptext dark:text-apptext_dark">{username || 'Not set'}</Text>
        </View>
        <View className="mb-4">
            <Text className="text-sm mb-1 text-gray-500">Full Name</Text>
            <Text className="text-lg font-medium text-apptext dark:text-apptext_dark">{fullName || 'Not set'}</Text>
        </View>
      </View>

      <SharedButton title="Sign Out" onPress={handleSignOut} />
    </ThemedView>
  );
}