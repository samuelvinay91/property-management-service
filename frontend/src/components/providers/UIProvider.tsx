'use client';

import { useEffect, createContext, useContext } from 'react';
import { useUIStore, initializeTheme } from '@/store/ui';

interface UIContextValue {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  isMobile: boolean;
  setIsMobile: (mobile: boolean) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

interface UIProviderProps {
  children: React.ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const {
    theme,
    setTheme,
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    isMobile,
    setIsMobile,
  } = useUIStore();

  useEffect(() => {
    initializeTheme();

    // Check if mobile on mount and window resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [setIsMobile]);

  const value: UIContextValue = {
    theme,
    setTheme,
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    isMobile,
    setIsMobile,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}