import { useCallback, useEffect, useMemo, useState } from "react";
import { createSequenceItem } from "../../utils/workout-logic";
import { Routine } from "../../types";

export function useRoutineManager(routines: any[]) {
    // Active Routine progress state
    const [activeRoutine, setActiveRoutine] = useState<
        {
            id: string;
            dayIndex: number; // 0-based index in sequence
            lastCompletedDate?: string;
        } | null
    >(null);

    function startActiveRoutine(routineId: string) {
        setActiveRoutine({
            id: routineId,
            dayIndex: 0,
        });
    }

    function setActiveRoutineIndex(index: number) {
        setActiveRoutine((prev) =>
            prev
                ? { ...prev, dayIndex: index, lastCompletedDate: undefined }
                : null
        );
    }

    const markRoutineDayComplete = useCallback(() => {
        if (!activeRoutine) return;

        // 1. Mark today as complete
        setActiveRoutine((prev) =>
            prev
                ? ({
                    ...prev,
                    lastCompletedDate: new Date().toISOString(),
                })
                : null
        );
    }, [activeRoutine]);

    // Auto-advance routine day if completed on a previous day
    useEffect(() => {
        if (activeRoutine && activeRoutine.lastCompletedDate) {
            const lastDate = new Date(activeRoutine.lastCompletedDate);
            const today = new Date();
            // Reset hours to compare only dates
            lastDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);

            if (lastDate.getTime() < today.getTime()) {
                // It was completed yesterday or before -> Advance!
                // Find routine to know length for wrapping
                const routine = routines.find((r) => r.id === activeRoutine.id);
                const sequenceLength = routine?.sequence?.length || 1;

                setActiveRoutine((prev) =>
                    prev
                        ? ({
                            ...prev,
                            dayIndex: (prev.dayIndex + 1) % sequenceLength,
                            lastCompletedDate: undefined, // Clear completion so it's fresh for new day
                        })
                        : null
                );
            }
        }
    }, [activeRoutine, routines]);

    function clearActiveRoutine() {
        setActiveRoutine(null);
    }

    const setRoutineState = (newState: typeof activeRoutine) => {
        setActiveRoutine(newState);
    };

    return {
        activeRoutine,
        startActiveRoutine,
        setActiveRoutineIndex,
        markRoutineDayComplete,
        clearActiveRoutine,
        setRoutineState, // for persistence loading
    };
}

export const useRoutineDraft = (initialSequence: any[] = []) => {
    const [routineSequence, setRoutineSequence] = useState<any[]>(
        initialSequence,
    );

    function addDay(item: any) {
        const newItem = createSequenceItem(item);
        setRoutineSequence((s) => [...s, newItem]);
    }

    function removeDay(id: string) {
        setRoutineSequence((s) => s.filter((x) => x.id !== id));
    }

    return {
        routineSequence,
        setRoutineSequence,
        addDay,
        removeDay,
    };
};

export const useRoutineTimeline = (
    activeRoutineObj: Routine | undefined,
    dayIndex: number,
    routineViewMode: "next_3" | "next_7" | "week",
) => {
    return useMemo(() => {
        if (!activeRoutineObj?.sequence) return [];
        const seq = activeRoutineObj.sequence;
        const total = seq.length;
        if (total === 0) return [];

        const result = [];
        // Show up to 7 visible days (skipping future rest days)
        let i = 0;

        // Limits based on mode
        const countLimit = routineViewMode === "next_3"
            ? 3
            : routineViewMode === "next_7"
            ? 7
            : 7; // Week uses day limit, not count limit primarily
        const dayLimit = routineViewMode === "week" ? 7 : 30; // Next 3/7 look ahead further

        // Safety break at 30 days to prevent infinite loops if routine is weird
        while (result.length < countLimit && i < dayLimit) {
            const index = (dayIndex + i) % total;
            const item = seq[index];

            // Allow today (i=0) even if rest, otherwise skip rest days
            if (i === 0 || item.type !== "rest") {
                const d = new Date();
                d.setDate(d.getDate() + i);
                result.push({
                    ...item,
                    originalIndex: index,
                    date: d,
                });
            }
            i++;
        }
        return result;
    }, [activeRoutineObj, dayIndex, routineViewMode]);
};
