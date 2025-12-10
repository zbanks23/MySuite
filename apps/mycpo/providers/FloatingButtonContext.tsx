import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';


type ButtonId = 'nav' | 'action' | null;

interface FloatingButtonContextType {
  activeButtonId: ButtonId;
  setActiveButtonId: (id: ButtonId) => void;
}

const FloatingButtonContext = createContext<FloatingButtonContextType | undefined>(undefined);

export function FloatingButtonProvider({ children }: { children: ReactNode }) {
  const [activeButtonId, setActiveButtonIdState] = useState<ButtonId>(null);

  const setActiveButtonId = useCallback((id: ButtonId) => {
      console.log('FloatingButtonContext: SET ACTIVE ID:', id);
      setActiveButtonIdState(id);
  }, []);

  return (
    <FloatingButtonContext.Provider value={{ activeButtonId, setActiveButtonId }}>
      {children}
    </FloatingButtonContext.Provider>
  );
}

export function useFloatingButton() {
  const context = useContext(FloatingButtonContext);
  if (!context) {
    throw new Error('useFloatingButton must be used within a FloatingButtonProvider');
  }
  return context;
}
