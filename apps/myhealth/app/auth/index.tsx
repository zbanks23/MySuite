import { View } from 'react-native';
import { AuthForm } from '../../components/auth/AuthForm';

export default function AuthScreen() {
  return (
    <View className="flex-1">
      <AuthForm />
    </View>
  );
}