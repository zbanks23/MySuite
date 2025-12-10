import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, supabase } from '@mycsuite/auth';
import { useUITheme } from '@mycsuite/ui';
import { ThemedView } from '../components/ui/ThemedView';
import { IconSymbol } from '../components/ui/icon-symbol';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useNavigationSettings } from '../providers/NavigationSettingsProvider';

export default function SettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useUITheme();
  const { isFabEnabled, toggleFab } = useNavigationSettings();
  const [username, setUsername] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [loading, setLoading] = React.useState(false);

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

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    });
    setLoading(false);

    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Success', 'Profile updated successfully!');
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

  const styles = makeStyles(theme);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.backward" size={24} color={theme.text} />
          <Text style={{color: theme.text, fontSize: 16, marginLeft: 4}}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{width: 60}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <ThemeToggle />
          <View style={styles.row}>
             <Text style={styles.rowText}>Fast Action Button</Text>
             <Switch
                value={isFabEnabled}
                onValueChange={toggleFab}
                trackColor={{ false: theme.surface, true: theme.primary }}
                thumbColor={'#fff'}
             />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.surface }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={theme.icon}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.surface }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              placeholderTextColor={theme.icon}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.saveButton]} 
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert('Privacy Policy', 'Link to Privacy Policy')}>
            <Text style={styles.rowText}>Privacy Policy</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.icon || '#ccc'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.rowItem} onPress={() => Alert.alert('Terms of Service', 'Link to Terms of Service')}>
            <Text style={styles.rowText}>Terms of Service</Text>
            <IconSymbol name="chevron.right" size={20} color={theme.icon || '#ccc'} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.button} onPress={handleSignOut}>
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleDeleteAccount}>
            <Text style={[styles.buttonText, styles.dangerText]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </ThemedView>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60, // Safe area approximation
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.surface,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.icon,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.surface,
  },
  inputContainer: {
    paddingVertical: 12,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 16,
    borderBottomWidth: 0,
    backgroundColor: theme.surface,
    borderRadius: 8,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.surface,
  },
  label: {
    fontSize: 16,
    color: theme.text,
  },
  value: {
    fontSize: 16,
    color: theme.icon,
  },
  rowText: {
    fontSize: 16,
    color: theme.text,
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.surface,
  },
  buttonText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
  },
  dangerButton: {
    marginTop: 8,
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#EF4444', // Red
  },
  version: {
    textAlign: 'center',
    color: theme.icon,
    marginTop: 24,
    fontSize: 12,
  },
});
