// apps/mycpo/app/(tabs)/index.tsx
import { ThemedText } from '../../components/ui/ThemedText';
import { ThemedView } from '../../components/ui/ThemedView';
import { SharedButton } from '@mycsuite/ui';

export default function HomeScreen() {
  return (
    <ThemedView className="flex-1 items-center justify-center">
      <ThemedText type="title">Tab One</ThemedText>
      <SharedButton title="This is a v4 NativeWind button!" />
    </ThemedView>
  );
}