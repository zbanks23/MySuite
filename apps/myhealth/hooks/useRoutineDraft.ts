import { useState } from "react";
import { createSequenceItem } from "../utils/workout-logic";

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
