import { create } from 'zustand';

export const useUIStore = create((set) => ({
  isSidebarCollapsed: false,
  isMobileSidebarOpen: false,
  theme: localStorage.getItem('theme') || 'light',

  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { theme: newTheme };
    }),

  initTheme: () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));
