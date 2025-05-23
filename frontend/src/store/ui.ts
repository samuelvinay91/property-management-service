import { create } from 'zustand';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;

  // Modals
  modals: Record<string, boolean>;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;

  // Loading states
  loading: Record<string, boolean>;
  setLoading: (key: string, loading: boolean) => void;

  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
  }>;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;

  // Filters and search
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  clearFilters: (prefix?: string) => void;

  // Page state
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // Mobile view
  isMobile: boolean;
  setIsMobile: (mobile: boolean) => void;

  // Selected items (for bulk operations)
  selectedItems: Record<string, string[]>;
  setSelectedItems: (key: string, items: string[]) => void;
  addSelectedItem: (key: string, item: string) => void;
  removeSelectedItem: (key: string, item: string) => void;
  clearSelectedItems: (key: string) => void;
  toggleSelectedItem: (key: string, item: string) => void;

  // View preferences
  viewMode: Record<string, 'grid' | 'list' | 'table'>;
  setViewMode: (key: string, mode: 'grid' | 'list' | 'table') => void;

  // Sort and pagination
  sortBy: Record<string, { field: string; direction: 'asc' | 'desc' }>;
  setSortBy: (key: string, field: string, direction: 'asc' | 'desc') => void;

  pagination: Record<string, { page: number; limit: number; total: number }>;
  setPagination: (key: string, pagination: { page: number; limit: number; total: number }) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Theme
  theme: 'system',
  setTheme: (theme: 'light' | 'dark' | 'system') => {
    set({ theme });
    localStorage.setItem('theme', theme);
  },

  // Modals
  modals: {},
  openModal: (modalId: string) =>
    set((state) => ({
      modals: { ...state.modals, [modalId]: true },
    })),
  closeModal: (modalId: string) =>
    set((state) => ({
      modals: { ...state.modals, [modalId]: false },
    })),
  toggleModal: (modalId: string) =>
    set((state) => ({
      modals: { ...state.modals, [modalId]: !state.modals[modalId] },
    })),

  // Loading states
  loading: {},
  setLoading: (key: string, loading: boolean) =>
    set((state) => ({
      loading: { ...state.loading, [key]: loading },
    })),

  // Notifications
  notifications: [],
  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      const duration = notification.duration || 5000;
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },
  removeNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  // Filters and search
  filters: {},
  setFilter: (key: string, value: any) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  clearFilters: (prefix?: string) =>
    set((state) => {
      if (prefix) {
        const newFilters = { ...state.filters };
        Object.keys(newFilters).forEach((key) => {
          if (key.startsWith(prefix)) {
            delete newFilters[key];
          }
        });
        return { filters: newFilters };
      }
      return { filters: {} };
    }),

  // Page state
  currentPage: '',
  setCurrentPage: (page: string) => set({ currentPage: page }),

  // Mobile view
  isMobile: false,
  setIsMobile: (mobile: boolean) => set({ isMobile: mobile }),

  // Selected items
  selectedItems: {},
  setSelectedItems: (key: string, items: string[]) =>
    set((state) => ({
      selectedItems: { ...state.selectedItems, [key]: items },
    })),
  addSelectedItem: (key: string, item: string) =>
    set((state) => ({
      selectedItems: {
        ...state.selectedItems,
        [key]: [...(state.selectedItems[key] || []), item],
      },
    })),
  removeSelectedItem: (key: string, item: string) =>
    set((state) => ({
      selectedItems: {
        ...state.selectedItems,
        [key]: (state.selectedItems[key] || []).filter((i) => i !== item),
      },
    })),
  clearSelectedItems: (key: string) =>
    set((state) => ({
      selectedItems: { ...state.selectedItems, [key]: [] },
    })),
  toggleSelectedItem: (key: string, item: string) =>
    set((state) => {
      const items = state.selectedItems[key] || [];
      const isSelected = items.includes(item);
      return {
        selectedItems: {
          ...state.selectedItems,
          [key]: isSelected
            ? items.filter((i) => i !== item)
            : [...items, item],
        },
      };
    }),

  // View preferences
  viewMode: {},
  setViewMode: (key: string, mode: 'grid' | 'list' | 'table') =>
    set((state) => ({
      viewMode: { ...state.viewMode, [key]: mode },
    })),

  // Sort and pagination
  sortBy: {},
  setSortBy: (key: string, field: string, direction: 'asc' | 'desc') =>
    set((state) => ({
      sortBy: { ...state.sortBy, [key]: { field, direction } },
    })),

  pagination: {},
  setPagination: (key: string, pagination: { page: number; limit: number; total: number }) =>
    set((state) => ({
      pagination: { ...state.pagination, [key]: pagination },
    })),
}));

// Initialize theme on app start
export const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
  if (savedTheme) {
    useUIStore.setState({ theme: savedTheme });
  }

  // Apply theme to document
  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  // Subscribe to theme changes
  useUIStore.subscribe(
    (state) => state.theme,
    (theme) => applyTheme(theme)
  );

  // Apply initial theme
  applyTheme(useUIStore.getState().theme);

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (useUIStore.getState().theme === 'system') {
      applyTheme('system');
    }
  });
};