import { PropsWithChildren, useState } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';


import { IconSymbol } from "/ui";
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/ui/use-color-scheme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;

  return (
    <View>
      <TouchableOpacity
        className="flex-row items-center gap-1.5"
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}>
        <IconSymbol
          name="chevron.right"
          size={18}
          color={iconColor || '#000'}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <Text className="text-base leading-6 font-semibold">{title}</Text>
      </TouchableOpacity>
      {isOpen && <View className="mt-1.5 ml-6">{children}</View>}
    </View>
  );
}
