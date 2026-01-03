
import { DataRepository, TABLES } from '../providers/DataRepository';
import { storage } from '../utils/storage';

// Mock Storage
jest.mock('../utils/storage', () => ({
    storage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
    },
}));

describe('Local-First Data Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should save a log to workout_logs and set_logs tables', async () => {
        // Arrange
        const logInput = {
            userId: 'user-1',
            name: 'Test Workout',
            exercises: [
                { 
                    id: 'ex-1', 
                    name: 'Pushups', 
                    completedSets: 1, 
                    sets: 3, // Added missing required field
                    reps: 10, // Added missing required field
                    logs: [{ id: 'set-1', weight: 0, reps: 10 }] 
                }
            ],
            duration: 100,
            date: '2025-01-01T10:00:00Z',
            createdAt: '2025-01-01T10:00:00Z',
            note: 'Good',
        };

        // Act
        const result = await DataRepository.saveLog(logInput);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();

        // Check Storage Calls
        // 1. Initial get table (empty)
        // 2. setItem for workout_logs
        // 3. setItem for set_logs
        
        // We expect setItem to be called for workout_logs
        const setItemCalls = (storage.setItem as jest.Mock).mock.calls;
        const workoutLogsCall = setItemCalls.find(c => c[0] === TABLES.WORKOUT_LOGS);
        const setLogsCall = setItemCalls.find(c => c[0] === TABLES.SET_LOGS);

        expect(workoutLogsCall).toBeDefined();
        expect(setLogsCall).toBeDefined();

        const savedWorkoutLog = workoutLogsCall[1][0];
        expect(savedWorkoutLog.workout_name).toBe('Test Workout');
        expect(savedWorkoutLog.user_id).toBe('user-1');
        
        const savedSetLog = setLogsCall[1][0];
        expect(savedSetLog.details.reps).toBe(10);
        expect(savedSetLog.exercise_id).toBe('ex-1');
    });

    it('should retrieve history by joining workout_logs and set_logs', async () => {
        // Arrange: Mock tables
        const mockWorkoutLogs = [{
            id: 'log-1',
            user_id: 'user-1',
            workout_name: 'History Workout',
            workout_time: '2025-01-02T10:00:00Z',
            duration: 60,
            created_at: '2025-01-02T10:00:00Z',
        }];
        const mockSetLogs = [{
            id: 'set-A',
            workout_log_id: 'log-1',
            exercise_id: 'ex-2',
            details: { exercise_name: 'Squats', reps: 5, weight: 100 }
        }];

        (storage.getItem as jest.Mock).mockImplementation((key) => {
            if (key === TABLES.WORKOUT_LOGS) return Promise.resolve(mockWorkoutLogs);
            if (key === TABLES.SET_LOGS) return Promise.resolve(mockSetLogs);
            return Promise.resolve(null);
        });

        // Act
        const history = await DataRepository.getHistory();

        // Assert
        expect(history).toHaveLength(1);
        const log = history[0];
        expect(log.name).toBe('History Workout');
        expect(log.exercises).toHaveLength(1);
        expect(log.exercises[0].name).toBe('Squats');
        expect(log.exercises[0].logs![0].weight).toBe(100);
    });
});
