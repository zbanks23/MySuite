import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
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
  
  const text = theme.text;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: text }]}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <IconSymbol name="gearshape.fill" size={24} color={text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.icon }]}>Username</Text>
            <Text style={[styles.value, { color: text }]}>{username || 'Not set'}</Text>
        </View>
        <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.icon }]}>Full Name</Text>
            <Text style={[styles.value, { color: text }]}>{fullName || 'Not set'}</Text>
        </View>
      </View>

      <SharedButton title="Sign Out" onPress={handleSignOut} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40, // Adjust for safe area if needed, or use SafeAreaView
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  infoContainer: {
    marginBottom: 24,
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '500',
  },
});