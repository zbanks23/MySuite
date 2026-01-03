import { useState } from 'react';
import { View, TextInput, Text } from 'react-native';
import { supabase } from '@mysuite/auth';
import { RaisedButton } from '@mysuite/ui';
import { useRouter } from 'expo-router';
import { storage } from '../../utils/storage';

type AuthFormProps = {
  showGuestOption?: boolean;
  onSuccess?: () => void; // Optional callback for when auth succeeds (though router might replace)
};

export function AuthForm({ showGuestOption = true, onSuccess }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{
    type: 'idle' | 'typing' | 'signing-in' | 'success' | 'error' | 'info';
    message?: string;
  }>({ type: 'idle' });

  const handleSignUp = async () => {
    setStatus({ type: 'signing-in', message: 'Creating account...' });
    const redirectTo = `${process.env.EXPO_PUBLIC_SITE_URL ?? 'http://localhost:8081'}/auth`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus({ type: 'error', message: error.message });
      return;
    }

    if (data?.session) {
      setStatus({ type: 'success', message: 'Signed up and signed in.' });
      if (onSuccess) onSuccess();
    } else {
      setStatus({ type: 'info', message: 'Check your email for a confirmation link.' });
    }
  };

  const handleSignIn = async () => {
    setStatus({ type: 'signing-in', message: 'Signing in...' });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus({ type: 'error', message: error.message });
      return;
    }
    setStatus({ type: 'success', message: 'Signed in.' });
    if (onSuccess) onSuccess();
  };

  return (
    <View className="flex-1 justify-center p-4">
      <TextInput
        className="p-3 mb-4 border border-light rounded-lg bg-light-darker text-light dark:bg-dark-lighter dark:text-dark dark:border-dark"
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        className="p-3 mb-4 border border-light rounded-lg bg-light-darker text-light dark:bg-dark-lighter dark:text-dark dark:border-dark"
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setStatus((s) => (s.type === 'idle' ? { type: 'typing' } : s));
        }}
        secureTextEntry
        autoCapitalize="none"
      />
      {/* Status message */}
      {status.type !== 'idle' && (
        <Text
          className={
            `mb-3 text-sm ` +
            (status.type === 'error'
              ? 'text-red-600'
              : status.type === 'success'
              ? 'text-green-600'
              : status.type === 'signing-in'
              ? 'text-blue-600'
              : 'text-light dark:text-dark')
          }
          accessibilityLiveRegion="polite"
        >
          {status.message ?? (status.type === 'typing' ? 'Typing...' : '')}
        </Text>
      )}
      <RaisedButton title="Sign In" onPress={handleSignIn} className="h-12 my-2 w-full" />
      <RaisedButton title="Sign Up" onPress={handleSignUp} className="h-12 my-2 w-full" />
      
      {showGuestOption && (
        <RaisedButton 
            title="Continue as Guest" 
            onPress={async () => {
            setStatus({ type: 'signing-in', message: 'Entering as guest...' });
            await storage.setItem('myhealth_guest_mode', 'true');
            router.replace('/(tabs)');
            }} 
            className="h-12 my-2 w-full bg-light dark:bg-dark" 
        />
      )}
    </View>
  );
}
