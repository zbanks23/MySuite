import { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, Alert } from 'react-native';
import { useAuth, supabase } from '@mysuite/auth';
import { useUITheme, RaisedButton, IconSymbol } from '@mysuite/ui';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';

import { AuthForm } from '../../components/auth/AuthForm';

export default function ProfileScreen() {
  const { user } = useAuth();
  const theme = useUITheme();
  
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [tempUsername, setTempUsername] = useState('');
  const [tempFullName, setTempFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
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
            setTempUsername(data.username || '');
            setTempFullName(data.full_name || '');
          }
        });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: tempUsername,
      full_name: tempFullName,
      updated_at: new Date().toISOString(),
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setUsername(tempUsername);
      setFullName(tempFullName);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    }
  };

  const handleCancelEdit = () => {
    setTempUsername(username);
    setTempFullName(fullName);
    setIsEditing(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
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
            Alert.alert('Not Implemented', 'Account deletion logic to be implemented.');
          } 
        }
      ]
    );
  };

  if (!user) {
    return (
      <View className="flex-1 bg-light dark:bg-dark">
        <ScreenHeader title="Profile" />
        <View className="flex-1 justify-center px-4 mt-36">
            <Text className="text-center text-lg font-bold text-light dark:text-dark">
                Sign in to view your profile
            </Text>
            <AuthForm showGuestOption={false} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-light dark:bg-dark">
      <ScreenHeader 
        title={username || 'Profile'} 
        leftAction={<BackButton />}
      />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="mt-36 px-4 mb-6">
            <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-semibold text-light dark:text-dark">Account</Text>
            {isEditing ? (
                <View className="flex-row gap-2">
                <RaisedButton 
                    onPress={handleCancelEdit} 
                    disabled={loading}
                    borderRadius={20}
                    className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center bg-gray-200 dark:bg-white/10"
                >
                    <IconSymbol name="xmark" size={18} color={theme.danger} />
                </RaisedButton>
                <RaisedButton 
                    onPress={handleUpdateProfile} 
                    disabled={loading}
                    borderRadius={20}
                    className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
                >
                    <IconSymbol name="checkmark" size={18} color={theme.primary} />
                </RaisedButton>
                </View>
            ) : (
                <RaisedButton 
                onPress={() => setIsEditing(true)}
                borderRadius={20}
                className="w-10 h-10 p-0 my-0 rounded-full items-center justify-center"
                >
                <IconSymbol name="pencil" size={18} color={theme.primary} />
                </RaisedButton>
            )}
            </View>
            
            <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden p-4">
                <View className="flex-row items-center justify-between py-2 border-b border-gray-100 dark:border-white/5">
                    <Text className="text-sm text-gray-500 font-medium">Email</Text>
                    <Text className="text-base text-gray-900 dark:text-white">{user?.email}</Text>
                </View>
                
                <View className="flex-row items-center justify-between py-2 border-b border-gray-100 dark:border-white/5">
                    <Text className="text-sm text-gray-500 font-medium">Username</Text>
                    {isEditing ? (
                        <View 
                        className="h-8 bg-black/5 dark:bg-white/5 rounded-lg border border-transparent min-w-[150px] justify-center pr-1"
                        >
                        <TextInput
                            className="text-base text-gray-900 dark:text-white text-right leading-none"
                            style={{ paddingTop: 0, paddingBottom: 0, height: '100%' }}
                            value={tempUsername}
                            onChangeText={setTempUsername}
                            placeholder="Username"
                            placeholderTextColor={theme.placeholder}
                            autoCapitalize="none"
                        />
                        </View>
                    ) : (
                        <Text className="h-8 text-base text-gray-900 dark:text-white pr-1 pt-1">{username || 'Not set'}</Text>
                    )}
                </View>

                <View className="flex-row items-center justify-between py-2">
                    <Text className="text-sm text-gray-500 font-medium">Full Name</Text>
                    {isEditing ? (
                        <View 
                        className="h-8 bg-black/5 dark:bg-white/5 rounded-lg border border-transparent min-w-[150px] justify-center pr-1"
                        >
                        <TextInput
                            className="text-base text-gray-900 dark:text-white text-right leading-none"
                            style={{ paddingTop: 0, paddingBottom: 0, height: '100%' }}
                            value={tempFullName}
                            onChangeText={setTempFullName}
                            placeholder="Full Name"
                            placeholderTextColor={theme.placeholder}
                        />
                        </View>
                    ) : (
                        <Text className="h-8 text-base text-gray-900 dark:text-white pr-1 pt-1">{fullName || 'Not set'}</Text>
                    )}
                </View>
            </View>
        </View>

        <View className="px-4">
            <RaisedButton 
            title="Sign Out" 
            onPress={handleSignOut} 
            className="mb-4 h-12 w-full"
            />
            
            <RaisedButton 
            title="Delete Account" 
            onPress={handleDeleteAccount} 
            className="h-12 w-full"
            textClassName="text-red-500 font-bold text-lg"
            />
        </View>
      </ScrollView>
    </View>
  );
}