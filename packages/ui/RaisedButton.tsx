import { Text, Pressable, View } from 'react-native';
import type { PressableProps } from 'react-native';
import { cssInterop } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import { useUITheme } from './theme';

// Enable className support for React Native components (if not already enabled globally)
cssInterop(Pressable, { className: 'style' });
cssInterop(Text, { className: 'style' });

export const RaisedButton = ({ title, className, textClassName, style, children, borderRadius = 12, ...props }: { title?: string; className?: string; textClassName?: string; children?: React.ReactNode; borderRadius?: number } & PressableProps) => {
  const theme = useUITheme();
  const defaultClasses = 'p-4 my-4 rounded-xl items-center justify-center bg-light dark:bg-dark border border-t-highlight border-l-highlight border-b-transparent border-r-transparent dark:border-t-highlight-dark dark:border-l-highlight-dark';
  const combined = `${defaultClasses}${className ? ' ' + className : ''}`;

  const shadowStyle = {
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  };

  return (
    <Pressable
      {...props}
      className={combined}
      style={[shadowStyle, { borderRadius }, style] as any}>
        {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => (
          <>
            {/* Base Gradient - Always Visible */}
            <LinearGradient
                colors={theme.dark 
                  ? ['hsla(0, 0%, 40%, 0.25)', 'hsla(0, 0%, 0%, 0.3)'] 
                  : ['hsla(0, 0%, 98%, 0.9)', 'hsla(0, 0%, 80%, 0.05)']}
                locations={[0.3, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: borderRadius,
                    zIndex: -1,
                }}
                pointerEvents="none"
            />

            {/* Interaction Gradient - Visible on Press/Hover */}
            {(pressed || hovered) && (
              <LinearGradient
                colors={theme.dark 
                  ? ['hsla(0, 0%, 50%, 0.25)', 'hsla(0, 0%, 10%, 0.3)'] 
                  : ['hsla(0, 0%, 98%, 0.9)', 'hsla(0, 0%, 80%, 0.05)']}
                locations={[0.5, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: borderRadius,
                    zIndex: -1,
                }}
                pointerEvents="none"
              />
            )}
            <View style={{ zIndex: 1 }}>
                {children ? children : <Text className={textClassName || "text-center text-primary font-bold text-lg"}>{title}</Text>}
            </View>
          </>
        )}
    </Pressable>
  );
};
