import React from 'react';
import { render } from '@testing-library/react-native';
import { RadialMenu } from '../components/ui/radial-menu/RadialMenu';

// Mock Reanimated and Gesture Handler as they are heavy native deps
jest.mock('react-native-reanimated', () => {
    const Reanimated = jest.requireActual('react-native-reanimated/mock');
    // Ensure default export is an object that can hold View etc or just a mock
    return {
        ...Reanimated,
        default: {
            View: jest.requireActual('react-native').View,
            Text: jest.requireActual('react-native').Text,
            createAnimatedComponent: (c: any) => c,
        },
        useSharedValue: jest.fn(() => ({ value: 0 })),
        useAnimatedStyle: jest.fn(() => ({})),
        withSpring: jest.fn(),
        runOnJS: jest.fn((fn) => fn),
    };
});

jest.mock('react-native-gesture-handler', () => {
    const View = jest.requireActual('react-native').View;
    return {
        GestureDetector: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
        Gesture: {
            Pan: () => ({
                activateAfterLongPress: () => ({
                    onStart: () => ({ onUpdate: () => ({ onEnd: () => {} }) })
                }),
            }),
            Tap: () => ({ onEnd: () => {} }),
            Race: () => {},
        }
    };
});

jest.mock("/ui", () => ({
    IconSymbol: 'IconSymbol'
}));

// Mock useUITheme
jest.mock('@mysuite/ui', () => ({
    useUITheme: () => ({
        background: 'white',
        bgLight: 'gray',
        text: 'black',
        primary: 'blue'
    })
}));

jest.mock('expo-haptics', () => ({
    ImpactFeedbackStyle: {
        Light: 'light',
        Medium: 'medium',
        Heavy: 'heavy',
    },
    impactAsync: jest.fn(),
}));

describe('RadialMenu', () => {
    const mockItems = [
        { id: '1', icon: 'star', label: 'Item 1', onPress: jest.fn() },
        { id: '2', icon: 'heart', label: 'Item 2', onPress: jest.fn() }
    ];

    it('renders without crashing', () => {
        const { toJSON } = render(
            <RadialMenu 
                items={mockItems} 
                icon="plus" 
            />
        );
        expect(toJSON()).toMatchSnapshot();
    });

    it('renders correct number of items', () => {
        const { getAllByText } = render(
            <RadialMenu 
                items={mockItems} 
                icon="plus" 
            />
        );
        expect(getAllByText(/Item/).length).toBe(2);
    });
});
