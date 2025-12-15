
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Button, Text, View, Alert } from 'react-native';
import { WorkoutManagerProvider, useWorkoutManager } from '../providers/WorkoutManagerProvider';

// Define the mock functions outside so we can access them
const mockUseAuth = jest.fn();

const mockIs = jest.fn(() => ({
    order: jest.fn(() => Promise.resolve({ data: [], error: null }))
}));

// Mock dependencies
jest.mock('@mycsuite/auth', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    is: mockIs,
                    order: jest.fn(() => Promise.resolve({ data: [], error: null }))
                })),
                order: jest.fn(() => Promise.resolve({ data: [], error: null }))
            })),
            insert: jest.fn(() => ({
                select: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({ data: { id: '1', name: 'Test' }, error: null }))
                }))
            })),
            delete: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ error: null }))
            })),
        })),
        functions: {
            invoke: jest.fn((fnName, options) => {
                if (fnName === 'create-workout') {
                    return Promise.resolve({
                        data: {
                            data: {
                                workout_id: 'new-id',
                                workout_name: options?.body?.workout_name || 'New Workout',
                                created_at: new Date().toISOString()
                            },
                            error: null
                        }
                    });
                }
                return Promise.resolve({ data: null, error: 'Function not mocked' });
            })
        }
    },
    useAuth: () => mockUseAuth()
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('WorkoutManagerProvider', () => {

    const TestConsumer = () => {
        const { savedWorkouts, saveWorkout } = useWorkoutManager();
        return (
            <View>
                <Text testID="saved-count">{savedWorkouts.length}</Text>
                <Button title="Save" onPress={() => saveWorkout('New Workout', [], () => {})} />
            </View>
        );
    };

    beforeEach(() => {
        // Default to logged in user
        mockUseAuth.mockReturnValue({ user: { id: 'test-user-id' } });
        jest.clearAllMocks();
    });

    it('initializes and handles race conditions correctly', async () => {
        const { getByTestId } = render(
            <WorkoutManagerProvider>
                <TestConsumer />
            </WorkoutManagerProvider>
        );

        // Wait for initial fetch to settle
        await waitFor(() => {
            expect(getByTestId('saved-count').children[0]).toBe('0');
        });
    });

    it('saves a workout to server when user is logged in', async () => {
        const { getByText, getByTestId } = render(
            <WorkoutManagerProvider>
                <TestConsumer />
            </WorkoutManagerProvider>
        );

        // Wait for initial fetch to avoid race condition
        await waitFor(() => {
            expect(getByTestId('saved-count').children[0]).toBe('0');
        });

        // Perform save
        fireEvent.press(getByText('Save'));

        // Wait for update
        await waitFor(() => {
             expect(getByTestId('saved-count').children[0]).toBe('1');
        });
    });

    it('saves a workout locally when user is NOT logged in', async () => {
        mockUseAuth.mockReturnValue({ user: null });

        const { getByText, getByTestId } = render(
            <WorkoutManagerProvider>
                <TestConsumer />
            </WorkoutManagerProvider>
        );
        
        // Wait for initial load (from local storage, mocked as empty here implicitly by not mocking localStorage behavior fully or expecting empty)
        await waitFor(() => {
            expect(getByTestId('saved-count').children[0]).toBe('0');
        });

        fireEvent.press(getByText('Save'));

        await waitFor(() => {
             expect(getByTestId('saved-count').children[0]).toBe('1');
        });
    });

    it('filters out routine-specific workouts by querying routine_id IS NULL', async () => {
        render(
            <WorkoutManagerProvider>
                <TestConsumer />
            </WorkoutManagerProvider>
        );

        // Wait for fetch
         await waitFor(() => {
             expect(mockIs).toHaveBeenCalledWith('routine_id', null);
         });
    });
});
