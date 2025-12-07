// apps/mycpo/app/(tabs)/index.tsx
import { StyleSheet } from 'react-native';
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import { SharedButton } from '@mycsuite/ui';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Tab One</ThemedText>
      <SharedButton title="This is a v4 NativeWind button!" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});