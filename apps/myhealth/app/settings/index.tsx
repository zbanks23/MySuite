import React from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth, supabase } from '@mysuite/auth';
import { useUITheme, RaisedButton, ThemeToggle, IconSymbol } from '@mysuite/ui';
import { useThemePreference } from '../../providers/AppThemeProvider';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { ProfileEditModal } from '../../components/ui/ProfileEditModal';

export default function SettingsScreen() {
  const { user } = useAuth();
  const theme = useUITheme();
  const { preference, setPreference } = useThemePreference();
  const [username, setUsername] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) console.log('Error fetching profile:', error);
          if (data) {
            setUsername(data.username || '');
            setFullName(data.full_name || '');
          }
        });
    }
  }, [user]);

  const handleUpdateProfile = async (newUsername: string, newFullName: string) => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: newUsername,
      full_name: newFullName,
      updated_at: new Date().toISOString(),
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setUsername(newUsername);
      setFullName(newFullName);
      setIsEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Router will handle redirect based on auth state change in _layout
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            // Placeholder for delete logic
            Alert.alert('Not Implemented', 'Account deletion logic to be implemented.');
          } 
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader title="Settings" leftAction={<BackButton />} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 140 }}>
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Appearance</Text>
          <ThemeToggle preference={preference} setPreference={setPreference} />
        </View>

        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-500 uppercase">Account</Text>
            <TouchableOpacity onPress={() => setIsEditModalVisible(true)}>
              <Text className="text-primary font-semibold">Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View className="py-3 border-b border-light dark:border-white/5">
            <Text className="text-sm text-gray-500 mb-1">Email</Text>
            <Text className="text-base text-light dark:text-dark">{user?.email}</Text>
          </View>
          
          <View className="py-3 border-b border-light dark:border-white/5">
            <Text className="text-sm text-gray-500 mb-1">Username</Text>
            <Text className="text-base text-light dark:text-dark">{username || 'Not set'}</Text>
          </View>

          <View className="py-3">
            <Text className="text-sm text-gray-500 mb-1">Full Name</Text>
            <Text className="text-base text-light dark:text-dark">{fullName || 'Not set'}</Text>
          </View>
        </View>

        <ProfileEditModal
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          onSave={handleUpdateProfile}
          initialUsername={username}
          initialFullName={fullName}
          loading={loading}
        />

        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-500 mb-2 uppercase">Legal</Text>
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark" onPress={() => Alert.alert('Privacy Policy', 'Link to Privacy Policy')}>
            <Text className="text-base text-light dark:text-dark">Privacy Policy</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.icon || '#ccc'} />
          </TouchableOpacity>
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-light dark:border-dark" onPress={() => Alert.alert('Terms of Service', 'Link to Terms of Service')}>
            <Text className="text-base text-light dark:text-dark">Terms of Service</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.icon || '#ccc'} />
          </TouchableOpacity>
        </View>

        <View>
          <RaisedButton 
            title="Sign Out" 
            onPress={handleSignOut} 
            className="mb-4 h-12"
          />
          
          <RaisedButton 
            title="Delete Account" 
            onPress={handleDeleteAccount} 
            className="h-12"
            textClassName="text-red-500 font-bold text-lg"
          />
        </View>
        
        <Text className="text-center text-xs text-gray-500 mt-6">Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}
