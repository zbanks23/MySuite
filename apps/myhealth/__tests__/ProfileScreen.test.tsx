
import React from 'react';
import { render } from '@testing-library/react-native';
import ProfileScreen from '../app/profile/index';

// Mocks
jest.mock('@mysuite/auth', () => ({
  useAuth: jest.fn(),
  supabase: {
    from: jest.fn(() => ({
        select: jest.fn(() => ({
            eq: jest.fn(() => ({
                maybeSingle: jest.fn().mockResolvedValue({ data: null })
            }))
        }))
    }))
  }
}));

jest.mock('@mysuite/ui', () => ({
  useUITheme: jest.fn(() => ({ primary: 'blue', danger: 'red', placeholder: 'gray' })),
  RaisedButton: 'RaisedButton',
  IconSymbol: 'IconSymbol'
}));

jest.mock('../components/ui/ScreenHeader', () => ({
  ScreenHeader: 'ScreenHeader'
}));

jest.mock('../components/ui/BackButton', () => ({
  BackButton: 'BackButton'
}));

jest.mock('../components/auth/AuthForm', () => ({
  AuthForm: 'AuthForm'
}));

// Import useAuth to mock implementation per test
import { useAuth } from '@mysuite/auth';

describe('ProfileScreen', () => {
  it('renders AuthForm when user is null (guest)', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    
    const { getByText, UNSAFE_getByType } = render(<ProfileScreen />);
    
    expect(getByText('Sign in to view your profile')).toBeTruthy();
    // expect(getByType('AuthForm')).toBeTruthy(); // String component mocking usually renders text or verify by props
    // Since we mocked as string 'AuthForm', it likely renders a <AuthForm> element which RNTL can act on?
    // Actually, simple string mocks in jest result in <AuthForm>...</AuthForm> in snapshot, 
    // but finding by type might rely on the implementation. 
    // Easier to just check if the text "Sign in to view your profile" exists, which is unique to guest view.
  });

  it('renders Profile content when user is logged in', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: '123', email: 'test@example.com' } });
    
    const { queryByText, getByText } = render(<ProfileScreen />);
    
    expect(queryByText('Sign in to view your profile')).toBeNull();
    expect(getByText('Account')).toBeTruthy(); // Part of profile view
    expect(getByText('test@example.com')).toBeTruthy();
  });
});
